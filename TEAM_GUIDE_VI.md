# Hướng dẫn dùng SEO Content Outline Toolkit

File này dùng để hướng dẫn team setup và chạy toolkit tạo outline SEO content.

Source GitHub:

https://github.com/danielnguyen241/seo-content-outline-toolkit

## Tool này dùng để làm gì?

Toolkit này giúp team làm nhanh quy trình research content SEO:

1. Nhập keyword cluster.
2. Nếu chưa có keyword cluster, dùng SE Ranking API để research keyword từ seed.
3. Lấy volume keyword bằng SE Ranking API.
4. Lấy top Google Australia results bằng Serper.dev API.
5. Dùng Firecrawl API đọc heading của các bài top đầu.
6. Tạo outline SEO dạng TSV để paste trực tiếp vào Google Sheets.

## Tool này dùng API gì?

Cần 3 API key:

- `SE_RANKING_API_KEY`: lấy keyword volume và difficulty.
- `SERPER_API_KEYS`: lấy top Google Australia search results.
- `FIRECRAWL_API_KEY`: scrape competitor pages và lấy heading.

Không gửi API key vào chat public, không commit API key lên GitHub.

## Cài đặt lần đầu

Yêu cầu máy có Node.js bản mới. Khuyến nghị Node.js 20+.

Clone source:

```bash
git clone https://github.com/danielnguyen241/seo-content-outline-toolkit.git
cd seo-content-outline-toolkit
npm install
```

Tạo file `.env`:

```bash
cp .env.example .env
```

Mở file `.env` và điền API key:

```env
SE_RANKING_API_KEY=your_se_ranking_api_key
SERPER_API_KEYS=your_serper_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
DEFAULT_MARKETS=us,uk,au,ca
DEFAULT_DISCOVERY_MARKETS=au
DEFAULT_SERP_GL=au
DEFAULT_SERP_HL=en
```

## Cách chạy

### 0. Research keyword từ seed

Nếu chỉ có topic/seed keyword, chạy:

```bash
npm run research -- "ecommerce seo"
```

Tool sẽ:

- lấy keyword ideas từ SE Ranking `similar`, `related`, `questions`, `longtail`
- mặc định discovery ở thị trường Úc
- enrich volume theo global proxy `US + UK + AU + CA`
- xuất file `.research.tsv` và `.research.json` trong thư mục `outputs/`

Có thể chỉnh market:

```bash
npm run research -- "ecommerce seo" --discover-markets au --volume-markets us,uk,au,ca
```

### 1. Lấy volume keyword

Chuẩn bị file `.tsv` chứa keyword, ví dụ:

```tsv
shopify seo checklist
shopify seo tips
shopify schema markup
shopify seo for beginners
shopify product page seo
```

Chạy:

```bash
npm run volume -- examples/ecommerce-easy.input.tsv
```

Tool sẽ trả ra keyword + volume. Mặc định volume là tổng của:

```text
US + UK + AU + CA
```

Lưu ý:

- Không gọi từng keyword riêng lẻ.
- Luôn batch nhiều keyword chung một lần để tiết kiệm SE Ranking units.
- Keyword volume `0` không nên dùng.
- Keyword volume `10` vẫn có thể dùng nếu topic dễ và đúng intent.

### 2. Lấy heading top Google Australia

Chạy:

```bash
npm run headings -- "shopify seo checklist"
```

Tool sẽ:

- dùng Serper lấy top Google Australia results
- dùng Firecrawl scrape từng URL
- extract H1/H2/H3
- lưu kết quả trong thư mục `outputs/`

Nếu Firecrawl không scrape được một vài URL thì bỏ qua URL đó, dùng các URL còn lại.

### 3. Xuất outline TSV để paste vào Google Sheets

Khi đã có outline JSON, chạy:

```bash
npm run outline -- examples/shopify-seo-checklist.outline.json
```

Output sẽ là TSV đúng format sheet.

Copy toàn bộ output và paste thẳng vào Google Sheets.

## Format Google Sheets

Sheet đang dùng các cột:

```text
# | Keyword | Volume | Số từ | Intent | Heading | Outline | Ref
```

Output không có header vì sheet đã có sẵn header.

Ví dụ format:

```tsv
1	shopify seo checklist	410	1800-2200	Informational / How-to	Title	Shopify SEO Checklist: Easy Fixes to Improve Your Store Rankings	https://www.shopify.com/blog/seo-checklist-online-store
	shopify seo tips	380			1.	What Is a Shopify SEO Checklist?	https://gofishdigital.com/blog/ultimate-shopify-seo-checklist/
	shopify schema markup	60			2.	Shopify SEO for Beginners: Start With the Basics	https://www.ecommerce-gold.com/shopify-seo/
```

## Quy tắc chọn keyword

- Keyword có volume cao nhất là keyword chính.
- Keyword chính bắt buộc có trong title.
- Keyword phụ phải có volume thấp hơn keyword chính.
- Keyword phụ nên xuất hiện trong heading nếu tự nhiên.
- Không nhồi keyword vào heading nếu nghe gượng.
- Không lấy keyword volume `0`.
- Ưu tiên keyword dễ hơn cho site mới.

## Quy tắc outline

- Dùng `Title`, sau đó đánh số heading:
  - `1.`
  - `1.1`
  - `1.2`
  - `2.`
  - `2.1`
- Không dùng label `H2`, `H3` trong output cuối.
- Outline nên vừa phải, không quá dày.
- Thường 7-10 heading chính là đủ.
- Intent chỉ ghi một lần cho cả bài.
- Ref source là URL của bài competitor, đặt ở cột `Ref`.

## Workflow chuẩn

1. Chọn keyword cluster.
2. Check volume bằng SE Ranking.
3. Chọn main keyword có volume cao nhất.
4. Dùng Serper + Firecrawl lấy heading top Google Australia.
5. So sánh heading competitor.
6. Loại heading rác, gom ý trùng.
7. Tạo outline final.
8. Paste TSV vào Google Sheets.
9. Dùng outline để triển khai content từng H2/H3.

## Lưu ý về API cost

SE Ranking:

- Keyword export tốn units theo request.
- Nên batch nhiều keyword trong một request.
- Không gọi từng keyword lẻ.

Serper:

- Dùng để lấy Google Australia SERP mặc định.
- Default là `DEFAULT_SERP_GL=au`.

Firecrawl:

- Dùng để scrape heading competitor.
- Một số site có thể bị chặn hoặc không support, bỏ qua được.

## Troubleshooting

Nếu báo thiếu API key:

```text
Missing SE_RANKING_API_KEY
Missing SERPER_API_KEYS
Missing FIRECRAWL_API_KEY
```

Kiểm tra lại file `.env`.

Nếu paste vào Google Sheets bị lệch cột:

- Đảm bảo copy trong block TSV.
- Không copy thêm markdown ``` nếu đang copy từ chat.
- Sheet phải đúng thứ tự cột:

```text
# | Keyword | Volume | Số từ | Intent | Heading | Outline | Ref
```

Nếu Firecrawl fail một vài URL:

- Không sao.
- Dùng các competitor còn scrape được.
- Có thể chạy lại keyword hoặc đổi `DEFAULT_SERP_GL`.

## Ghi nhớ

Tool này hỗ trợ research và format outline nhanh hơn. Người làm content vẫn cần review tay:

- check intent
- bỏ heading thừa
- thêm insight thật
- thêm internal link
- chỉnh outline cho đúng brand và audience
