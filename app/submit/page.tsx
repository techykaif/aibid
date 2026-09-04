"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

export default function SubmitPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", tagline: "", description: "", category: "coding", email: "", twitterHandle: "", bid: "5" });
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout");
      window.location.href = data.checkout_url;
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); setLoading(false); }
  }

  return <main className="shell"><nav className="nav"><Link className="brand" href="/" style={{color:"inherit",textDecoration:"none"}}>ai-bid<span>.lol</span></Link></nav>
    <form className="form" onSubmit={submit}><div className="eyebrow">Plant your flag</div><h1>List an AI product.</h1><p className="muted">Your first bid is part of the submission. Minimum $5. The bid is non-refundable.</p>
      <div className="field"><label>Product name</label><input maxLength={60} required value={form.name} onChange={e=>update("name",e.target.value)} placeholder="CodeWizard" /></div>
      <div className="field"><label>Product URL</label><input type="url" required value={form.url} onChange={e=>update("url",e.target.value)} placeholder="https://example.com" /></div>
      <div className="field"><label>One-line tagline</label><input maxLength={100} required value={form.tagline} onChange={e=>update("tagline",e.target.value)} placeholder="AI coding copilot for serious builders" /></div>
      <div className="field"><label>Description <span className="muted">optional</span></label><textarea maxLength={500} value={form.description} onChange={e=>update("description",e.target.value)} /></div>
      <div className="field"><label>Category</label><select value={form.category} onChange={e=>update("category",e.target.value)}>{CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div className="field"><label>Submitter email</label><input type="email" required value={form.email} onChange={e=>update("email",e.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label>X handle <span className="muted">optional</span></label><input value={form.twitterHandle} onChange={e=>update("twitterHandle",e.target.value)} placeholder="@yourproduct" /></div>
      <div className="field"><label>Opening bid (USD)</label><input type="number" min="5" step="1" required value={form.bid} onChange={e=>update("bid",e.target.value)} /></div>
      {error && <div className="error">{error}</div>}<button className="button primary" disabled={loading}>{loading ? "Opening checkout…" : `Pay $${Number(form.bid || 0).toFixed(0)} & launch`}</button>
    </form></main>;
}