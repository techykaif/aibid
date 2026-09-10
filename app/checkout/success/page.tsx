import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="shell">
      <div className="form" style={{ textAlign: "center", marginTop: 100 }}>
        <div className="board-label">CHECKOUT SUBMITTED</div>
        <h1>Payment confirmation pending.</h1>
        <p className="muted">
          Your listing or bid will go live only after the signed Dodo webhook confirms the payment. This page does not confirm payment status.
        </p>
        <Link className="button primary" href="/">
          See the leaderboard
        </Link>
      </div>
    </main>
  );
}
