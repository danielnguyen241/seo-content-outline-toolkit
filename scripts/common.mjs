import fs from "node:fs";
import path from "node:path";

export function loadEnv(cwd = process.cwd()) {
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

export function firstKey(raw) {
  return String(raw || "")
    .split(",")
    .map((key) => key.trim())
    .find(Boolean);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }
    const [rawKey, rawValue] = item.slice(2).split("=", 2);
    if (rawValue !== undefined) {
      args[rawKey] = rawValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      args[rawKey] = argv[i + 1];
      i += 1;
    } else {
      args[rawKey] = true;
    }
  }
  return args;
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readKeywordTsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("#\tkeyword"))
    .map((line) => {
      const cells = line.split("\t");
      if (cells.length === 1) return { keyword: cells[0] };
      if (/^\d+$/.test(cells[0])) return { article: cells[0], keyword: cells[1], volume: cells[2] };
      return { keyword: cells[0], volume: cells[1] };
    })
    .filter((row) => row.keyword);
}

export function extractMarkdownHeadings(markdown) {
  const headings = [];
  for (const line of String(markdown || "").split(/\r?\n/)) {
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line.trim());
    if (!match) continue;
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text.length < 3 || text.length > 140) continue;
    if (/cookie|newsletter|footer|related posts?|comments?|privacy/i.test(text)) continue;
    headings.push({ level: match[1].length, text });
  }
  return headings;
}

