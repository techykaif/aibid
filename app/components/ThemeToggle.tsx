"use client";

import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (!localStorage.getItem("ai-bid-theme")) {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ai-bid-theme", next ? "dark" : "light");
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <svg className="theme-icon theme-moon" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.4 12.7A7 7 0 0 1 7.3 3.6 7.5 7.5 0 1 0 16.4 12.7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <svg className="theme-icon theme-sun" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
    </button>
  );
}
