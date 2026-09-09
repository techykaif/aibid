import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/types";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const revalidate = 300;

const SITE_URL = "https://www.ai-bid.lol";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date() },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, lastModified: new Date() })),
    { url: `${SITE_URL}/submit`, lastModified: new Date() },
  ];

  if (!isFirebaseConfigured) return entries;

  try {
    const products = await db.collection("products")
      .where("status", "==", "live")
      .limit(5000)
      .get();

    entries.push(...products.docs.map((doc) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(doc.id)}`,
      lastModified: doc.data().lastBidAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
    })));
  } catch {
    // Keep the static AI sitemap available if the optional live-product read is unavailable.
  }

  return entries;
}
