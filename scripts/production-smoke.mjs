const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";

const headers = { "user-agent": "Ai-Bid-Production-Smoke/1.0" };
const checks = [
  ["homepage", "/"],
  ["today API", "/api/today"],
  ["products API", "/api/products"],
  ["stats API", "/api/stats"],
  ["AI category", "/category/coding"],
  ["robots", "/robots.txt"],
  ["sitemap", "/sitemap.xml"],
  ["terms", "/legal/terms"],
  ["privacy", "/legal/privacy"],
  ["rules", "/legal/rules"],
  ["faq", "/legal/faq"],
  ["checkout cancel", "/checkout/cancel"],
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

const gamesCategory = await fetch(new URL("/category/games-action", baseUrl), {
  redirect: "manual",
  headers,
});
if (gamesCategory.status !== 404) {
  throw new Error(`deferred Games category returned HTTP ${gamesCategory.status}, expected 404`);
}
const gamesCategoryBody = await gamesCategory.text();
if (!gamesCategoryBody.toLowerCase().includes("noindex")) {
  throw new Error("deferred Games category did not retain noindex protection");
}
console.log("PASS deferred Games category: HTTP 404 + noindex");

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

const boundaryPayload = {
  name: "Production Smoke Boundary",
  url: "https://example.com",
  tagline: "Market validation smoke check",
  description: "",
  email: "smoke@example.com",
  twitterHandle: "",
  bid: 5,
};

const removedGamesResponse = await fetch(new URL("/api/checkout", baseUrl), {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ ...boundaryPayload, market: "games", category: "games-action" }),
});
if (removedGamesResponse.status !== 400) {
  throw new Error(`removed Games market returned HTTP ${removedGamesResponse.status}, expected 400`);
}
console.log("PASS removed Games market: HTTP 400");

const ssrfBoundaryResponse = await fetch(new URL("/api/checkout", baseUrl), {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({
    ...boundaryPayload,
    url: "http://[::ffff:127.0.0.1]/",
    market: "ai",
    category: "coding",
  }),
});
if (ssrfBoundaryResponse.status !== 400) {
  throw new Error(`IPv4-mapped private URL returned HTTP ${ssrfBoundaryResponse.status}, expected 400`);
}
console.log("PASS IPv4-mapped private URL: HTTP 400");

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

const productsResponse = await fetch(new URL("/api/products?limit=1", baseUrl), {
  redirect: "manual",
  headers,
});
if (!productsResponse.ok) {
  throw new Error(`live product discovery returned HTTP ${productsResponse.status}`);
}
const products = await productsResponse.json();
if (!Array.isArray(products)) {
  throw new Error("live product discovery did not return an array");
}

if (products.length > 0) {
  const product = products[0];
  if (typeof product.id !== "string" || !product.id) {
    throw new Error("live product discovery returned a product without a public id");
  }
  if (product.email !== undefined || product.submitterEmail !== undefined) {
    throw new Error("live product response exposes a private email field");
  }

  const productPage = await fetch(new URL(`/product/${encodeURIComponent(product.id)}`, baseUrl), {
    redirect: "manual",
    headers,
  });
  if (productPage.status !== 200) {
    throw new Error(`live product page returned HTTP ${productPage.status}, expected 200`);
  }
  console.log(`PASS live product page: HTTP 200 (${product.id})`);

  const badge = await fetch(new URL(`/api/badge/${encodeURIComponent(product.id)}.svg`, baseUrl), {
    redirect: "manual",
    headers,
  });
  if (badge.status !== 200) {
    throw new Error(`live product badge returned HTTP ${badge.status}, expected 200`);
  }
  if (!(badge.headers.get("content-type") || "").includes("image/svg+xml")) {
    throw new Error("live product badge did not return SVG content");
  }
  console.log(`PASS live product badge: HTTP 200 (${product.id})`);

  if (typeof product.logoUrl === "string" && product.logoUrl) {
    const logo = await fetch(new URL(product.logoUrl, baseUrl), {
      redirect: "manual",
      headers,
    });
    if (logo.status !== 200) {
      throw new Error(`live product logo returned HTTP ${logo.status}, expected 200`);
    }
    if ((logo.headers.get("content-type") || "") !== "image/webp") {
      throw new Error("live product logo did not return image/webp");
    }
    if (Number(logo.headers.get("content-length") || 0) > 180 * 1024) {
      throw new Error("live product logo exceeded the 180KB application safety ceiling");
    }
    console.log(`PASS live product logo: HTTP 200 (${product.id})`);
  }
} else {
  console.log("SKIP live product page/logo/badge checks: production currently has no live products");
}

console.log(`Production smoke checks passed for ${baseUrl}`);
