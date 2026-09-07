import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 180 * 1024;
const ALLOWED_CONTENT_TYPE = "image/webp";

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
    const contentType = String(data?.contentType || "");
    if (!bytes || contentType !== ALLOWED_CONTENT_TYPE) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes as Uint8Array);
    if (body.byteLength <= 0 || body.byteLength > MAX_LOGO_BYTES) {
      console.error("Stored logo exceeded the safe output limit", { productId: id, sizeBytes: body.byteLength });
      return NextResponse.json({ error: "Logo is temporarily unavailable" }, { status: 503 });
    }

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": ALLOWED_CONTENT_TYPE,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo is temporarily unavailable" }, { status: 503 });
  }
}
