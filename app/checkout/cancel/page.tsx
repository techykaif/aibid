import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <main className="shell">
      <div className="form" style={{ textAlign: "center", marginTop: 100 }}>
        <div className="board-label">CHECKOUT CANCELED</div>
        <h1>No payment was confirmed.</h1>
        <p className="muted">
          Your listing or bid is not activated by this page. You can return to Ai-Bid and try again when you are ready.
        </p>
        <Link className="button primary" href="/">
          Return to the leaderboard
        </Link>
      </div>
    </main>
  );
}
