import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import { CATEGORIES } from "@/lib/types";

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
  "totalBidUSD",
  "bidCount",
  "clicks",
  "createdAt",
  "lastBidAt",
] as const;

function toPublicProduct(id: string, data: FirebaseFirestore.DocumentData) {
  return Object.fromEntries([
    ["id", id],
    ...PUBLIC_PRODUCT_FIELDS
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  ]);
}

export async function GET(request: Request) {
  // Firebase is intentionally optional while the public UI is being staged.
  if (!isFirebaseConfigured) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  let query: FirebaseFirestore.Query = db.collection("products").where("status", "==", "live");
  if (category && CATEGORIES.some((item) => item.slug === category)) query = query.where("category", "==", category);
  query = query.orderBy("totalBidUSD", "desc").limit(limit);

  const snapshot = await query.get();
  const products = snapshot.docs.map((doc) => toPublicProduct(doc.id, doc.data()));
  return NextResponse.json(products, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
}
