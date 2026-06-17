#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, loadEnv, parseArgs, slugify } from "./common.mjs";

const DISCOVERY_ENDPOINTS = new Set(["similar", "related", "questions", "longtail"]);

function usage() {
  console.log(`Usage:
  npm run research -- "seed keyword" [--discover-markets au] [--volume-markets us,uk,au,ca] [--limit 20] [--top 50]

Discovers keyword ideas from SE Ranking, enriches them with global proxy volume,
and outputs keyword research TSV + JSON.

Defaults:
  --discover-markets au
  --volume-markets us,uk,au,ca
  --sources similar,related,questions,longtail
  --min-volume 10
  --max-difficulty 60`);
}

function parseCsv(value, fallback) {
  return String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getJson(url, apiKey) {
  const response = await fetch(url, {
    headers: { Authorization: `Token ${apiKey}` },
  });
  if (!response.ok) throw new Error(`${url} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function discoverKeywords({ seed, market, source, limit, minVolume, maxDifficulty, apiKey }) {
  if (!DISCOVERY_ENDPOINTS.has(source)) throw new Error(`Unsupported source: ${source}`);
  const url = new URL(`https://api.seranking.com/v1/keywords/${source}`);
  url.searchParams.set("source", market);
  url.searchParams.set("keyword", seed);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", "0");

  if (source !== "longtail") {
    url.searchParams.set("sort", "volume");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("filter[volume][from]", String(minVolume));
    url.searchParams.set("filter[difficulty][to]", String(maxDifficulty));
  }

  const data = await getJson(url, apiKey);
  const rawKeywords = data.keywords || [];
  return rawKeywords.map((item) => {
    if (typeof item === "string") {
      return {
        keyword: item,
        discoverySource: source,
        discoveryMarket: market,
      };
    }
    return {
      keyword: item.keyword,
      localVolume: Number(item.volume || 0),
      localDifficulty: Number.isFinite(item.difficulty) ? item.difficulty : null,
      intents: item.intents || [],
      relevance: item.relevance ?? null,
      discoverySource: source,
      discoveryMarket: market,
    };
  });
}

async function fetchMarketMetrics(keywords, market, apiKey) {
  const response = await fetch(`https://api.seranking.com/v1/keywords/export?source=${market}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keywords, sort: "volume", sort_order: "desc" }),
  });
  if (!response.ok) throw new Error(`SE Ranking export ${market} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function mergeCandidate(map, item) {
  const keyword = item.keyword?.trim();
  if (!keyword) return;
  const key = keyword.toLowerCase();
  const existing =
    map.get(key) ||
    {
      keyword,
      discoverySources: new Set(),
      discoveryMarkets: new Set(),
      localVolumes: [],
      localDifficulties: [],
      intents: new Set(),
      relevance: null,
    };
  existing.discoverySources.add(item.discoverySource);
  existing.discoveryMarkets.add(item.discoveryMarket);
  if (Number(item.localVolume) > 0) existing.localVolumes.push(Number(item.localVolume));
  if (Number.isFinite(item.localDifficulty)) existing.localDifficulties.push(Number(item.localDifficulty));
  for (const intent of item.intents || []) existing.intents.add(intent);
  if (item.relevance != null) existing.relevance = Math.max(existing.relevance || 0, item.relevance);
  map.set(key, existing);
}

function average(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

loadEnv();
const args = parseArgs(process.argv.slice(2));
if (args.help || args._.length === 0) {
  usage();
  process.exit(0);
}

const apiKey = process.env.SE_RANKING_API_KEY;
if (!apiKey) throw new Error("Missing SE_RANKING_API_KEY in .env");

const seed = args._.join(" ").trim();
const discoverMarkets = parseCsv(args["discover-markets"], process.env.DEFAULT_DISCOVERY_MARKETS || "au");
const volumeMarkets = parseCsv(args["volume-markets"], process.env.DEFAULT_MARKETS || "us,uk,au,ca");
const sources = parseCsv(args.sources, "similar,related,questions,longtail").filter((source) =>
  DISCOVERY_ENDPOINTS.has(source)
);
const limit = Number(args.limit || 20);
const top = Number(args.top || 50);
const minVolume = Number(args["min-volume"] || 10);
const maxDifficulty = Number(args["max-difficulty"] || 60);

console.error(`Seed: ${seed}`);
console.error(`Discovery markets: ${discoverMarkets.join(", ")}`);
console.error(`Volume markets: ${volumeMarkets.join(", ")}`);
console.error(`Sources: ${sources.join(", ")}`);
console.error(`Discovery calls: ${discoverMarkets.length * sources.length}`);
console.error(`Volume enrichment calls: ${volumeMarkets.length}`);

const candidates = new Map();
for (const market of discoverMarkets) {
  for (const source of sources) {
    const items = await discoverKeywords({ seed, market, source, limit, minVolume, maxDifficulty, apiKey });
    for (const item of items) mergeCandidate(candidates, item);
  }
}

const candidateRows = [...candidates.values()];
const keywords = candidateRows.map((item) => item.keyword);

const metricsByKeyword = new Map(
  keywords.map((keyword) => [
    keyword.toLowerCase(),
    {
      volume: 0,
      markets: {},
      difficulties: [],
      cpcs: [],
      intents: new Set(),
    },
  ])
);

for (const market of volumeMarkets) {
  const rows = await fetchMarketMetrics(keywords, market, apiKey);
  for (const row of rows) {
    const metric = metricsByKeyword.get(row.keyword.toLowerCase());
    if (!metric) continue;
    const volume = row.is_data_found ? Number(row.volume || 0) : 0;
    metric.volume += volume;
    metric.markets[market] = volume;
    if (row.is_data_found && Number.isFinite(row.difficulty)) metric.difficulties.push(row.difficulty);
    if (row.is_data_found && Number.isFinite(row.cpc)) metric.cpcs.push(row.cpc);
    for (const intent of row.intents || []) metric.intents.add(intent);
  }
}

const result = candidateRows
  .map((candidate) => {
    const metric = metricsByKeyword.get(candidate.keyword.toLowerCase());
    return {
      keyword: candidate.keyword,
      volume: metric.volume,
      difficulty: average(metric.difficulties) ?? average(candidate.localDifficulties),
      cpc: metric.cpcs.length
        ? Number((metric.cpcs.reduce((sum, value) => sum + value, 0) / metric.cpcs.length).toFixed(2))
        : null,
      intents: [...new Set([...candidate.intents, ...metric.intents])],
      discoverySources: [...candidate.discoverySources],
      discoveryMarkets: [...candidate.discoveryMarkets],
      relevance: candidate.relevance,
      markets: metric.markets,
    };
  })
  .filter((row) => row.volume >= minVolume)
  .filter((row) => row.difficulty == null || row.difficulty <= maxDifficulty)
  .sort((a, b) => b.volume - a.volume || (a.difficulty ?? 999) - (b.difficulty ?? 999) || a.keyword.localeCompare(b.keyword))
  .slice(0, top);

ensureDir("outputs");
const base = slugify(seed);
fs.writeFileSync(
  path.join("outputs", `${base}.research.json`),
  JSON.stringify({ seed, discoverMarkets, volumeMarkets, sources, result }, null, 2)
);
fs.writeFileSync(
  path.join("outputs", `${base}.research.tsv`),
  result.map((row) => `${row.keyword}\t${row.volume}\t${row.difficulty ?? ""}\t${row.intents.join(",")}`).join("\n") + "\n"
);

console.log(result.map((row) => `${row.keyword}\t${row.volume}\t${row.difficulty ?? ""}\t${row.intents.join(",")}`).join("\n"));
