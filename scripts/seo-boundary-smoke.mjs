const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";
const headers = { "user-agent": "Ai-Bid-SEO-Boundary-Smoke/1.0" };

const sitemap = await fetch(new URL("/sitemap.xml", baseUrl), {
  redirect: "manual",
  headers,
});
if (sitemap.status !== 200) {
  throw new Error(`sitemap returned HTTP ${sitemap.status}, expected 200`);
}
const sitemapType = sitemap.headers.get("content-type") || "";
if (!sitemapType.toLowerCase().includes("xml")) {
  throw new Error(`sitemap returned unexpected content type: ${sitemapType}`);
}
const sitemapBody = await sitemap.text();
if (!/<urlset[\s>]/i.test(sitemapBody)) {
  throw new Error("sitemap response is missing a urlset root");
}
const locs = [...sitemapBody.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
if (locs.length === 0) {
  throw new Error("sitemap contains no canonical URLs");
}
for (const loc of locs) {
  if (!/^https:\/\/www\.ai-bid\.lol(?:\/|$)/i.test(loc)) {
    throw new Error(`sitemap contains a non-canonical host: ${loc}`);
  }
  if (/\/games(?:\/|$)|games-|open-source|music/i.test(loc)) {
    throw new Error(`sitemap exposes a deferred future-market URL: ${loc}`);
  }
}
console.log(`PASS sitemap canonical/index boundary: ${locs.length} canonical URLs`);

const notFound = await fetch(new URL("/production-smoke-invalid-route-9f6e4d7a", baseUrl), {
  redirect: "manual",
  headers,
});
if (notFound.status !== 404) {
  throw new Error(`invalid route returned HTTP ${notFound.status}, expected 404`);
}
const notFoundBody = await notFound.text();
if (!/<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"']noindex, ?nofollow[\"']/i.test(notFoundBody)) {
  throw new Error("404 response is missing its noindex, nofollow boundary");
}
console.log("PASS 404 noindex boundary: HTTP 404 + noindex,nofollow");
