import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const schema = z.object({
  amount: z.coerce.number().min(1).max(1000000),
  email: z.string().email(),
  bidderName: z.string().max(80).optional().default(""),
  bidderTwitter: z.string().max(30).optional().default(""),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const product = await db.collection("products").doc(id).get();
    if (!product.exists || product.data()?.status !== "live") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const total = Number(product.data()?.totalBidUSD || 0);
    if (input.amount <= 0) {
      return NextResponse.json({ error: "Bid must be at least $1" }, { status: 400 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PRODUCT_ID;
    if (!apiKey || !productId) {
      return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol";
    const dodoBase = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "https://live.dodopayments.com"
      : "https://test.dodopayments.com";

    const response = await fetch(`${dodoBase}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
            amount: Math.round(input.amount * 100),
          },
        ],
        customer: { email: input.email },
        return_url: `${base}/checkout/success?product=${id}`,
        metadata: {
          productId: id,
          kind: "bid",
          bidUSD: input.amount.toFixed(2),
          bidderName: input.bidderName,
          bidderTwitter: input.bidderTwitter,
          previousTotalUSD: total.toFixed(2),
        },
      }),
    });

    const session = await response.json();
    if (!response.ok || !session.checkout_url) {
      return NextResponse.json(
        { error: session.message || session.detail || "Dodo checkout could not be created" },
        { status: 502 },
      );
    }

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Please check your bid details." : "Could not create checkout." },
      { status: 400 },
    );
  }
}
