import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type DodoProductCartItem = {
  product_id?: unknown;
  quantity?: unknown;
};

type DodoPaymentData = {
  type?: unknown;
  payment_id?: unknown;
  id?: unknown;
  currency?: unknown;
  total_amount?: unknown;
  settlement_amount?: unknown;
  settlement_currency?: unknown;
  checkout_session_id?: unknown;
  metadata?: unknown;
  product_cart?: unknown;
};

type CheckoutIntent = {
  productId?: unknown;
  kind?: unknown;
  amountUSD?: unknown;
  dodoProductId?: unknown;
};

class CheckoutIntentUnavailableError extends Error {}

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });

  const webhookId = request.headers.get("webhook-id");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook signature headers" }, { status: 401 });
  }

  let event: { type: string; data: DodoPaymentData };
  try {
    const verifier = new Webhook(secret);
    await verifier.verify(raw, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    });
    event = JSON.parse(raw) as { type: string; data: DodoPaymentData };
  } catch (error) {
    console.error("Dodo webhook verification failed", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  if (event.type !== "payment.succeeded") return NextResponse.json({ received: true });

  try {
    const data = event.data || {};
    const metadata = (data.metadata || {}) as Record<string, string>;
    const paymentId = String(data.payment_id || data.id || "");
    const checkoutSessionId = String(data.checkout_session_id || "");
    const settlementCurrency = String(data.settlement_currency || "").toUpperCase();
    const cart = Array.isArray(data.product_cart) ? data.product_cart as DodoProductCartItem[] : [];
    const cartItem = cart[0];
    const totalAmountCents = Number(data.total_amount);
    const settlementAmountCents = Number(data.settlement_amount);
    const cartQuantity = Number(cartItem?.quantity);
    const expectedDodoProductId = process.env.DODO_PRODUCT_ID;

    if (
      !paymentId ||
      !checkoutSessionId ||
      !expectedDodoProductId ||
      cart.length !== 1 ||
      !cartItem ||
      cartQuantity !== 1 ||
      !Number.isSafeInteger(totalAmountCents) ||
      totalAmountCents <= 0 ||
      !Number.isSafeInteger(settlementAmountCents) ||
      settlementAmountCents <= 0 ||
      settlementCurrency !== "USD"
    ) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }

    if (String(cartItem.product_id || "") !== expectedDodoProductId) {
      return NextResponse.json({ error: "Invalid payment product" }, { status: 400 });
    }

    const bidRef = db.collection("bids").doc(paymentId);
    const intentRef = db.collection("checkoutIntents").doc(checkoutSessionId);
    const globalStatsRef = db.collection("stats").doc("global");
    const date = new Date().toISOString().slice(0, 10);

    await db.runTransaction(async (tx) => {
      const bidSnap = await tx.get(bidRef);
      if (bidSnap.exists) return;

      const intentSnap = await tx.get(intentRef);
      if (!intentSnap.exists) throw new CheckoutIntentUnavailableError("Checkout intent not found yet");

      const intent = intentSnap.data() as CheckoutIntent;
      const intentProductId = String(intent.productId || "");
      const intentKind = String(intent.kind || "");
      const intentDodoProductId = String(intent.dodoProductId || "");
      const amountUSD = Number(intent.amountUSD);
      const metadataProductId = metadata.productId;
      const metadataKind = metadata.kind;
      const metadataBidUSD = metadata.bidUSD === undefined ? null : Number(metadata.bidUSD);

      if (
        !intentProductId ||
        (intentKind !== "new_product" && intentKind !== "bid") ||
        intentDodoProductId !== expectedDodoProductId ||
        !Number.isFinite(amountUSD) ||
        amountUSD <= 0 ||
        (metadataProductId !== undefined && metadataProductId !== intentProductId) ||
        (metadataKind !== undefined && metadataKind !== intentKind) ||
        (metadataBidUSD !== null && (!Number.isFinite(metadataBidUSD) || Math.abs(amountUSD - metadataBidUSD) > 0.001)) ||
        Math.round(amountUSD * 100) !== settlementAmountCents
      ) {
        throw new Error("Payment does not match the server-created checkout intent");
      }

      const minimumUSD = intentKind === "new_product" ? 5 : 1;
      if (amountUSD < minimumUSD) {
        throw new Error("Payment amount below the required minimum");
      }

      const productRef = db.collection("products").doc(intentProductId);
      const dailyRef = db.collection("dailyStats").doc(date).collection("entries").doc(intentProductId);
      const productSnap = await tx.get(productRef);
      const dailySnap = await tx.get(dailyRef);
      const globalStatsSnap = await tx.get(globalStatsRef);
      if (!productSnap.exists) throw new Error("Product not found");

      const product = productSnap.data()!;
      if (intentKind === "new_product" && product.status !== "pending") {
        throw new Error("Product is no longer pending");
      }
      if (intentKind === "new_product") {
        const expectedBidUSD = Number(product.bid);
        if (!Number.isFinite(expectedBidUSD) || Math.abs(expectedBidUSD - amountUSD) > 0.001) {
          throw new Error("Payment amount does not match the pending product");
        }
      }
      if (intentKind === "bid" && product.status !== "live") {
        throw new Error("Product is no longer live");
      }

      const daily = dailySnap.data() || {};
      const globalStats = globalStatsSnap.data() || {};
      const now = new Date();
      const isFirstConfirmedBid = Number(product.bidCount || 0) === 0;

      tx.set(bidRef, {
        productId: intentProductId,
        amount: amountUSD,
        currency: "USD",
        amountUSD,
        bidderName: metadata.bidderName || null,
        bidderTwitter: metadata.bidderTwitter || null,
        dodoPaymentId: paymentId,
        status: "confirmed",
        createdAt: now,
      });
      tx.update(productRef, {
        totalBidUSD: Number(product.totalBidUSD || 0) + amountUSD,
        bidCount: Number(product.bidCount || 0) + 1,
        lastBidAt: now,
        status: "live",
      });
      tx.set(dailyRef, {
        totalBidTodayUSD: Number(daily.totalBidTodayUSD || 0) + amountUSD,
        bidCountToday: Number(daily.bidCountToday || 0) + 1,
      }, { merge: true });
      tx.set(globalStatsRef, {
        totalRevenueUSD: Number(globalStats.totalRevenueUSD || 0) + amountUSD,
        totalBids: Number(globalStats.totalBids || 0) + 1,
        totalProducts: Number(globalStats.totalProducts || 0) + (isFirstConfirmedBid ? 1 : 0),
      }, { merge: true });
      tx.delete(intentRef);
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook processing failed", error);
    if (error instanceof CheckoutIntentUnavailableError) {
      return NextResponse.json({ error: "Checkout intent is not available yet" }, { status: 503 });
    }
    return NextResponse.json({ error: "Webhook could not be reconciled" }, { status: 400 });
  }
}
