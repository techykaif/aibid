import Link from "next/link";
import { notFound } from "next/navigation";
import Leaderboard from "@/app/components/Leaderboard";
import { CATEGORIES } from "@/lib/types";

export function generateStaticParams() { return CATEGORIES.map(c=>({slug:c.slug})); }
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const category=CATEGORIES.find(c=>c.slug===slug); if(!category) notFound(); return <main className="shell"><nav className="nav"><Link className="brand" href="/" style={{color:"inherit",textDecoration:"none"}}>ai-bid<span>.lol</span></Link><Link className="button primary" href="/submit">+ Submit & bid</Link></nav><header className="hero"><div className="eyebrow">Category board</div><h1>{category.name}</h1><p>Who wants the top spot badly enough to pay for it?</p></header><Leaderboard category={slug}/></main>; }

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const category=CATEGORIES.find(c=>c.slug===slug); return {title:category?`${category.name} — ai-bid.lol`:'Category — ai-bid.lol',description:category?`The public pay-to-rank leaderboard for ${category.name}.` : undefined}; }