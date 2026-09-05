import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const EMPTY_STATS = { totalRevenueUSD: 0, totalProducts: 0, totalBids: 0 };

export async function GET() {
  if (!isFirebaseConfigured) {
    return NextResponse.json(EMPTY_STATS, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" },
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
