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

const themeInitScript = `(() => {
  try {
    const saved = localStorage.getItem("ai-bid-theme");
    const theme = saved === "dark" || saved === "light"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
