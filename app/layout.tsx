import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";
import "./market-primer.css";
import "./ui-polish.css";

export const metadata: Metadata = {
  title: "Ai-Bid — The visibility market for AI",
  description: "Discover AI products. Bid for attention. Climb the public leaderboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ai-bid.lol"),
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

const themeScript = `(() => { try { const s = localStorage.getItem('ai-bid-theme'); const d = s ? s === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark', d); } catch {} })()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
