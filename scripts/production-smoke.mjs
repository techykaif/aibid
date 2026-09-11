const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";

const headers = { "user-agent": "Ai-Bid-Production-Smoke/1.0" };
const checks = [
  ["homepage", "/"],
  ["today", "/today"],
  ["today API", "/api/today"],
  ["products API", "/api/products"],
  ["stats API", "/api/stats"],
  ["AI category", "/category/coding"],
  ["submit", "/submit"],
  ["report", "/report"],
  ["robots", "/robots.txt"],
  ["sitemap", "/sitemap.xml"],
  ["terms", "/legal/terms"],
  ["privacy", "/legal/privacy"],
  ["rules", "/legal/rules"],
  ["faq", "/legal/faq"],
  ["checkout cancel", "/checkout/cancel"],
];

function hasMeta(body, name, expectedContent) {
  const tagPattern = /<meta\b[^>]*>/gi;
  const namePattern = new RegExp(`(?:name|property)=[\"']${name}[\"']`, "i");
  const contentPattern = expectedContent
    ? new RegExp(`content=[\"']${expectedContent}[\"']`, "i")
    : /content=[\"'][^\"']+[\"']/i;

  return (body.match(tagPattern) || []).some((tag) => namePattern.test(tag) && contentPattern.test(tag));
}

function hasCanonical(body, canonical) {
  const tagPattern = /<link\b[^>]*>/gi;
  return (body.match(tagPattern) || []).some((tag) => {
    const rel = /rel=[\"']([^\"']+)[\"']/i.exec(tag)?.[1] || "";
    const href = /href=[\"']([^\"']+)[\"']/i.exec(tag)?.[1] || "";
    return rel.split(/\s+/).some((value) => value.toLowerCase() === "canonical") && href === canonical;
  });
}

for (const [name, path] of checks) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    headers,
  });

  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${name} returned HTTP ${response.status}`);
  }

  if (path.startsWith("/api/")) {
    const robotsTag = response.headers.get("x-robots-tag") || "";
    if (robotsTag.toLowerCase() !== "noindex, nofollow") {
      throw new Error(`${name} is missing the noindex, nofollow X-Robots-Tag`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`${name} did not return JSON`);
    }

    const body = await response.text();
    if (body.includes('\"email\"') || body.includes('\"submitterEmail\"')) {
      throw new Error(`${name} appears to expose a private email field`);
    }
  }

  if (path === "/" || path === "/today" || path === "/category/coding") {
    const body = await response.text();
    if (!hasCanonical(body, "https://www.ai-bid.lol")) {
      throw new Error(`${name} is missing the canonical www.ai-bid.lol link`);
    }
    if (!hasMeta(body, "og:title")) {
      throw new Error(`${name} is missing Open Graph title metadata`);
    }
    if (!hasMeta(body, "twitter:card")) {
      throw new Error(`${name} is missing Twitter card metadata`);
    }
  }

  if (path === "/robots.txt") {
    const body = await response.text();
    if (!/^Sitemap:\s*https:\/\/www\.ai-bid\.lol\/sitemap\.xml\s*$/im.test(body)) {
      throw new Error("robots.txt is missing the canonical www.ai-bid.lol sitemap declaration");
    }
    if (/games(?:-|\b)/i.test(body)) {
      throw new Error("robots.txt exposes a deferred Games launch surface");
    }
  }

  if (path === "/" || path === "/sitemap.xml") {
    const body = await response.text();
    if (/games(?:-|\b)/i.test(body)) {
      throw new Error(`${name} exposes a deferred Games launch surface`);
    }
  }

  if (path === "/submit") {
    const body = await response.text();
    if (/games|open source|music/i.test(body)) {
      throw new Error("submission page exposes a deferred future-market option");
    }
    if (!/AI Coding & Dev Tools/i.test(body) || !/AI Writing & Content/i.test(body)) {
      throw new Error("submission page is missing expected AI category options");
    }
  }

  if (path === "/report") {
    const body = await response.text();
    if (!hasMeta(body, "robots", "noindex, nofollow")) {
      throw new Error("report page is missing its noindex, nofollow boundary");
    }
  }

  console.log(`PASS ${name}: HTTP ${response.status}`);
}

const apexHost = await fetch("https://ai-bid.lol/", {
  redirect: "manual",
  headers,
});
if (![301, 302, 307, 308].includes(apexHost.status)) {
  throw new Error(`apex host returned HTTP ${apexHost.status}, expected a redirect to canonical www host`);
}
const apexLocation = apexHost.headers.get("location") || "";
if (!/^https:\/\/www\.ai-bid\.lol(?:\/|$)/i.test(apexLocation)) {
  throw new Error(`apex host redirect does not target https://www.ai-bid.lol: ${apexLocation}`);
}
console.log(`PASS canonical host redirect: HTTP ${apexHost.status} -> ${apexLocation}`);

for (const [name, path] of [
  ["deferred Games route", "/games"],
  ["deferred Games category", "/category/games"],
  ["deferred Games action category", "/category/games-action"],
]) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    headers,
  });
  if (response.status !== 404) {
    throw new Error(`${name} returned HTTP ${response.status}, expected 404`);
  }
  const body = await response.text();
  if (!body.toLowerCase().includes("noindex")) {
    throw new Error(`${name} did not retain noindex protection`);
  }
  console.log(`PASS ${name}: HTTP 404 + noindex`);
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
  const productBody = await productPage.text();
  if (!hasCanonical(productBody, `https://www.ai-bid.lol/product/${encodeURIComponent(product.id)}`)) {
    throw new Error(`live product page ${product.id} is missing its canonical URL`);
  }
  if (!hasMeta(productBody, "og:image")) {
    throw new Error(`live product page ${product.id} is missing its Open Graph image metadata`);
  }
  console.log(`PASS live product page + SEO metadata: HTTP 200 (${product.id})`);

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