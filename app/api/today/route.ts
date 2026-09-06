import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// Public API contract: never spread Firestore documents because submissions also
// contain private fields such as submitter email.
const PUBLIC_PRODUCT_FIELDS = [
  "name",
  "url",
  "tagline",
  "description",
  "category",
  "logoUrl",
  "twitterHandle",
  "clicks",
  "createdAt",
  "lastBidAt",
] as const;

function toPublicTodayProduct(
  id: string,
  data: FirebaseFirestore.DocumentData,
  totalBidUSD: unknown,
  bidCount: unknown,
) {
  return Object.fromEntries([
    ["id", id],
    ...PUBLIC_PRODUCT_FIELDS
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
    ["totalBidUSD", totalBidUSD],
    ["bidCount", bidCount],
  ]);
}

export async function GET() {
  // Firebase is intentionally optional while the public UI is being staged.
  if (!isFirebaseConfigured) return NextResponse.json([]);

  const date = new Date().toISOString().slice(0, 10);
  const stats = await db.collection("dailyStats").doc(date).collection("entries").orderBy("totalBidTodayUSD", "desc").limit(50).get();
  const products = await Promise.all(stats.docs.map(async (d) => {
    const p = await db.collection("products").doc(d.id).get();
    const data = p.data();
    const daily = d.data();
    return p.exists && data?.status === "live"
      ? toPublicTodayProduct(p.id, data, daily.totalBidTodayUSD, daily.bidCountToday)
      : null;
  }));
  return NextResponse.json(products.filter(Boolean), { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
}
