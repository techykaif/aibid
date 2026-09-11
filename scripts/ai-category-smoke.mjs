const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";
const headers = { "user-agent": "Ai-Bid-AI-Category-Smoke/1.2" };
const categories = [
  "coding",
  "writing",
  "image",
  "video",
  "agents",
  "productivity",
  "other",
];

function hasMeta(body, attributes) {
  const tagPattern = /<meta\b[^>]*>/gi;
  for (const tag of body.match(tagPattern) || []) {
    if (attributes.every(([name, value]) => new RegExp(`(?:name|property)=[\"']${name}[\"']`, "i").test(tag) && new RegExp(`content=[\"'][^\"']+[\"']`, "i").test(tag))) {
      return true;
    }
  }
  return false;
}

const metadataChecks = [
  ["description", [["description", ""]]],
  ["Open Graph title", [["og:title", ""]]],
  ["Open Graph description", [["og:description", ""]]],
  ["Open Graph image", [["og:image", ""]]],
  ["Twitter card", [["twitter:card", ""]]],
  ["Twitter title", [["twitter:title", ""]]],
  ["Twitter description", [["twitter:description", ""]]],
];

for (const slug of categories) {
  const response = await fetch(new URL(`/category/${slug}`, baseUrl), {
    redirect: "manual",
    headers,
  });

  if (response.status !== 200) {
    throw new Error(`AI category ${slug} returned HTTP ${response.status}, expected 200`);
  }

  const body = await response.text();
  const canonical = `https://www.ai-bid.lol/category/${slug}`;
  if (!body.includes(`href=\"${canonical}\"`) && !body.includes(`href='${canonical}'`)) {
    throw new Error(`AI category ${slug} is missing canonical URL ${canonical}`);
  }

  if (!/<title>[^<]+<\/title>/i.test(body)) {
    throw new Error(`AI category ${slug} is missing title metadata`);
  }

  for (const [label, attributes] of metadataChecks) {
    if (!hasMeta(body, attributes)) {
      throw new Error(`AI category ${slug} is missing ${label} metadata`);
    }
  }

  if (/games|open source|music/i.test(body)) {
    throw new Error(`AI category ${slug} exposes a deferred future-market surface`);
  }

  console.log(`PASS AI category ${slug}: HTTP 200 + canonical + title/description + OG/Twitter metadata`);
}
