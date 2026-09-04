import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ai-Bid — The visibility market for AI",
  description: "Discover AI products. Bid for attention. Climb the public leaderboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol"),
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}