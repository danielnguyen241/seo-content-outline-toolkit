#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, extractMarkdownHeadings, firstKey, loadEnv, parseArgs, slugify } from "./common.mjs";

function usage() {
  console.log(`Usage:
  npm run headings -- "keyword" [--gl au] [--hl en] [--num 10]

Gets organic URLs from Google Australia via Serper, scrapes pages with Firecrawl, and writes heading evidence JSON.`);
}

async function serperSearch(keyword, { gl, hl, num }) {
  const apiKey = firstKey(process.env.SERPER_API_KEYS);
  if (!apiKey) throw new Error("Missing SERPER_API_KEYS in .env");
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: keyword, gl, hl, num }),
  });
  if (!response.ok) throw new Error(`Serper failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return (data.organic || [])
    .filter((item) => item.link && /^https?:\/\//.test(item.link))
    .slice(0, num)
    .map((item, index) => ({
      position: item.position || index + 1,
      title: item.title || "",
      link: item.link,
      snippet: item.snippet || "",
    }));
}

async function firecrawlScrapeOne(url) {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 1000 }),
  });
  if (!response.ok) {
    return { error: `${response.status} ${await response.text()}`, metadata: { sourceURL: url } };
  }
  const data = await response.json();
  return data.data || data;
}

async function firecrawlBatchScrape(urls) {
  const response = await fetch("https://api.firecrawl.dev/v1/batch/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls, formats: ["markdown"], onlyMainContent: true, waitFor: 1000 }),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  const data = await response.json();
  if (!data.url) return data.data || [];
  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const poll = await fetch(data.url, { headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` } });
    const polled = await poll.json();
    if (polled.status === "completed") return polled.data || [];
    if (polled.status === "failed") throw new Error(`batch failed: ${JSON.stringify(polled)}`);
  }
  throw new Error("batch timed out");
}

loadEnv();
const args = parseArgs(process.argv.slice(2));
if (args.help || args._.length === 0) {
  usage();
  process.exit(0);
}

if (!process.env.FIRECRAWL_API_KEY) throw new Error("Missing FIRECRAWL_API_KEY in .env");
const keyword = args._.join(" ").trim();
const serp = await serperSearch(keyword, {
  gl: args.gl || process.env.DEFAULT_SERP_GL || "au",
  hl: args.hl || process.env.DEFAULT_SERP_HL || "en",
  num: Number(args.num || 10),
});

let scraped;
try {
  scraped = await firecrawlBatchScrape(serp.map((item) => item.link));
} catch (error) {
  console.error(`Batch scrape failed; falling back to per-URL scrape: ${error.message}`);
  scraped = [];
  for (const result of serp) scraped.push(await firecrawlScrapeOne(result.link));
}

const rows = serp.map((result) => {
  const page =
    scraped.find((item) => item.metadata?.sourceURL === result.link || item.url === result.link || item.metadata?.url === result.link) ||
    {};
  return {
    ...result,
    headings: extractMarkdownHeadings(page.markdown),
    markdownLength: String(page.markdown || "").length,
    scrapeStatus: page.metadata?.statusCode || null,
    error: page.error || null,
  };
});

ensureDir("outputs");
const outputPath = path.join("outputs", `${slugify(keyword)}.headings.json`);
fs.writeFileSync(outputPath, JSON.stringify({ keyword, createdAt: new Date().toISOString(), serp: rows }, null, 2));
console.log(outputPath);
