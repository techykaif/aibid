import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(60), url: z.string().url().startsWith("https://"), tagline: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""), category: z.string(), email: z.string().email(), twitterHandle: z.string().max(30).optional().default(""), bid: z.coerce.number().min(5).max(1000000),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const categories = ["coding","writing","image","video","agents","productivity","other"];
    if (!categories.includes(input.category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const productRef = db.collection("products").doc();
    await productRef.set({ ...input, totalBidUSD: 0, bidCount: 0, status: "pending", createdAt: new Date(), lastBidAt: null });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol";
    const response = await fetch(`${process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com"}/checkouts`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
      body: JSON.stringify({
        product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1, product_price: Math.round(input.bid * 100), product_currency: "USD", product_description: `ai-bid listing: ${input.name}` }],
        customer: { email: input.email }, return_url: `${base}/checkout/success?product=${productRef.id}`,
        metadata: { productId: productRef.id, kind: "new_product", bidUSD: String(input.bid) },
      }),
    });
    const session = await response.json();
    if (!response.ok || !session.checkout_url) { await productRef.delete(); return NextResponse.json({ error: session.message || "Dodo checkout could not be created" }, { status: 502 }); }
    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? "Please check the form fields." : "Could not create checkout." }, { status: 400 }); }
}