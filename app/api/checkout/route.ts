import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import type { DocumentReference } from "firebase-admin/firestore";
import { optimizeLogo } from "@/lib/logo";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  url: z.string().url().startsWith("https://"),
  tagline: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  category: z.string(),
  email: z.string().email(),
  twitterHandle: z.string().max(30).optional().default(""),
  bid: z.coerce.number().min(5).max(1000000),
});

const categories = ["coding", "writing", "image", "video", "agents", "productivity", "other"];
const PROFANITY = ["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "fag", "slut", "whore"];

function containsProfanity(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, " ");
  return PROFANITY.some((term) => new RegExp(`(?:^|\\s)${term}(?:$|\\s)`).test(normalized));
}

async function urlResolves(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Ai-Bid-Submission-Check/1.0" },
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let productRef: DocumentReference | null = null;
  let logoCreated = false;

  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    let inputData: Record<string, unknown>;
    let logoFile: File | null = null;

    if (isMultipart) {
      const form = await request.formData();
      inputData = Object.fromEntries(
        ["name", "url", "tagline", "description", "category", "email", "twitterHandle", "bid"].map((key) => [key, form.get(key) ?? ""]),
      );
      const candidate = form.get("logo");
      if (candidate instanceof File && candidate.size > 0) logoFile = candidate;
    } else {
      inputData = await request.json();
    }

    const input = schema.parse(inputData);
    if (!categories.includes(input.category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (containsProfanity(`${input.name} ${input.tagline}`)) {
      return NextResponse.json({ error: "Please remove inappropriate language from the product name or tagline." }, { status: 400 });
    }
    if (!(await urlResolves(input.url))) {
      return NextResponse.json({ error: "That product URL could not be reached. Please check the URL and try again." }, { status: 400 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const dodoProductId = process.env.DODO_PRODUCT_ID;
    if (!apiKey || !dodoProductId) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });

    productRef = db.collection("products").doc();
    const productData = {
      ...input,
      totalBidUSD: 0,
      bidCount: 0,
      status: "pending",
      createdAt: new Date(),
      lastBidAt: null,
    } as Record<string, unknown>;

    await productRef.set(productData);

    if (logoFile) {
      const optimized = await optimizeLogo(logoFile);
      await db.collection("productLogos").doc(productRef.id).set({
        data: optimized.data,
        contentType: optimized.contentType,
        width: optimized.width,
        height: optimized.height,
        sizeBytes: optimized.sizeBytes,
        updatedAt: new Date(),
      });
      logoCreated = true;
      productData.logoUrl = `/api/logo/${productRef.id}`;
      await productRef.update({ logoUrl: productData.logoUrl });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol";
    const dodoBase = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const response = await fetch(`${dodoBase}/checkouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        product_cart: [{ product_id: dodoProductId, quantity: 1, amount: Math.round(input.bid * 100) }],
        customer: { email: input.email },
        return_url: `${base}/checkout/success?product=${productRef.id}`,
        metadata: { productId: productRef.id, kind: "new_product", bidUSD: input.bid.toFixed(2) },
      }),
    });

    const session = await response.json();
    if (!response.ok || !session.checkout_url) {
      await productRef.delete();
      if (logoCreated) await db.collection("productLogos").doc(productRef.id).delete();
      return NextResponse.json({ error: session.message || session.detail || "Dodo checkout could not be created" }, { status: 502 });
    }

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) {
    if (productRef) await productRef.delete().catch(() => undefined);
    if (productRef && logoCreated) await db.collection("productLogos").doc(productRef.id).delete().catch(() => undefined);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Please check the form fields." : error instanceof Error ? error.message : "Could not create checkout." },
      { status: 400 },
    );
  }
}
