export const AI_CATEGORIES = [
  { slug: "coding", name: "AI Coding & Dev Tools" },
  { slug: "writing", name: "AI Writing & Content" },
  { slug: "image", name: "AI Image & Design" },
  { slug: "video", name: "AI Video & Audio" },
  { slug: "agents", name: "AI Agents & Automation" },
  { slug: "productivity", name: "AI Productivity & Chat" },
  { slug: "other", name: "Other / Uncategorized" },
] as const;

export const CATEGORIES = AI_CATEGORIES;
export const MARKETS = [
  { slug: "ai", name: "AI", categories: AI_CATEGORIES },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type MarketSlug = (typeof MARKETS)[number]["slug"];
export type ProductStatus = "pending" | "live" | "rejected";

export interface Product {
  id: string;
  name: string;
  url: string;
  tagline: string;
  description?: string;
  market?: MarketSlug;
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
