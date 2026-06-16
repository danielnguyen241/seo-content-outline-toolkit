# SEO Content Outline Toolkit

Toolkit for turning keyword clusters into SEO content outlines that can be pasted directly into Google Sheets.

It combines:

- **SE Ranking API** for keyword volume and difficulty.
- **Serper.dev API** for top Google organic results.
- **Firecrawl API** for scraping competitor headings.
- A strict **TSV output format** for content planning sheets.

## Quick Start

```bash
git clone https://github.com/danielnguyen241/seo-content-outline-toolkit.git
cd seo-content-outline-toolkit
cp .env.example .env
npm install
```

Fill `.env` with your API keys:

```env
SE_RANKING_API_KEY=...
SERPER_API_KEYS=...
FIRECRAWL_API_KEY=...
```

Never commit `.env`.

## Commands

Check keyword volume from SE Ranking:

```bash
npm run volume -- examples/ecommerce-easy.input.tsv
```

Scrape competitor headings from Google SERP:

```bash
npm run headings -- "shopify seo checklist"
```

Generate a sheet-ready outline TSV from a prepared JSON outline:

```bash
npm run outline -- examples/shopify-seo-checklist.outline.json
```

## Sheet TSV Format

The output has no header row because the team sheet already has headers.

Column order:

```text
#	Keyword	Volume	So tu	Intent	Heading	Outline	Ref
```

Rules:

- Keyword with the highest volume is the main keyword.
- Main keyword must appear in the title.
- Secondary keywords should appear naturally in numbered headings where possible.
- Do not include volume `0` keywords. Volume `10` is allowed.
- Intent is one article-level cell, not one intent per heading.
- References are URLs, stacked in the `Ref` column on the first available rows.
- Outline heading labels must be `Title`, `1.`, `1.1`, `1.2`, `2.`, `2.1`, etc.

See `docs/` for the full SOP and examples.

## Cost Rules

- SE Ranking keyword export costs 100 units per request, so always batch keywords.
- Default global volume is a proxy: `US + UK + AU + CA`.
- Serper is used only to fetch SERP URLs.
- Firecrawl is used to scrape page markdown/headings. Batch scrape is attempted first; if it fails, the script falls back to per-URL scraping.

