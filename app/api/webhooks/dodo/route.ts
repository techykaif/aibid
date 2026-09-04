import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  try {
    const verifier = new Webhook(secret);
    await verifier.verify(raw, {
      "webhook-id": request.headers.get("webhook-id") || "",
      "webhook-signature": request.headers.get("webhook-signature") || "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
    });
    const event = JSON.parse(raw) as { type: string; data: Record<string, unknown> };
    if (event.type !== "payment.succeeded") return NextResponse.json({ received: true });

    const data = event.data;
    const metadata = (data.metadata || {}) as Record<string, string>;
    const productId = metadata.productId;
    const paymentId = String(data.payment_id || data.id || "");
    if (!productId || !paymentId) return NextResponse.json({ error: "Missing payment metadata" }, { status: 400 });

    const bidRef = db.collection("bids").doc(paymentId);
    const productRef = db.collection("products").doc(productId);
    const amountUSD = Number(metadata.bidUSD || Number(data.total_amount || 0) / 100);
    if (!Number.isFinite(amountUSD) || amountUSD <= 0) return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });

    await db.runTransaction(async (tx) => {
      const [bidSnap, productSnap] = await Promise.all([tx.get(bidRef), tx.get(productRef)]);
      if (bidSnap.exists) return;
      if (!productSnap.exists) throw new Error("Product not found");
      const product = productSnap.data()!;
      const now = new Date();
      tx.set(bidRef, { productId, amount: amountUSD, currency: String(data.currency || "USD"), amountUSD, bidderName: metadata.bidderName || null, bidderTwitter: metadata.bidderTwitter || null, dodoPaymentId: paymentId, status: "confirmed", createdAt: now });
      tx.update(productRef, { totalBidUSD: Number(product.totalBidUSD || 0) + amountUSD, bidCount: Number(product.bidCount || 0) + 1, lastBidAt: now, status: "live" });
      const date = now.toISOString().slice(0, 10);
      const dailyRef = db.collection("dailyStats").doc(date).collection("entries").doc(productId);
      const dailySnap = await tx.get(dailyRef);
      const daily = dailySnap.data() || {};
      tx.set(dailyRef, { totalBidTodayUSD: Number(daily.totalBidTodayUSD || 0) + amountUSD, bidCountToday: Number(daily.bidCountToday || 0) + 1 }, { merge: true });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook verification/processing failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }
}