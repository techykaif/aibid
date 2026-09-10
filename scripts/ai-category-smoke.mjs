const baseUrl = process.env.AIBID_BASE_URL || "https://www.ai-bid.lol";
const headers = { "user-agent": "Ai-Bid-AI-Category-Smoke/1.0" };
const categories = [
  "coding",
  "writing",
  "image-design",
  "video-audio",
  "agents-automation",
  "productivity-chat",
  "other",
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
  if (!/<meta[^>]+property=[\"']og:title[\"']/i.test(body)) {
    throw new Error(`AI category ${slug} is missing Open Graph title metadata`);
  }
  if (!/<meta[^>]+name=[\"']twitter:card[\"']/i.test(body)) {
    throw new Error(`AI category ${slug} is missing Twitter card metadata`);
  }
  if (/games|open source|music/i.test(body)) {
    throw new Error(`AI category ${slug} exposes a deferred future-market surface`);
  }

  console.log(`PASS AI category ${slug}: HTTP 200 + canonical/social metadata`);
}
