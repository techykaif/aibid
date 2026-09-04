import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/types";
export default function sitemap(): MetadataRoute.Sitemap { const base=process.env.NEXT_PUBLIC_SITE_URL||"https://ai-bid.lol"; return [{url:base,lastModified:new Date()},...CATEGORIES.map(c=>({url:`${base}/category/${c.slug}`,lastModified:new Date()})),{url:`${base}/submit`,lastModified:new Date()}]; }