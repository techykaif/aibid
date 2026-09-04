import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import { CATEGORIES } from "@/lib/types";
import BidForm from "@/app/components/BidForm";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const snap = await db.collection("products").doc(id).get(); if (!snap.exists || snap.data()?.status !== "live") notFound();
  const product = snap.data()!; const category = CATEGORIES.find(c=>c.slug===product.category)?.name || "AI Tools";
  const bids = await db.collection("bids").where("productId","==",id).where("status","==","confirmed").orderBy("createdAt","desc").limit(20).get();
  return <main className="shell"><nav className="nav"><Link className="brand" href="/" style={{color:"inherit",textDecoration:"none"}}>ai-bid<span>.lol</span></Link><Link className="button" href="/submit">List your AI</Link></nav>
    <article className="form"><div className="muted">{category}</div><div className="product" style={{marginTop:18}}>{product.logoUrl?<img className="logo" src={product.logoUrl} alt=""/>:<div className="logo"/>}<div><h1 style={{margin:0}}>{product.name}</h1><div className="muted">{product.tagline}</div></div></div><p style={{lineHeight:1.6}}>{product.description || product.tagline}</p><div className="stats" style={{justifyContent:"flex-start"}}><div className="stat"><b>${Number(product.totalBidUSD||0).toFixed(0)}</b> total bid</div><div className="stat"><b>{Number(product.bidCount||0)}</b> bids</div></div><p><a className="button" href={product.url} target="_blank" rel="noreferrer">Visit product ↗</a></p></article>
    <BidForm productId={id} currentTotal={Number(product.totalBidUSD||0)} />
    <section className="board" style={{marginTop:20}}><div className="boardhead"><strong>Bid history</strong></div>{bids.empty?<div className="empty">No bids yet.</div>:bids.docs.map(doc=>{const b=doc.data();return <div className="row" key={doc.id}><div className="rank">⚡</div><div className="product"><div><strong>{b.bidderName||"Anonymous"}</strong><div className="muted">{b.bidderTwitter||""}</div></div></div><div className="count"/><div className="bid">+${Number(b.amountUSD||0).toFixed(0)}</div></div>})}</section>
  </main>;
}