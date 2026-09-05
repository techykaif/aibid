import { ImageResponse } from "next/og";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const alt = "ai-bid product leaderboard card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await db.collection("products").doc(id).get();
  const product = snap.data();

  let rank: number | null = null;
  if (snap.exists && product?.status === "live" && product?.category) {
    const board = await db
      .collection("products")
      .where("status", "==", "live")
      .where("category", "==", product.category)
      .orderBy("totalBidUSD", "desc")
      .get();
    const index = board.docs.findIndex((doc) => doc.id === id);
    rank = index >= 0 ? index + 1 : null;
  }

  const displayRank = rank === null ? "—" : String(rank);
  const totalBid = Number(product?.totalBidUSD || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px",
        background: "#080808",
        color: "#f5f5f5",
        fontFamily: "Arial",
      }}
    >
      <div style={{ fontSize: 28, color: "#ff7a00", fontWeight: 800 }}>ai-bid.lol</div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          marginTop: 28,
          maxWidth: 1060,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product?.name || "AI product"}
      </div>
      <div
        style={{
          fontSize: 30,
          color: "#a9a9a9",
          marginTop: 18,
          maxWidth: 1000,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product?.tagline || "Pay to rank."}
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 60, fontSize: 26 }}>
        <span>#{displayRank} rank</span>
        <span>${totalBid} total bid</span>
      </div>
    </div>,
    size,
  );
}
