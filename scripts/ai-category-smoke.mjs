const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";
const headers = { "user-agent": "Ai-Bid-AI-Category-Smoke/1.1" };
const categories = [
  "coding",
  "writing",
  "image",
  "video",
  "agents",
  "productivity",
  "other",
];

const metadataChecks = [
  ["title", /<title>[^<]+<\/title>/i],
  ["description", /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i],
  ["Open Graph title", /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']+["']/i],
  ["Open Graph description", /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']+["']/i],
  ["Open Graph image", /<meta[^>]+property=["']og:image["'][^>]+content=["'][^"']+["']/i],
  ["Twitter card", /<meta[^>]+name=["']twitter:card["'][^>]+content=["'][^"']+["']/i],
  ["Twitter title", /<meta[^>]+name=["']twitter:title["'][^>]+content=["'][^"']+["']/i],
  ["Twitter description", /<meta[^>]+name=["']twitter:description["'][^>]+content=["'][^"']+["']/i],
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

  for (const [label, pattern] of metadataChecks) {
    if (!pattern.test(body)) {
      throw new Error(`AI category ${slug} is missing ${label} metadata`);
    }
  }

  if (/games|open source|music/i.test(body)) {
    throw new Error(`AI category ${slug} exposes a deferred future-market surface`);
  }

  console.log(`PASS AI category ${slug}: HTTP 200 + canonical + title/description + OG/Twitter metadata`);
}
