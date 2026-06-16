#!/usr/bin/env node
import fs from "node:fs";
import { parseArgs } from "./common.mjs";

function usage() {
  console.log(`Usage:
  npm run outline -- <outline.json>

JSON shape:
{
  "number": 1,
  "keywords": [{"keyword": "shopify seo checklist", "volume": 410}],
  "wordCount": "1800-2200",
  "intent": "Informational / How-to",
  "title": "Shopify SEO Checklist: ...",
  "outline": [{"heading": "1.", "text": "What Is ..."}],
  "refs": ["https://example.com"]
}`);
}

function validate(data) {
  if (!data.title) throw new Error("Missing title");
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) throw new Error("Missing keywords");
  if (!Array.isArray(data.outline) || data.outline.length === 0) throw new Error("Missing outline");
  const main = data.keywords[0].keyword.toLowerCase();
  if (!data.title.toLowerCase().includes(main)) {
    throw new Error(`Main keyword must appear in title: ${data.keywords[0].keyword}`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args._.length === 0) {
  usage();
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(args._[0], "utf8"));
validate(data);

const keywords = data.keywords.filter((item) => Number(item.volume) > 0);
const rowsNeeded = Math.max(1 + data.outline.length, keywords.length, (data.refs || []).length);
const rows = [];
for (let i = 0; i < rowsNeeded; i += 1) {
  const keyword = keywords[i] || {};
  const outline =
    i === 0
      ? { heading: "Title", text: data.title }
      : data.outline[i - 1] || {};
  rows.push([
    i === 0 ? data.number || "" : "",
    keyword.keyword || "",
    keyword.volume || "",
    i === 0 ? data.wordCount || "" : "",
    i === 0 ? data.intent || "" : "",
    outline.heading || "",
    outline.text || "",
    (data.refs || [])[i] || "",
  ]);
}

console.log(rows.map((row) => row.join("\t")).join("\n"));

