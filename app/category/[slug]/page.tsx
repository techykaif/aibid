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

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const category=CATEGORIES.find(x=>x.slug===slug);
  const market=MARKETS.find(item=>item.categories.some(itemCategory=>itemCategory.slug===slug));
  const base="https://www.ai-bid.lol";

  if(!category || !market){
    return {
      title:"Category not found — Ai-Bid",
      robots:{index:false,follow:false},
    };
  }

  const canonical=`${base}/category/${encodeURIComponent(slug)}`;
  const title=`${category.name} — ${market.name} — Ai-Bid`;
  const description=`Public ${market.name} leaderboard for ${category.name}. Discover products and rank higher with confirmed bids.`;

  return {
    title,
    description,
    alternates:{canonical},
    robots:{index:true,follow:true},
    openGraph:{
      type:"website",
      url:canonical,
      title,
      description,
      siteName:"Ai-Bid",
    },
    twitter:{
      card:"summary",
      title,
      description,
    },
  };
}
