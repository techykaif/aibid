import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import SiteHeader from "@/app/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productId } = await searchParams;
  let productName = "this listing";

  if (isFirebaseConfigured && productId) {
    try {
      const snap = await db.collection("products").doc(productId).get();
      if (snap.exists && snap.data()?.status === "live") productName = String(snap.data()?.name || productName);
    } catch {
      // The submit endpoint performs the authoritative product check.
    }
  }

  return (
    <main className="shell">
      <SiteHeader />
      <section className="form">
        <div className="eyebrow">Report listing</div>
        <h1>Flag {productName}</h1>
        <p className="muted" style={{ whiteSpace: "normal", lineHeight: 1.7 }}>
          Tell us what is wrong with this listing. Reports are reviewed after submission and may result in the listing being unpublished.
        </p>
        <form action="/api/reports" method="post">
          <input type="hidden" name="productId" value={productId || ""} />
          <div className="field">
            <label htmlFor="reason">Reason</label>
            <textarea id="reason" name="reason" required minLength={10} maxLength={500} placeholder="Describe the issue clearly." />
          </div>
          <button className="button primary button-lg" type="submit">Submit report</button>
        </form>
        <p style={{ marginTop: 18 }}><Link className="text-link" href="/">Return to the market <span>→</span></Link></p>
      </section>
    </main>
  );
}
