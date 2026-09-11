import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/types";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";

export const revalidate = 300;

const SITE_URL = "https://www.ai-bid.lol";
const LEGAL_PAGES = ["terms", "privacy", "rules", "faq"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/today` },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
    ...LEGAL_PAGES.map((page) => ({ url: `${SITE_URL}/legal/${page}` })),
  ];

  if (!isFirebaseConfigured) return entries;

  try {
    const products = await db.collection("products")
      .where("status", "==", "live")
      .limit(5000)
      .get();

    entries.push(...products.docs
      .filter((doc) => doc.data().market === "ai")
      .map((doc) => ({
        url: `${SITE_URL}/product/${encodeURIComponent(doc.id)}`,
        lastModified: doc.data().lastBidAt?.toDate?.() || doc.data().createdAt?.toDate?.() || undefined,
      })));
  } catch {
    // Keep the canonical static sitemap available if the optional live-product read is unavailable.
  }

  return entries;
}
