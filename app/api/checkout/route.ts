import { NextResponse } from "next/server";
import { z } from "zod";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { db } from "@/lib/firebase-admin";
import type { DocumentReference } from "firebase-admin/firestore";
import { optimizeLogo } from "@/lib/logo";
import { CATEGORIES, MARKETS } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  url: z.string().url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must use HTTP or HTTPS"),
  tagline: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  market: z.literal("ai").default("ai"),
  category: z.enum(["coding", "writing", "image", "video", "agents", "productivity", "other"]),
  email: z.string().email(),
  twitterHandle: z.string().max(30).optional().default(""),
  bid: z.coerce.number().min(5).max(1000000),
});

const PROFANITY = ["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "fag", "slut", "whore"];

function containsProfanity(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, " ");
  return PROFANITY.some((term) => new RegExp(`(?:^|\\s)${term}(?:$|\\s)`).test(normalized));
}

function isPrivateOrLocalAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0;
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::(?:ffff:)?(\\d{1,3}(?:\\.\\d{1,3}){3})$/)?.[1];
    if (mappedIpv4 && isPrivateOrLocalAddress(mappedIpv4)) return true;

    const mappedIpv4Hex = normalized.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedIpv4Hex) {
      const high = Number.parseInt(mappedIpv4Hex[1], 16);
      const low = Number.parseInt(mappedIpv4Hex[2], 16);
      const ipv4 = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
      if (isPrivateOrLocalAddress(ipv4)) return true;
    }

    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
  }

  return false;
}

async function hostResolvesPublicly(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.length > 0 && addresses.every(({ address }) => !isPrivateOrLocalAddress(address));
}

async function urlResolves(url: string) {
  let current = new URL(url);
  if (current.username || current.password) return false;

  for (let attempt = 0; attempt <= 3; attempt += 1) {
    if (current.protocol !== "http:" && current.protocol !== "https:") return false;
    if (current.username || current.password) return false;
    if (current.hostname === "localhost" || current.hostname.endsWith(".localhost") || current.hostname.endsWith(".local")) return false;
    if (isIP(current.hostname) && isPrivateOrLocalAddress(current.hostname)) return false;
    if (!isIP(current.hostname)) {
      try {
        if (!(await hostResolvesPublicly(current.hostname))) return false;
      } catch {
        return false;
      }
    }

    const options = { redirect: "manual" as const, signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Ai-Bid-Submission-Check/1.0" } };
    try {
      const head = await fetch(current, { ...options, method: "HEAD" });
      if (head.status >= 200 && head.status < 300) return true;
      if (head.status === 405) {
        const get = await fetch(current, { ...options, method: "GET" });
        if (get.status >= 200 && get.status < 300) return true;
        if (![301, 302, 303, 307, 308].includes(get.status)) return false;
        const location = get.headers.get("location");
        if (!location) return false;
        current = new URL(location, current);
        continue;
      }
      if (![301, 302, 303, 307, 308].includes(head.status)) return false;
      const location = head.headers.get("location");
      if (!location) return false;
      current = new URL(location, current);
    } catch {
      return false;
    }
  }
  return false;
}

async function persistCheckoutIntent(sessionId: string, data: Record<string, unknown>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await db.collection("checkoutIntents").doc(sessionId).set(data);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  let productRef: DocumentReference | null = null;
  let logoCreated = false;
  let checkoutSessionCreated = false;

  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    let inputData: Record<string, unknown>;
    let logoFile: File | null = null;
    if (isMultipart) {
      const form = await request.formData();
      inputData = Object.fromEntries(["name", "url", "tagline", "description", "market", "category", "email", "twitterHandle", "bid"].map((key) => [key, form.get(key) ?? ""]));
      const candidate = form.get("logo");
      if (candidate instanceof File && candidate.size > 0) logoFile = candidate;
    } else {
      inputData = await request.json();
    }

    const input = schema.parse(inputData);
    const selectedMarket = MARKETS.find((market) => market.slug === input.market);
    if (!selectedMarket) return NextResponse.json({ error: "Invalid market" }, { status: 400 });
    const selectedCategory = CATEGORIES.find((category) => category.slug === input.category);
    if (!selectedCategory) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (!selectedMarket.categories.some((category) => category.slug === selectedCategory.slug)) return NextResponse.json({ error: "Category does not belong to the selected market" }, { status: 400 });
    if (containsProfanity(`${input.name} ${input.tagline}`)) return NextResponse.json({ error: "Please remove inappropriate language from the product name or tagline." }, { status: 400 });
    if (!(await urlResolves(input.url))) return NextResponse.json({ error: "That product URL could not be reached. Please check the URL and try again." }, { status: 400 });

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const dodoProductId = process.env.DODO_PRODUCT_ID;
    if (!apiKey || !dodoProductId) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });

    productRef = db.collection("products").doc();
    const productData = { ...input, totalBidUSD: 0, bidCount: 0, status: "pending", createdAt: new Date(), lastBidAt: null } as Record<string, unknown>;
    await productRef.set(productData);

    if (logoFile) {
      const optimized = await optimizeLogo(logoFile);
      await db.collection("productLogos").doc(productRef.id).set({ data: optimized.data, contentType: optimized.contentType, width: optimized.width, height: optimized.height, sizeBytes: optimized.sizeBytes, updatedAt: new Date() });
      logoCreated = true;
      productData.logoUrl = `/api/logo/${productRef.id}`;
      await productRef.update({ logoUrl: productData.logoUrl });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ai-bid.lol";
    const dodoBase = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const response = await fetch(`${dodoBase}/checkouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ product_cart: [{ product_id: dodoProductId, quantity: 1, amount: Math.round(input.bid * 100) }], allowed_payment_method_types: ["credit", "debit", "upi_collect"], customer: { email: input.email }, return_url: `${base}/checkout/success?product=${productRef.id}`, cancel_url: `${base}/checkout/cancel?product=${productRef.id}`, metadata: { productId: productRef.id, kind: "new_product", bidUSD: input.bid.toFixed(2), market: input.market } }),
    });

    const session = await response.json();
    const sessionId = typeof session.session_id === "string" ? session.session_id : "";
    if (!response.ok || !session.checkout_url || !sessionId) {
      await productRef.delete();
      if (logoCreated) await db.collection("productLogos").doc(productRef.id).delete();
      return NextResponse.json({ error: session.message || session.detail || "Dodo checkout could not be created" }, { status: 502 });
    }
    checkoutSessionCreated = true;

    await persistCheckoutIntent(sessionId, { productId: productRef.id, kind: "new_product", amountUSD: input.bid, dodoProductId, createdAt: new Date() });
    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) {
    if (productRef && !checkoutSessionCreated) {
      await productRef.delete().catch(() => undefined);
      if (logoCreated) await db.collection("productLogos").doc(productRef.id).delete().catch(() => undefined);
    }
    if (checkoutSessionCreated) {
      console.error("Dodo checkout was created but its checkout intent could not be persisted", error);
      return NextResponse.json({ error: "Checkout was created but could not be finalized. Please retry shortly." }, { status: 503 });
    }
    return NextResponse.json({ error: error instanceof z.ZodError ? "Please check the form fields." : "Could not create checkout." }, { status: 400 });
  }
}
