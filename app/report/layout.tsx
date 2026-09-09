import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a listing — Ai-Bid",
  robots: { index: false, follow: true },
};

export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
