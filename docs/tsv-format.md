# TSV Format

Use this exact column order:

```text
#	Keyword	Volume	So tu	Intent	Heading	Outline	Ref
```

Output should not include a header row when the user wants to paste into an existing Google Sheet.

## Article Cluster Layout

- `#` appears only on the first row of each article cluster.
- `Keyword` and `Volume` stack down the first rows.
- `So tu` appears only on the first row.
- `Intent` appears only on the first row.
- `Heading` and `Outline` stack down the outline rows.
- `Ref` URLs stack down the first available rows.

Example:

```tsv
1	shopify seo checklist	410	1800-2200	Informational / How-to	Title	Shopify SEO Checklist: Easy Fixes to Improve Your Store Rankings	https://www.shopify.com/blog/seo-checklist-online-store
	shopify seo tips	380			1.	What Is a Shopify SEO Checklist?	https://gofishdigital.com/blog/ultimate-shopify-seo-checklist/
	shopify schema markup	60			2.	Shopify SEO for Beginners: Start With the Basics	https://www.ecommerce-gold.com/shopify-seo/
	shopify seo for beginners	60			2.1	Set Up Google Search Console	
	shopify product page seo	40			2.2	Submit Your Shopify Sitemap	
```

