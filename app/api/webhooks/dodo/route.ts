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
    const amountUSD = Number(metadata.bidUSD || Number(data.total_amount || 0) / 100);
    if (!productId || !paymentId || !Number.isFinite(amountUSD) || amountUSD <= 0) return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });

    const bidRef = db.collection("bids").doc(paymentId);
    const productRef = db.collection("products").doc(productId);
    const globalStatsRef = db.collection("stats").doc("global");
    const date = new Date().toISOString().slice(0, 10);
    const dailyRef = db.collection("dailyStats").doc(date).collection("entries").doc(productId);

    await db.runTransaction(async (tx) => {
      const bidSnap = await tx.get(bidRef);
      if (bidSnap.exists) return;
      const productSnap = await tx.get(productRef);
      const dailySnap = await tx.get(dailyRef);
      const globalStatsSnap = await tx.get(globalStatsRef);
      if (!productSnap.exists) throw new Error("Product not found");
      const product = productSnap.data()!;
      const daily = dailySnap.data() || {};
      const globalStats = globalStatsSnap.data() || {};
      const now = new Date();
      const isFirstConfirmedBid = Number(product.bidCount || 0) === 0;

      tx.set(bidRef, { productId, amount: amountUSD, currency: String(data.currency || "USD"), amountUSD, bidderName: metadata.bidderName || null, bidderTwitter: metadata.bidderTwitter || null, dodoPaymentId: paymentId, status: "confirmed", createdAt: now });
      tx.update(productRef, { totalBidUSD: Number(product.totalBidUSD || 0) + amountUSD, bidCount: Number(product.bidCount || 0) + 1, lastBidAt: now, status: "live" });
      tx.set(dailyRef, { totalBidTodayUSD: Number(daily.totalBidTodayUSD || 0) + amountUSD, bidCountToday: Number(daily.bidCountToday || 0) + 1 }, { merge: true });
      tx.set(globalStatsRef, {
        totalRevenueUSD: Number(globalStats.totalRevenueUSD || 0) + amountUSD,
        totalBids: Number(globalStats.totalBids || 0) + 1,
        totalProducts: Number(globalStats.totalProducts || 0) + (isFirstConfirmedBid ? 1 : 0),
      }, { merge: true });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook verification/processing failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }
}
