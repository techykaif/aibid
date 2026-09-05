import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";
import "./market-primer.css";
import "./ui-polish.css";
import "./bid-polish.css";
import "./mobile-parity.css";

export const metadata: Metadata = {
  title: "Ai-Bid — The visibility market for AI",
  description: "Discover AI products. Bid for attention. Climb the public leaderboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol"),
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><div id="main-content" tabIndex={-1}>{children}</div></body></html>;
}
