const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";

const checks = [
  ["homepage", "/"],
  ["today API", "/api/today"],
  ["products API", "/api/products"],
  ["stats API", "/api/stats"],
  ["robots", "/robots.txt"],
  ["sitemap", "/sitemap.xml"],
  ["terms", "/legal/terms"],
  ["privacy", "/legal/privacy"],
  ["rules", "/legal/rules"],
  ["faq", "/legal/faq"],
];

for (const [name, path] of checks) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    headers: { "user-agent": "Ai-Bid-Production-Smoke/1.0" },
  });

  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${name} returned HTTP ${response.status}`);
  }

  if (path.startsWith("/api/")) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`${name} did not return JSON`);
    }

    const body = await response.text();
    if (body.includes('"email"') || body.includes('"submitterEmail"')) {
      throw new Error(`${name} appears to expose a private email field`);
    }
  }

  console.log(`PASS ${name}: HTTP ${response.status}`);
}

console.log(`Production smoke checks passed for ${baseUrl}`);
