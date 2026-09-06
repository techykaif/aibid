import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, isFirebaseConfigured } from "@/lib/firebase-admin";
import SiteHeader from "@/app/components/SiteHeader";

export const dynamic = "force-dynamic";

async function moderate(formData: FormData) {
  "use server";

  const store = await cookies();
  const token = store.get("aibid_admin")?.value || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || token !== expected) redirect("/admin/login");

  const reportId = String(formData.get("reportId") || "");
  const productId = String(formData.get("productId") || "");
  const action = String(formData.get("action") || "");
  if (!reportId || !productId) return;

  const batch = db.batch();
  if (action === "reject") {
    batch.update(db.collection("products").doc(productId), { status: "rejected" });
  }
  batch.update(db.collection("reports").doc(reportId), {
    status: action === "reject" ? "actioned" : "dismissed",
    reviewedAt: new Date(),
  });
  await batch.commit();
}

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get("aibid_admin")?.value || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || token !== expected) redirect("/admin/login");

  if (!isFirebaseConfigured) {
    return <main className="shell"><SiteHeader /><section className="empty" style={{ marginTop: 80 }}><strong>Firebase is not configured.</strong><span>Moderation data is unavailable.</span></section></main>;
  }

  const reports = await db.collection("reports").where("status", "==", "open").orderBy("createdAt", "desc").limit(100).get();
  const productIds = [...new Set(reports.docs.map((doc) => String(doc.data().productId || "")))].filter(Boolean);
  const products = new Map<string, string>();
  await Promise.all(productIds.map(async (id) => {
    const snap = await db.collection("products").doc(id).get();
    if (snap.exists) products.set(id, String(snap.data()?.name || id));
  }));

  return (
    <main className="shell">
      <SiteHeader />
      <section className="board">
        <div className="boardhead" style={{ padding: 20 }}>
          <div><div className="eyebrow">Protected admin</div><strong>Open reports</strong><div className="muted">Review listings and unpublish rule-breaking products.</div></div>
        </div>
        {reports.docs.length === 0 ? (
          <div className="empty"><div className="empty-icon">✓</div><strong>No open reports.</strong><span>The moderation queue is clear.</span></div>
        ) : reports.docs.map((report) => {
          const data = report.data();
          const productId = String(data.productId || "");
          return (
            <article className="row" key={report.id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <div className="product" style={{ alignItems: "flex-start" }}>
                <div className="product-copy">
                  <strong>{products.get(productId) || productId}</strong>
                  <div className="muted" style={{ whiteSpace: "normal", marginTop: 6 }}>{String(data.reason || "")}</div>
                  <div className="muted" style={{ marginTop: 6 }}>Report {report.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <form action={moderate}><input type="hidden" name="reportId" value={report.id} /><input type="hidden" name="productId" value={productId} /><input type="hidden" name="action" value="dismiss" /><button className="button" type="submit">Dismiss</button></form>
                <form action={moderate}><input type="hidden" name="reportId" value={report.id} /><input type="hidden" name="productId" value={productId} /><input type="hidden" name="action" value="reject" /><button className="button primary" type="submit">Unpublish</button></form>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
