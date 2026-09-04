import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai-bid.lol — Outbid the AI world",
  description: "The pay-to-rank leaderboard for AI tools and AI-built products.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}