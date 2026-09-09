import { ImageResponse } from "next/og";

export const alt = "Ai-Bid — The visibility market for AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#0d0d0d",
          color: "#fffaf5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              background: "#ff7a00",
              color: "#0d0d0d",
              fontSize: 27,
              fontWeight: 800,
            }}
          >
            AB
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Ai-Bid</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 18, letterSpacing: 5, color: "#ff7a00", fontWeight: 700 }}>THE VISIBILITY MARKET FOR AI</div>
          <div style={{ fontSize: 72, lineHeight: 1, letterSpacing: -4, fontWeight: 800, maxWidth: 1000 }}>
            Build it. Bid it. Be seen.
          </div>
          <div style={{ fontSize: 25, color: "#b8b1ab" }}>Discover AI products. Bid for attention. Climb the public leaderboard.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#8f8983" }}>
          <span>ai-bid.lol</span>
          <span>Confirmed bids · Public rankings</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
