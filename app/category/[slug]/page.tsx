import Link from "next/link";
import { notFound } from "next/navigation";
import Leaderboard from "@/app/components/Leaderboard";
import SiteHeader from "@/app/components/SiteHeader";
import { CATEGORIES, MARKETS } from "@/lib/types";

export function generateStaticParams(){return CATEGORIES.map(c=>({slug:c.slug}))}
export const revalidate=15;

export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const category=CATEGORIES.find(c=>c.slug===slug);
  const market=MARKETS.find(item=>item.categories.some(c=>c.slug===slug));
  if(!category || !market) notFound();
  return <main className="shell"><SiteHeader/><header className="hero"><div className="hero-copy"><div className="eyebrow">{market.name.toUpperCase()} MARKET</div><h1>{category.name.replace("AI ","")}</h1><p>One category. One public ranking. Every confirmed bid changes the field.</p></div></header><div className="ticker"><span className="live-dot"/><b>{market.name.toUpperCase()}</b><span>·</span><span>{category.name}</span><span>·</span><span>Ranked by cumulative confirmed bids.</span></div><section className="market-section"><div className="boardhead"><div><div className="board-label">MARKET / CATEGORY</div><strong>{market.name} · {category.name}</strong><div className="muted">The market decides which products get attention.</div></div><Link className="button" href="/submit">List for {market.name} →</Link></div><Leaderboard category={slug}/></section><footer className="footer"><span>Ai-Bid</span><span>Discover · Bid · Win</span></footer></main>
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=CATEGORIES.find(x=>x.slug===slug);const market=MARKETS.find(item=>item.categories.some(category=>category.slug===slug));return{title:c?`${c.name} — ${market?.name || "Market"} — Ai-Bid`:"Category — Ai-Bid",description:c?`Public ${market?.name || "market"} leaderboard for ${c.name}.`:undefined}}
