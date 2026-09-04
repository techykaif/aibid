import Link from "next/link";
import { notFound } from "next/navigation";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import { CATEGORIES, type Product } from "@/lib/types";
import BidForm from "@/app/components/BidForm";

export const revalidate = 30;
const demo: Product[]=[
{id:"demo-1",name:"Cursor",url:"https://cursor.com",tagline:"The AI code editor built for pair programming with models.",description:"A fast, focused coding environment where AI sits inside the editor.",category:"coding",totalBidUSD:2480,bidCount:42,status:"live"},
{id:"demo-2",name:"Perplexity",url:"https://perplexity.ai",tagline:"Search, research and answer with AI at the center.",category:"productivity",totalBidUSD:1920,bidCount:31,status:"live"},
{id:"demo-3",name:"Lovable",url:"https://lovable.dev",tagline:"Build production-ready apps by chatting with AI.",category:"coding",totalBidUSD:1540,bidCount:27,status:"live"},
{id:"demo-4",name:"Runway",url:"https://runwayml.com",tagline:"Generative video tools for the next generation of creators.",category:"video",totalBidUSD:1120,bidCount:19,status:"live"},
{id:"demo-5",name:"v0",url:"https://v0.dev",tagline:"Turn ideas into polished interfaces with generative UI.",category:"coding",totalBidUSD:860,bidCount:14,status:"live"},
{id:"demo-6",name:"Gamma",url:"https://gamma.app",tagline:"Create beautiful decks and docs without the busywork.",category:"writing",totalBidUSD:640,bidCount:11,status:"live"}];

export default async function ProductPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;let product:Product|undefined;let bids=[420,260,180];
 if(!isFirebaseConfigured){product=demo.find(p=>p.id===id);if(!product)notFound();}
 else{const snap=await db.collection("products").doc(id).get();if(!snap.exists||snap.data()?.status!=="live")notFound();product={id:snap.id,...snap.data()} as Product;const bs=await db.collection("bids").where("productId","==",id).where("status","==","confirmed").orderBy("createdAt","desc").limit(20).get();bids=bs.docs.map(d=>Number(d.data().amountUSD||0));}
 const category=CATEGORIES.find(c=>c.slug===product!.category)?.name||"AI Tools";
 return <main className="shell"><nav className="nav"><Link className="brand" href="/"><img src="/logo.svg" alt=""/>Ai<span>-Bid</span></Link><div className="navlinks"><Link className="button" href="/today">Today</Link><Link className="button primary" href="/submit">List your AI →</Link></div></nav><div className="product-hero"><article className="product-card"><div className="eyebrow">{category}</div><div className="product" style={{marginTop:18}}><img className="logo" src={product!.logoUrl||"/logo.svg"} alt=""/><div><h1>{product!.name}</h1><div className="muted">{product!.tagline}</div></div></div><p>{product!.description||product!.tagline}</p><div className="stats" style={{justifyContent:"flex-start"}}><div className="stat"><b>${Number(product!.totalBidUSD).toLocaleString()}</b> total bid</div><div className="stat"><b>{product!.bidCount}</b> bids</div></div><a className="button" href={product!.url} target="_blank" rel="noreferrer">Visit product ↗</a></article><aside className="metric"><div className="metric-label">Current position</div><div className="metric-value">#{demo.findIndex(p=>p.id===product!.id)+1||"—"}</div><div className="metric-label" style={{marginTop:24}}>Competitive move</div><div className="muted" style={{whiteSpace:"normal",lineHeight:1.5}}>Add a confirmed bid to push the product higher.</div></aside></div><BidForm productId={id} currentTotal={Number(product!.totalBidUSD)}/><section className="board" style={{marginTop:20}}><div className="boardhead"><div><strong>Bid activity</strong><div className="muted">Recent confirmed moves</div></div></div>{bids.map((amount,i)=><div className="row" key={i}><div className="rank">✦</div><div className="product"><img className="logo" src="/logo.svg" alt=""/><div><strong>{i===0?"Builder #104":i===1?"Anonymous":"Maya"}</strong><div className="muted">Recent bid</div></div></div><div className="count"/><div className="bid">+${amount.toLocaleString()}</div></div>)}</section></main>;
}