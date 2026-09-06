import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";

export default function ReportSuccessPage() {
  return (
    <main className="shell">
      <SiteHeader />
      <section className="empty" style={{ marginTop: 80 }}>
        <div className="empty-icon">✓</div>
        <strong>Report received.</strong>
        <span>Thanks. We’ll review the listing and take action when it breaks the rules.</span>
        <p style={{ marginTop: 18 }}><Link className="text-link" href="/">Return to the market <span>→</span></Link></p>
      </section>
    </main>
  );
}
