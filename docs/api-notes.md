# API Notes

## SE Ranking

Endpoint used for keyword metrics:

```text
POST https://api.seranking.com/v1/keywords/export?source={market}
```

Rules:

- Use `Authorization: Token <SE_RANKING_API_KEY>`.
- Batch up to 5,000 keywords per request.
- Cost observed: 100 units per request.
- Default global volume proxy is `US + UK + AU + CA`.

Keyword discovery endpoints:

```text
GET https://api.seranking.com/v1/keywords/similar
GET https://api.seranking.com/v1/keywords/related
GET https://api.seranking.com/v1/keywords/questions
GET https://api.seranking.com/v1/keywords/longtail
```

Use these to research new keyword ideas from a seed keyword. The toolkit discovers candidates in Australia by default, then enriches the final candidate set with global proxy volume across `US + UK + AU + CA`.

## Serper.dev

Endpoint:

```text
POST https://google.serper.dev/search
```

Use it to fetch top Google Australia organic URLs by default (`gl=au`). It does not extract article headings.

## Firecrawl

Endpoints:

```text
POST https://api.firecrawl.dev/v1/batch/scrape
POST https://api.firecrawl.dev/v1/scrape
```

Use it to turn competitor URLs into markdown, then extract markdown headings.

Batch scrape can fail if one URL is unsupported. The toolkit falls back to per-URL scrape and skips blocked pages.

## SERPROBOT

Use SERPROBOT for ranking data only:

- Free/read actions: `credit`, `list_projects`, `project`, `keyword`, `project_report`.
- Credit-consuming actions: `rank_check`, `get_serps`.
- Read saved ranking reports first. Only run fresh checks when explicitly needed.
