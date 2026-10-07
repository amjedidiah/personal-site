#!/usr/bin/env node

/**
 * Scrapes amjedidiah.hashnode.dev/archive for all posts
 * and updates src/data/hashnode.ts if new posts are found.
 */

import { readFileSync, writeFileSync } from "node:fs";

const ARCHIVE_URL = "https://amjedidiah.hashnode.dev/archive";
const OUTPUT = "src/data/hashnode.ts";
const BASE = "https://amjedidiah.hashnode.dev";

async function fetchArchivePage() {
  const res = await fetch(ARCHIVE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch archive: ${res.status}`);
  return res.text();
}

function parseArticles(html) {
  const articles = [];
  // Match article links with their titles and dates from the archive page
  // Hashnode archive uses <a> tags with href containing the slug
  const linkRegex =
    /<a[^>]*href="https:\/\/amjedidiah\.hashnode\.dev\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set();

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const slug = match[1];
    const inner = match[2];

    // Skip non-article links (profile, tags, etc)
    if (
      slug.startsWith("@") ||
      slug.startsWith("tag/") ||
      slug === "" ||
      slug === "archive" ||
      slug.startsWith("newsletter") ||
      slug.startsWith("series/")
    )
      continue;
    // Skip duplicate slugs
    if (seen.has(slug)) continue;
    seen.add(slug);

    // Extract title from inner HTML — look for heading tags or text content
    let title = "";
    const headingMatch = inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/);
    if (headingMatch) {
      title = headingMatch[1].replace(/<[^>]+>/g, "").trim();
    }
    if (!title) {
      title = inner.replace(/<[^>]+>/g, "").trim();
    }
    if (!title || title.length < 5) continue;

    // Extract date — look for <time> or date patterns near the link
    let date = "";
    const timeMatch = inner.match(
      /<time[^>]*datetime="([^"]*)"[^>]*>|(\w+ \d{1,2},? \d{4})/
    );
    if (timeMatch) {
      date = timeMatch[1] || timeMatch[2];
    }

    articles.push({ title, slug, date });
  }

  return articles;
}

function loadExisting() {
  try {
    const content = readFileSync(OUTPUT, "utf-8");
    const slugs = [];
    const slugRegex = /slug:\s*"([^"]+)"/g;
    let m;
    while ((m = slugRegex.exec(content)) !== null) {
      slugs.push(m[1]);
    }
    return new Set(slugs);
  } catch {
    return new Set();
  }
}

function generateEntry(article) {
  const escaped = article.title.replace(/"/g, '\\"');
  return `  {
    title: "${escaped}",
    slug: "${article.slug}",
    url: \`\${BASE}/${article.slug}\`,
    brief: "",
    date: "${article.date}",
    tags: [],
  }`;
}

async function main() {
  console.log("Fetching Hashnode archive...");

  let html;
  try {
    html = await fetchArchivePage();
  } catch (e) {
    // Cloudflare might block — try a simpler approach
    console.error(`Fetch failed: ${e.message}`);
    console.log(
      "Archive may be behind Cloudflare. Checking if existing data is current..."
    );
    process.exit(0);
  }

  const articles = parseArticles(html);
  console.log(`Found ${articles.length} articles in archive`);

  if (articles.length === 0) {
    console.log("No articles parsed — page structure may have changed. Exiting.");
    process.exit(0);
  }

  const existingSlugs = loadExisting();
  const newArticles = articles.filter((a) => !existingSlugs.has(a.slug));

  if (newArticles.length === 0) {
    console.log("No new articles found. hashnode.ts is up to date.");
    process.exit(0);
  }

  console.log(`Found ${newArticles.length} new article(s):`);
  newArticles.forEach((a) => console.log(`  - ${a.title}`));

  // Read existing file and insert new entries
  const existing = readFileSync(OUTPUT, "utf-8");
  const insertPoint = existing.indexOf("export const hashnodePosts");
  if (insertPoint === -1) {
    console.error("Could not find hashnodePosts export in hashnode.ts");
    process.exit(1);
  }

  // Find the opening bracket of the array
  const arrayStart = existing.indexOf("[", insertPoint);
  const newEntries = newArticles.map(generateEntry).join(",\n");

  // Insert new entries at the beginning of the array (newest first)
  const updated =
    existing.slice(0, arrayStart + 1) +
    "\n" +
    newEntries +
    "," +
    existing.slice(arrayStart + 1);

  writeFileSync(OUTPUT, updated, "utf-8");
  console.log(`Updated ${OUTPUT} with ${newArticles.length} new article(s).`);

  // Signal to CI that changes were made
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
