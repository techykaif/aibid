import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ai-Bid — The visibility market for AI",
    short_name: "Ai-Bid",
    description: "Discover AI products, bid for attention, and climb the public visibility market.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#ff7a00",
    icons: [{ src: "/icon.svg", sizes: "64x64", type: "image/svg+xml" }],
  };
}
