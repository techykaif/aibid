"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

export default function SubmitPage() {
  const [form, setForm] = useState({name:"",url:"",tagline:"",description:"",category:"coding",email:"",twitterHandle:"",bid:"5"});
  const [preview,setPreview]=useState(false); const update=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));
  return <main className="shell">
    <nav className="nav"><Link className="brand" href="/"><img src="/logo.svg" alt=""/>Ai<span>-Bid</span></Link><Link className="button" href="/">Back to market</Link></nav>
    <div className="demo-banner"><b>PREVIEW MODE</b><span>Payments are intentionally offline while we finish the UI.</span></div>
    <div className="submit-grid"><form className="form" onSubmit={e=>{e.preventDefault();setPreview(true)}}>
      <div className="eyebrow">List your product</div><h1>Buy your place on the board.</h1><p className="muted" style={{whiteSpace:"normal",lineHeight:1.6}}>Every listing starts with a bid. Choose your category, tell people what you built, then compete for attention.</p>
      <div className="field"><label>Product name</label><input maxLength={60} required value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Your product"/></div>
      <div className="field"><label>Product URL</label><input type="url" required value={form.url} onChange={e=>update("url",e.target.value)} placeholder="https://yourproduct.com"/></div>
      <div className="field"><label>One-line pitch</label><input maxLength={100} required value={form.tagline} onChange={e=>update("tagline",e.target.value)} placeholder="The fastest way to…"/></div>
      <div className="field"><label>Description <span className="muted">optional</span></label><textarea maxLength={500} value={form.description} onChange={e=>update("description",e.target.value)} placeholder="What makes this worth discovering?"/></div>
      <div className="field"><label>Category</label><select value={form.category} onChange={e=>update("category",e.target.value)}>{CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={e=>update("email",e.target.value)} placeholder="For your receipt and listing updates"/></div>
      <div className="field"><label>X handle <span className="muted">optional</span></label><input value={form.twitterHandle} onChange={e=>update("twitterHandle",e.target.value)} placeholder="@yourproduct"/></div>
      <div className="field"><label>Opening bid</label><input type="number" min="5" step="1" required value={form.bid} onChange={e=>update("bid",e.target.value)}/></div>
      <button className="button primary" type="submit">Preview listing · ${Number(form.bid||0).toFixed(0)} →</button>
      {preview&&<p className="success">Looks good. Checkout will be enabled after credentials are connected.</p>}
    </form>
    <aside className="form-aside"><div className="eyebrow">How it works</div><h3>Turn attention into a position.</h3><p>No subscriptions. No complicated ad manager. Your cumulative confirmed bid is your position.</p><ul><li><b>01</b> · Create your listing</li><li><b>02</b> · Place the opening bid</li><li><b>03</b> · Get a public product page</li><li><b>04</b> · Outbid the field</li></ul><div className="metric"><div className="metric-label">Minimum opening bid</div><div className="metric-value">$5</div></div></aside></div>
  </main>;
}