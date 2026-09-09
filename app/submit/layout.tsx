import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List your AI product — Ai-Bid",
  description: "Submit an AI product to Ai-Bid and start its visibility position with a confirmed bid.",
  robots: { index: false, follow: true },
};

export default function SubmitLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
