import Link from "next/link";
import { notFound } from "next/navigation";
import Leaderboard from "@/app/components/Leaderboard";
import { CATEGORIES } from "@/lib/types";

export function generateStaticParams(){return CATEGORIES.map(c=>({slug:c.slug}))}
export const revalidate=15;
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const category=CATEGORIES.find(c=>c.slug===slug);if(!category)notFound();return <main className="shell"><nav className="nav"><Link className="brand" href="/"><img src="/logo.svg" alt=""/>Ai<span>-Bid</span></Link><div className="navlinks"><Link className="button" href="/today">Today</Link><Link className="button primary" href="/submit">List your AI →</Link></div></nav><header className="hero"><div className="eyebrow">Category market</div><h1>{category.name.replace("AI ","")}</h1><p>One category. One public ranking. Every confirmed bid changes the field.</p></header><div className="ticker">✦ <b>{category.slug.toUpperCase()}</b> · ranked by cumulative confirmed bids</div><Leaderboard category={slug}/><footer className="footer">Ai-Bid · Discover. Bid. Win.</footer></main>}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=CATEGORIES.find(x=>x.slug===slug);return{title:c?`${c.name} — Ai-Bid`:"Category — Ai-Bid",description:c?`Public leaderboard for ${c.name}.`:undefined}}