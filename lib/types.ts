export const CATEGORIES = [
  { slug: "coding", name: "AI Coding & Dev Tools" },
  { slug: "writing", name: "AI Writing & Content" },
  { slug: "image", name: "AI Image & Design" },
  { slug: "video", name: "AI Video & Audio" },
  { slug: "agents", name: "AI Agents & Automation" },
  { slug: "productivity", name: "AI Productivity & Chat" },
  { slug: "other", name: "Other / Uncategorized" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type ProductStatus = "pending" | "live" | "rejected";

export interface Product {
  id: string;
  name: string;
  url: string;
  tagline: string;
  description?: string;
  category: CategorySlug;
  logoUrl?: string;
  twitterHandle?: string;
  totalBidUSD: number;
  bidCount: number;
  clicks?: number;
  status: ProductStatus;
  createdAt?: string;
  lastBidAt?: string;
}

export interface Bid {
  id: string;
  productId: string;
  amountUSD: number;
  bidderName?: string;
  bidderTwitter?: string;
  createdAt?: string;
}
