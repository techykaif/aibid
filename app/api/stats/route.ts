import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  if (!isFirebaseConfigured) {
    return NextResponse.json({ error: "Stats are temporarily unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const snapshot = await db.collection("stats").doc("global").get();
  const data = snapshot.data() || {};
  return NextResponse.json({
    totalRevenueUSD: Number(data.totalRevenueUSD || 0),
    totalProducts: Number(data.totalProducts || 0),
    totalBids: Number(data.totalBids || 0),
  }, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" },
  });
}
