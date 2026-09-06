import { NextResponse } from "next/server";
import { z } from "zod";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const schema = z.object({
  productId: z.string().trim().min(1).max(128),
  reason: z.string().trim().min(10).max(500),
});

export async function POST(request: Request) {
  try {
    if (!isFirebaseConfigured) {
      return NextResponse.json({ error: "Reporting is temporarily unavailable." }, { status: 503 });
    }

    const input = schema.parse(await request.formData().then((form) => ({
      productId: form.get("productId"),
      reason: form.get("reason"),
    })));

    const product = await db.collection("products").doc(input.productId).get();
    if (!product.exists || product.data()?.status !== "live") {
      return NextResponse.json({ error: "That product is no longer available for reporting." }, { status: 404 });
    }

    await db.collection("reports").add({
      productId: input.productId,
      reason: input.reason,
      status: "open",
      createdAt: new Date(),
    });

    return NextResponse.redirect(new URL(`/report/success?product=${encodeURIComponent(input.productId)}`, request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Please provide a valid report reason." : "Could not submit the report." },
      { status: 400 },
    );
  }
}
