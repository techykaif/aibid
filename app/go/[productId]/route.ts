import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  if (!isFirebaseConfigured) {
    return NextResponse.json({ error: "Click tracking is unavailable in preview mode." }, { status: 503 });
  }

  const productRef = db.collection("products").doc(productId);
  const destination = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(productRef);
    if (!snapshot.exists || snapshot.data()?.status !== "live") return null;

    const url = String(snapshot.data()?.url || "");
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    } catch {
      return null;
    }

    transaction.update(productRef, { clicks: FieldValue.increment(1) });
    return url;
  });

  if (!destination) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.redirect(destination, 302);
}
