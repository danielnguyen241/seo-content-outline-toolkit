#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, loadEnv, parseArgs, readKeywordTsv, slugify } from "./common.mjs";

function usage() {
  console.log(`Usage:
  npm run volume -- <input.tsv> [--markets us,uk,au,ca]

Input can be one keyword per row, or TSV rows with keyword in column 1/2.
Output volume is the sum of selected markets. Keywords with volume 0 are omitted.`);
}

async function fetchMarket(keywords, market, apiKey) {
  const response = await fetch(`https://api.seranking.com/v1/keywords/export?source=${market}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keywords, sort: "volume", sort_order: "desc" }),
  });
  if (!response.ok) throw new Error(`SE Ranking ${market} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

loadEnv();
const args = parseArgs(process.argv.slice(2));
if (args.help || args._.length === 0) {
  usage();
  process.exit(0);
}

const inputPath = args._[0];
const apiKey = process.env.SE_RANKING_API_KEY;
if (!apiKey) throw new Error("Missing SE_RANKING_API_KEY in .env");

const markets = String(args.markets || process.env.DEFAULT_MARKETS || "us,uk,au,ca")
  .split(",")
  .map((market) => market.trim())
  .filter(Boolean);

const rows = readKeywordTsv(inputPath);
const keywords = [...new Set(rows.map((row) => row.keyword))];
if (keywords.length === 0) throw new Error("No keywords found");

console.error(`Keywords: ${keywords.length}`);
console.error(`Markets: ${markets.join(", ")}`);
console.error(`Estimated SE Ranking requests: ${markets.length}`);

const byKeyword = new Map(keywords.map((keyword) => [keyword, { keyword, volume: 0, markets: {}, difficulties: [] }]));
for (const market of markets) {
  const data = await fetchMarket(keywords, market, apiKey);
  for (const item of data) {
    const row = byKeyword.get(item.keyword);
    if (!row) continue;
    const volume = item.is_data_found ? Number(item.volume || 0) : 0;
    row.volume += volume;
    row.markets[market] = volume;
    if (item.is_data_found && Number.isFinite(item.difficulty)) row.difficulties.push(item.difficulty);
  }
}

const result = [...byKeyword.values()]
  .map((row) => ({
    ...row,
    difficulty: row.difficulties.length
      ? Math.round(row.difficulties.reduce((sum, value) => sum + value, 0) / row.difficulties.length)
      : null,
  }))
  .filter((row) => row.volume > 0)
  .sort((a, b) => b.volume - a.volume || a.keyword.localeCompare(b.keyword));

ensureDir("outputs");
const base = slugify(path.basename(inputPath).replace(/\.[^.]+$/, ""));
fs.writeFileSync(path.join("outputs", `${base}.volume.json`), JSON.stringify({ markets, result }, null, 2));
fs.writeFileSync(
  path.join("outputs", `${base}.volume.tsv`),
  result.map((row) => `${row.keyword}\t${row.volume}`).join("\n") + "\n"
);

console.log(result.map((row) => `${row.keyword}\t${row.volume}`).join("\n"));

