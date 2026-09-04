import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const nav = [
  ["Today", "/today"],
  ["Categories", "/#categories"],
  ["How it works", "/#how-it-works"],
] as const;

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Ai-Bid home">
        <img src="/logo.svg" alt="" />
        <span>Ai<span className="brand-mark">-Bid</span></span>
      </Link>
      <nav className="main-nav" aria-label="Primary navigation">
        {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link className="button primary" href="/submit">List your AI <span aria-hidden>→</span></Link>
      </div>
    </header>
  );
}
