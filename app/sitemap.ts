import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/types";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol";
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date() },
    ...CATEGORIES.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: new Date() })),
    { url: `${base}/submit`, lastModified: new Date() },
  ];

  if (!isFirebaseConfigured) return entries;

  try {
    const products = await db.collection("products")
      .where("status", "==", "live")
      .limit(5000)
      .get();

    entries.push(...products.docs.map((doc) => ({
      url: `${base}/product/${encodeURIComponent(doc.id)}`,
      lastModified: doc.data().lastBidAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
    })));
  } catch {
    // Keep the static AI sitemap available if the optional live-product read is unavailable.
  }

  return entries;
}
