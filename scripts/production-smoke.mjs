const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";

const headers = { "user-agent": "Ai-Bid-Production-Smoke/1.0" };
const checks = [
  ["homepage", "/"],
  ["today API", "/api/today"],
  ["products API", "/api/products"],
  ["stats API", "/api/stats"],
  ["AI category", "/category/ai-coding-dev-tools"],
  ["Games Action category", "/category/games-action"],
  ["Games Adventure category", "/category/games-adventure"],
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
    headers,
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

const invalidProductId = "production-smoke-invalid-product-9f6e4d7a";
const invalidRedirect = await fetch(new URL(`/go/${invalidProductId}`, baseUrl), {
  redirect: "manual",
  headers,
});
if (invalidRedirect.status !== 404) {
  throw new Error(`invalid product redirect returned HTTP ${invalidRedirect.status}, expected 404`);
}
console.log("PASS invalid product redirect: HTTP 404");

const invalidProductPage = await fetch(new URL(`/product/${invalidProductId}`, baseUrl), {
  redirect: "manual",
  headers,
});
if (invalidProductPage.status !== 404) {
  throw new Error(`invalid product page returned HTTP ${invalidProductPage.status}, expected 404`);
}
console.log("PASS invalid product page: HTTP 404");

const invalidLogo = await fetch(new URL(`/api/logo/${invalidProductId}`, baseUrl), {
  redirect: "manual",
  headers,
});
if (invalidLogo.status !== 404) {
  throw new Error(`invalid logo route returned HTTP ${invalidLogo.status}, expected 404`);
}
const invalidLogoContentType = invalidLogo.headers.get("content-type") || "";
if (!invalidLogoContentType.includes("application/json")) {
  throw new Error("invalid logo route did not return JSON");
}
console.log("PASS invalid logo route: HTTP 404");

const invalidBadge = await fetch(new URL(`/api/badge/${invalidProductId}.svg`, baseUrl), {
  redirect: "manual",
  headers,
});
if (invalidBadge.status !== 404) {
  throw new Error(`invalid badge route returned HTTP ${invalidBadge.status}, expected 404`);
}
console.log("PASS invalid badge route: HTTP 404");

const invalidCheckout = await fetch(new URL("/api/checkout", baseUrl), {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({}),
});
if (invalidCheckout.status !== 400) {
  throw new Error(`invalid checkout payload returned HTTP ${invalidCheckout.status}, expected 400`);
}
console.log("PASS invalid checkout payload: HTTP 400");

const invalidWebhook = await fetch(new URL("/api/webhooks/dodo", baseUrl), {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ type: "payment.succeeded", data: {} }),
});
if (invalidWebhook.status !== 401) {
  throw new Error(`unsigned Dodo webhook returned HTTP ${invalidWebhook.status}, expected 401`);
}
const webhookContentType = invalidWebhook.headers.get("content-type") || "";
if (!webhookContentType.includes("application/json")) {
  throw new Error("unsigned Dodo webhook did not return JSON");
}
console.log("PASS unsigned Dodo webhook: HTTP 401");

console.log(`Production smoke checks passed for ${baseUrl}`);
