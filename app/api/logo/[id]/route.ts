import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await db.collection("products").doc(id).get();
    if (!product.exists || product.data()?.status !== "live") {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    const logo = await db.collection("productLogos").doc(id).get();
    if (!logo.exists) return NextResponse.json({ error: "Logo not found" }, { status: 404 });

    const data = logo.data();
    const bytes = data?.data;
    if (!bytes) return NextResponse.json({ error: "Logo not found" }, { status: 404 });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": String(data.contentType || "image/webp"),
        "Content-Length": String(Number(data.sizeBytes || bytes.length)),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo is temporarily unavailable" }, { status: 503 });
  }
}
