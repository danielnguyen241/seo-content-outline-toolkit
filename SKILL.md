---
name: seo-content-outline-toolkit
description: Use for SEO content outline workflows, keyword research, SE Ranking keyword volume/difficulty, Serper Google Australia SERP research, Firecrawl competitor heading extraction, backlink gap, SERP gap, quick-win SEO, TSV outlines, and Google Sheets-ready SEO planning.
---

# SEO Content Outline Toolkit

Use this skill when the user wants to research SEO keywords, validate keyword clusters, inspect Google Australia SERPs, scrape competitor headings, create SEO content outlines, generate TSV for Google Sheets, run backlink gap analysis, identify free listing opportunities, perform SERP gap analysis, or find GSC quick wins.

## Source of Truth

Read only the specific docs needed for the task:

- `TEAM_GUIDE_VI.md` for the team workflow and setup.
- `docs/api-notes.md` for API endpoints, cost notes, and provider roles.
- `docs/outline-rules.md` for keyword and outline rules.
- `docs/tsv-format.md` for the exact Google Sheets TSV format.
- `docs/prompts.md` for reusable operator prompts.
- `docs/workflow.md` for the end-to-end content process.

## Required Environment

The local repo should have `.env` based on `.env.example`.

Required keys depend on task:

- `SE_RANKING_API_KEY` for keyword research, volume, difficulty, and backlink data.
- `SERPER_API_KEYS` for Google Australia SERP URLs.
- `FIRECRAWL_API_KEY` for competitor heading extraction.

Never expose, print, commit, or paste real API keys. If an API key appears in user-visible text, recommend rotating it.

## Default Markets

- Keyword discovery defaults to Australia: `DEFAULT_DISCOVERY_MARKETS=au`.
- SERP defaults to Google Australia: `DEFAULT_SERP_GL=au`, `DEFAULT_SERP_HL=en`.
- Global volume proxy defaults to `US + UK + AU + CA`: `DEFAULT_MARKETS=us,uk,au,ca`.

## CLI Workflows

Run commands from the toolkit repo root.

### Keyword Discovery

Use when the user only has a seed topic/keyword:

```bash
npm run research -- "ecommerce seo"
```

This calls SE Ranking `similar`, `related`, `questions`, and `longtail`, then enriches candidates with global proxy volume.

### Batch Keyword Volume

Use when the user already has a keyword list/cluster:

```bash
npm run volume -- examples/ecommerce-easy.input.tsv
```

Batch keywords. Do not call one keyword at a time.

### SERP Heading Research

Use for SERP/content gap or evidence-backed outline work:

```bash
npm run headings -- "shopify seo checklist"
```

This uses Serper for Google Australia organic results and Firecrawl for headings. If Firecrawl cannot scrape some URLs, skip blocked pages and use the remaining competitors.

### Sheet-Ready Outline TSV

Use when an outline JSON is ready:

```bash
npm run outline -- examples/shopify-seo-checklist.outline.json
```

Output should be pasted directly into Google Sheets.

## TSV Format Rules

When returning final outline data for the user, use TSV with no header row unless the user asks otherwise.

Column order:

```text
#	Keyword	Volume	Số từ	Intent	Heading	Outline	Ref
```

Rules:

- Main keyword is the highest-volume keyword in the cluster.
- Main keyword must appear in the title.
- Secondary keywords should appear naturally in numbered headings when possible.
- Exclude volume `0` keywords. Volume `10` is allowed.
- Intent appears once for the whole article.
- Ref values are source URLs.
- Outline labels must be `Title`, `1.`, `1.1`, `1.2`, `2.`, `2.1`, etc. Do not output `H2`/`H3` labels in final TSV.
- Keep outlines moderate, not overbuilt; usually 7-10 main sections are enough.

## SEO Operator Workflows

### SERP Gap

Use Serper + Firecrawl to compare top Google Australia pages against a target page. Report intent, common competitor patterns, missing sections, weak sections, FAQ/entity gaps, and priority fixes. Do not copy competitor headings directly.

### Backlink Gap

Use Google Australia SERP first to identify real ranking competitors, then compare backlink metrics/referring domains with the target. Prioritize realistic opportunities: free listings, local Australian directories, service directories, niche directories, profile pages, PR/listing sites, and citations. Flag spam separately and do not recommend copying spam links blindly.

### Quick Wins

Use Google Search Console data when available. Prioritize queries/pages with high impressions, average position 4-20, low CTR, and existing traction. Recommend title/meta/H1/H2/content refresh actions.

## Quality Bar

- Separate observed data from interpretation and recommendations.
- Do not guess missing API data.
- Prefer evidence from GSC, SERP, competitor headings, backlink data, and keyword metrics.
- Keep recommendations actionable for a small or newer website unless the user says otherwise.
