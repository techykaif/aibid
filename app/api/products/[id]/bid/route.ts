import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const schema = z.object({ amount: z.coerce.number().min(1).max(1000000), email: z.string().email(), bidderName: z.string().max(80).optional().default(""), bidderTwitter: z.string().max(30).optional().default("") });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const product = await db.collection("products").doc(id).get();
    if (!product.exists || product.data()?.status !== "live") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const total = Number(product.data()?.totalBidUSD || 0);
    if (input.amount <= 0) return NextResponse.json({ error: "Bid must be at least $1" }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol";
    const response = await fetch(`${process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com"}/checkouts`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}` },
      body: JSON.stringify({ product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1, product_price: Math.round(input.amount * 100), product_currency: "USD", product_description: `Bid on ${product.data()?.name}` }], customer: { email: input.email }, return_url: `${base}/checkout/success?product=${id}`, metadata: { productId: id, kind: "bid", bidUSD: String(input.amount), bidderName: input.bidderName, bidderTwitter: input.bidderTwitter, previousTotalUSD: String(total) } }),
    });
    const session = await response.json();
    if (!response.ok || !session.checkout_url) return NextResponse.json({ error: session.message || "Dodo checkout could not be created" }, { status: 502 });
    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? "Please check your bid details." : "Could not create checkout." }, { status: 400 }); }
}