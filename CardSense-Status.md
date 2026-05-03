# CardSense — 台灣信用卡付款決策引擎

CardSense 的產品方向已從「情境式卡片比較平台」收斂為 **台灣信用卡付款前 decision engine**：

> 輸入我的卡、商家、支付方式、金額與今天的規則，直接回答「這筆該刷哪張、實拿多少、為什麼，以及哪些條件會讓結果翻車」。

CardSense 不追求短期內複製 iCard.AI、Money101 或卡優新聞網的完整卡片/SEO 目錄。下一階段的核心是 **My Wallet + transaction decision + trust explanation**，先把高頻消費場景的「當下決策品質」做到可信、可解釋、可分享。

> **Live**: https://cardsense-web.vercel.app  
> **Last updated**: 2026-04-30  
> **Current source of direction**: [CardSense Review 2026-04-29](./reviews/2026-04-29-cardsense-review/CardSense-Review-2026-04-29.md) + [Product Direction vs iCard.AI](./reviews/2026-04-29-cardsense-review/CardSense-Product-Direction-vs-iCardAI.md)

---

## 子專案與 Repo

| 子專案 | 角色 | 技術棧 | 部署 | GitHub |
|--------|------|--------|------|--------|
| cardsense-contracts | 共用資料契約：JSON Schema、DTO、列舉、merchant registry、stackability、benefit plan | JSON Schema | — | [WaddleStudio/cardsense-contracts](https://github.com/WaddleStudio/cardsense-contracts) |
| cardsense-extractor | 銀行優惠資料擷取、正規化、版本化、SQLite/Supabase 匯入 | Python 3.13+ / uv / Pydantic / SQLite + Supabase sync | Local/Ops | [WaddleStudio/cardsense-extractor](https://github.com/WaddleStudio/cardsense-extractor) |
| cardsense-api | 確定性推薦 API 與 rule engine | Java 21 / Spring Boot / SQLite / Supabase / Maven | Render | [WaddleStudio/cardsense-api](https://github.com/WaddleStudio/cardsense-api) |
| cardsense-web | 前端決策流程、My Wallet、推薦結果與分享體驗 | React 19 / TypeScript 5.9 / Vite 8 / shadcn/ui / Tailwind CSS 4 | Vercel | [WaddleStudio/cardsense-web](https://github.com/WaddleStudio/cardsense-web) |

---

## 架構總覽

```text
銀行官網 ──→ Extractor ──→ JSONL ──→ SQLite ──→ Supabase ──→ API (Render) ──→ Frontend (Vercel)
              │                        │            │
              │  scrape / heuristic    │  local DB   │  PostgreSQL (prod)
              │  normalize / version   │            │  deterministic DecisionEngine
              ▼                        ▼            ▼
        cardsense-contracts      cardsense-contracts
        (schema validation)      (DTO / response contracts)
```

**核心設計原則**：

- **用戶請求路徑零 LLM**：推薦結果由確定性規則引擎產生，必須可重現、可審計。
- **有效回饋優先於 headline rate**：排序依 caps、thresholds、registration、eligibility、date、payment method 後的實拿價值。
- **信任層是產品功能，不是備註**：每筆推薦都要能顯示 source、verified date、valid period、matched rules、excluded rules、assumptions、confidence。
- **Privacy-light My Wallet**：初期只需要卡名與可選方案/上限使用量，不收卡號。
- **商業排序與有機排序分離**：affiliate 或商業合作不得靜默影響推薦排名。

**資料流**：

1. Extractor 從銀行官網擷取優惠頁面。
2. scrape → parse_rules → normalize → validate → version，產生 JSONL。
3. `import_jsonl_to_db.py` 匯入 SQLite `promotion_current`。
4. `refresh_and_deploy.py` 完成全銀行提取、匯入、同步至 Supabase。
5. API 在 production 從 Supabase 讀取，local 可直接連 SQLite。
6. Frontend 呼叫 API，將推薦結果轉成可理解、可檢查、可分享的付款決策。

---

## 現況快照

### 已具備能力

| 面向 | 現況 |
|------|------|
| 產品骨架 | merchant-first calculator、My Wallet、benefit plan switching、recommendation result、分享圖已有初版 |
| Rule engine | Spring Boot deterministic `DecisionEngine`，已支援情境推薦與部分 stackability / benefit plan |
| 資料 pipeline | contracts、extractor、SQLite、Supabase、API production path 已串起 |
| 已支援銀行 | E.SUN、CATHAY、TAISHIN、FUBON、CTBC |
| 高頻商家 | 已開始補強全聯、momo、Shopee、Agoda、Uber Eats、LINE Pay、Apple Pay、Costco、日本消費等場景 |
| Review 證據 | 2026-04-29 已完成 product / UX / QA / engineering / security report-only review，含 production screenshots |

### 主要風險

| 優先級 | 風險 | 影響 |
|--------|------|------|
| P0 | `/calc` route 斷裂，但 share URL 產生 `/calc` | 社群分享導流會進空白 SPA shell |
| P0 | `channel=ALL` 未當 wildcard | 會排除原本應符合的優惠，例如 CUBE Japan rewards |
| P0 | invalid enum / maxResults 回 200 + empty recommendations | 使用者與前端無法分辨輸入錯誤或真的沒有推薦 |
| P0 | 推薦結果缺少可見 trust layer | 使用者不容易相信金錢決策 |
| P0 | extractor local `.env` 曾含高權限 Supabase / Cloudflare secret | 需要 rotate 並改 least-privilege / secret manager |
| P1 | `promotion_current` publish 非 atomic | production 可能讀到空資料或 partial data |
| P1 | Java model 與 JSON Schema contract drift | 未來 client generation 與跨 repo 協作會壞 |
| P1 | merchant registry 與 API hardcoded aliases 分裂 | 商家匹配品質會難以維護 |
| P1 | mobile primary flow 過長 | checkout-time 決策場景被資訊密度淹沒 |
| P1 | public recommendation POST 缺 rate limiting | 可用性、成本與 audit log 可能被濫用 |

### 2026-04-30 修復 PR 狀態

本輪 P0/P1 修復已合併至各 repo default branch；本機已 fast-forward 到最新狀態。Post-merge 已完成 build / unit / targeted integration / production API smoke；剩餘未完成項目集中在 browser helper setup 後的瀏覽器層 QA、外部 secret rotation，以及後續 release/deploy 觀察。

| Repo | PR | 覆蓋項目 | 驗證 |
|------|----|----------|------|
| cardsense-web | [#5](https://github.com/WaddleStudio/cardsense-web/pull/5) + post-merge CTA fix | `/calc` route、trust result panel、no-result UI、mobile progressive disclosure；修正 desktop sticky CTA 遮擋內容 | Merged；`npm run build` pass；`npm run test:unit` pass，91 tests；Google Chrome production `/` 與 `/calc?amount=1000` 回 200，local CTA fix verified |
| cardsense-api | [#3](https://github.com/WaddleStudio/cardsense-api/pull/3) | `channel=ALL` wildcard、invalid request 400、public recommendation POST protection、merchant registry matcher、trust metadata passthrough | Merged；`mvn test` pass，78 tests；production `/health` Supabase UP，`/v1/cards` 回 103 張卡，invalid category 回 400 |
| cardsense-extractor | [#3](https://github.com/WaddleStudio/cardsense-extractor/pull/3) | atomic `promotion_current` PostgreSQL publish、credential policy / rotation guidance | Merged；`uv run pytest tests/test_supabase_store.py` pass，21 tests |
| cardsense-contracts | [#2](https://github.com/WaddleStudio/cardsense-contracts/pull/2) | recommendation request/response schema drift、trust/no-result fields | Merged；JSON parse checks pass for schemas、examples、taxonomy |
| fleet-command | [#2](https://github.com/WaddleStudio/fleet-command/pull/2) | P0/P1 repair status and review evidence docs | Merged；local `main` fast-forwarded |

**Verification gaps / follow-up**：

- Google Chrome evidence saved under `reviews/2026-05-03-post-merge-chrome/`：production smoke screenshots + local CTA fix screenshots and JSON reports.
- Exposed local secrets still require real rotation in Supabase / Cloudflare consoles. The extractor PR adds policy and safer sync behavior, but cannot rotate external credentials by itself.

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查 |
| GET | `/v1/banks` | 銀行列表 |
| GET | `/v1/cards` | 卡片目錄，支援 bank / scope / eligibilityType 篩選 |
| GET | `/v1/cards/{cardCode}/promotions` | 卡片優惠列表，依 category 分組 |
| GET | `/v1/cards/{cardCode}/plans` | 卡片 benefit plan 列表 |
| GET | `/v1/exchange-rates` | 系統預設點數 / 里程估值牌告 |
| POST | `/v1/recommendations/card` | 情境推薦 |

Frontend 穩定消費欄位：`recommendations[].estimatedReturn`、`promotionBreakdown`、`disclaimer`、`activePlan`。下一階段需補強：`confidence`、`matchedRules`、`excludedRules`、`assumptions`、`source`、`verifiedAt`、`validUntil`。

---

## 產品北極星

### 選擇

| 決策 | 選擇 | 原因 |
|------|------|------|
| Primary job | 幫使用者決定「這筆消費刷哪張卡」 | 最能和 listing / SEO 型網站差異化 |
| 初期資料範圍 | 少量高頻、可驗證場景 | 可信 50 個場景比模糊 7,000 筆資料更有價值 |
| 排名依據 | eligibility + caps + thresholds 後的有效回饋 | 使用者要的是實拿，不是最高標題%數 |
| My Wallet | local-first，卡名即可，不收卡號 | 降低隱私與使用門檻，未來可加 account sync |
| SEO | 少量高信任 scenario / merchant pages | 每頁都要回到互動式決策流程 |
| AI | 可輔助 parsing / explanation draft / QA，不做 unchecked final decision | 金錢決策需要 deterministic output |

### 已接受的預設決策

| 問題 | 目前預設 |
|------|----------|
| My Wallet local-only 或 account-backed？ | local-first，但資料模型保留未來 account sync 空間 |
| MVP merchant 數量？ | 20-50 個高頻台灣場景，重質不重量 |
| MVP 是否放 affiliate link？ | 可放但必須揭露，且不得影響有機排序 |
| AI 是否對使用者可見？ | 不作為 primary chatbot；只用於 parsing、explanation draft、QA 輔助 |
| 第一個 public growth asset？ | methodology/trust page + 3-5 個 scenario pages |

### 暫緩事項

- 不追全銀行、全信用卡、全 SEO 類別頁。
- 不擴張到貸款、保險。
- 不以 affiliate CTA 作為 MVP 排序中心。
- 不把 AI chatbot 當 primary UX。
- 不在 freshness / eligibility 不足時硬給高信心推薦。

---

## 30/60/90 Roadmap

### 0-30 天：Prove The Decision Wedge

| Workstream | Deliverable |
|------------|-------------|
| Product | My Wallet + transaction input + one best card + 1-2 alternatives |
| UX | 首頁改成付款決策語境；mobile 以 Scenario → Wallet → Recommendation progressive disclosure 呈現 |
| Engine | 修 `/calc`、`channel=ALL` wildcard、invalid request 400；處理 cap、threshold、date、registration |
| Trust | Result panel 顯示 source freshness、valid period、matched/excluded rules、assumptions、confidence |
| Data | 20-50 個高頻台灣 merchants/scenarios verified rules |
| QA | momo、Shopee、Agoda、Uber Eats、LINE Pay、Apple Pay、Costco、保費、海外消費 regression cases |
| Security | rotate exposed local secrets；建立 extractor credential policy |

### 31-60 天：Build Retention

| Workstream | Deliverable |
|------------|-------------|
| Product | manual cap usage / reward ledger / bonus progress |
| Data | user correction loop：reward posted / did not post / merchant categorized differently |
| UX | promotion expiry alerts；best-card changed alerts |
| Engine | confidence score based on source freshness、merchant certainty、rule completeness |
| Growth | 3-5 個高信任 scenario pages + methodology page |
| Ops | staging table + validation + atomic promote 設計與第一版落地 |

### 61-90 天：Create Defensibility

| Workstream | Deliverable |
|------------|-------------|
| Product | personal card strategy dashboard：caps、年費門檻、首刷任務 |
| Data | source snapshots、promotion change history、versioned audit trail |
| Engine | scenario simulation：amount changes、cap used、not new customer、wrong payment method |
| Trust | public methodology page + affiliate policy |
| Growth | CardSense Verified pages for top 100 merchants/scenarios |

---

## P0 Implementation Backlog

| ID | 任務 | 主要檔案 / repo | 驗收條件 |
|----|------|-----------------|----------|
| P0-1 | 修復 `/calc` route 與 share URL canonical path | `cardsense-web/src/App.tsx`, `CalcPage.tsx`, `ShareButton.tsx` | production `/calc` 可載入或 redirect；分享 URL 不再導向空白 shell |
| P0-2 | `channel=ALL` wildcard | `cardsense-api/.../DecisionEngine.java` | request `ONLINE/OFFLINE` 可命中 `ALL` promotions；新增單元測試 |
| P0-3 | invalid request 回 `400` | `RecommendationController.java`, `RecommendationRequest.java` | invalid `category/paymentMethod/channel/maxResults` 不再回 200 empty |
| P0-4 | Trust Result Panel | `ResultPanel.tsx`, `RecommendationResults.tsx`, API response contract | 顯示 source、verifiedAt、validUntil、matched/excluded rules、assumptions、confidence |
| P0-5 | No-result reason engine + UI | API DecisionEngine + web result state | 無推薦時能說明被排除的 payment method、channel、merchant、date、registration、cap |
| P0-6 | Secrets rotation / credential policy | `cardsense-extractor`, deployment secrets | local `.env` 移除高權限實值；service role 不作為日常 importer |

---

## P1 Implementation Backlog

| ID | 任務 | 主要檔案 / repo | 驗收條件 |
|----|------|-----------------|----------|
| P1-1 | Contract-first recommendation tests | `cardsense-contracts`, `cardsense-api` | Java model 與 JSON Schema request/response fixtures 不 drift |
| P1-2 | Merchant registry generated matcher | `merchant-registry.json`, API matcher | API aliases 由 registry 派生，不再靠分散 hardcoded map |
| P1-3 | `stackability` first-class | contracts → Pydantic → DB → repository | 不只存在 `raw_payload_json`，推薦可用結構化欄位解釋 |
| P1-4 | Atomic publish | extractor Supabase store/versioning | staging + validation + promote，避免 delete-then-upsert 空窗 |
| P1-5 | Mobile progressive disclosure | `cardsense-web` calculator/result | 375px 以上可順暢完成 input → result → explanation |
| P1-6 | Public API protection | API security/filter/edge | recommendation POST 有 body size、rate limit、基本 abuse protection |

---

## Carried But Not Yet Scheduled

以下 review findings 需要保留在追蹤範圍內，但不應打斷 0-30 天 decision wedge：

| 項目 | 來源風險 | 建議排程 |
|------|----------|----------|
| `recommendation_audits` persistent audit trail | 金錢決策需要 request/response、evaluated promo versions、engine version、latency、error 可追溯 | 60-90 天，source snapshots / promotion history 一起設計 |
| `promoId` logical key hardening | 同標題同日活動可能互相覆蓋，需納入 source section、planId、condition hash | 31-60 天，與 atomic publish / versioning 同批 |
| Feedback widget upload security | browser 直接 anon upload/insert 風險高 | P1 security batch，改 backend/Edge Function、CAPTCHA、MIME/size validation、RLS |
| Pinned contracts dependency | Vercel build 不應 clone mutable contracts branch | P1 DX/Ops batch，改 pinned commit/tag/package |
| Secret scanning | 已發現 local secret 風險，需防止再次進 repo | P0 security follow-up，導入 Gitleaks / secretlint |

---

## Subagent-Driven Development 執行計畫

使用 `superpowers:subagent-driven-development` 時，這份 backlog 要拆成「一次一個 implementer task」，每個 task 經過兩段 review：spec compliance reviewer → code quality reviewer。避免多個實作 subagent 同時改同一 repo 或同一檔案。

### 建議任務順序

| 順序 | Task | Scope | Exit criteria | gstack evidence |
|------|------|-------|---------------|-----------------|
| A | `/calc` route + share URL 修復 | `cardsense-web` routing 與 share URL | `/calc` 不空白；query params 保留；`npm run build` pass | `2026-04-30-calc-desktop.png`, `2026-04-30-calc-mobile.png` |
| B | DecisionEngine request correctness | `channel=ALL` wildcard + invalid request 400 | API tests 覆蓋 `ALL`、invalid enum、invalid maxResults；既有 recommendation tests 不 regress | 若影響 production flow，補 `2026-04-30-decision-flow-desktop.png` |
| C | Trust Result Panel contract slice | API response trust fields + frontend display | 結果顯示 source、verifiedAt、validUntil、matched/excluded rules、assumptions、confidence；缺資料有 fallback | `2026-04-30-trust-panel-desktop.png`, `2026-04-30-trust-panel-mobile.png` |
| D | No-result reasons | engine 排除原因 + web no-result state | 系統錯誤不被包成 no-result；reason categories 可測且可讀 | `2026-04-30-no-result-mobile.png` |
| E | Merchant registry matcher | 從 `merchant-registry.json` 產生或載入 API matcher | 全聯、momo、Agoda、Uber Eats、LINE Pay、Apple Pay regression scenarios pass | `2026-04-30-merchant-registry-flow.png` |
| F | Security/Ops hardening plan | secrets rotation checklist、least-privilege importer、atomic publish migration plan | repo 不新增 secret；credential policy 可執行；atomic publish migration 有 rollback | 不需 browser evidence；需附 command/test evidence |

### 每個 task 的交付格式

- Implementer must report：changed files、tests run、manual verification、concerns。
- Spec reviewer must answer：是否符合本文件對應 ID 的驗收條件、有無 overbuild / underbuild。
- Code quality reviewer must answer：可維護性、測試品質、錯誤處理、cross-repo contract risk。
- Controller 才能標記 task done；reviewer 有 open issue 時不得進下一個 task。

---

## gstack 驗證計畫

每個前端或 production-facing task 完成後，用 `gstack` 做瀏覽器層驗證，至少覆蓋 desktop 與 375px mobile。

| 驗證點 | gstack 操作 | 通過條件 |
|--------|-------------|----------|
| Production smoke | `goto https://cardsense-web.vercel.app`、`text`、`console --errors`、`network` | 首頁載入，無關鍵 JS error，API failure 有可理解狀態 |
| `/calc` share route | `goto https://cardsense-web.vercel.app/calc?...` | 不空白；可 redirect 或正常顯示 calculator；query params 不丟失 |
| Decision flow | `snapshot -i`、fill merchant/payment/amount、submit、`snapshot -D` | 30 秒內可以從情境輸入到推薦或明確 waiting/retry state |
| Mobile checkout UX | `viewport 375x812`、`screenshot --viewport` | input、primary recommendation、理由區不 overlap；advanced settings 不壓過主流程 |
| Trust panel | result screenshot + text inspection | 可看到 source freshness、valid period、matched/excluded rules 或明確缺資料 fallback |
| No-result state | 使用刻意不匹配條件 | 顯示具體 reason，不只顯示空列表 |
| Cold start | reload production after idle | 後端喚醒中有 retry/cold-start message，不只 skeleton |

gstack evidence 應存入當次 review 或 task folder，檔名包含日期、surface、viewport，例如 `2026-04-30-calc-mobile.png`。

---

## 已知限制

- POINTS / MILES 估值仍偏粗，高階哩程計畫估值需持續演進。
- `STACK_ALL_ELIGIBLE` 仍偏 heuristic，待 stackability 結構化後升級。
- Break-even 目前是 pairwise 分析，尚非完整最佳化模型。
- Real extractor 依賴銀行網站可用性，頁面改版需要人工調整。
- Merchant registry 已有基礎，但高頻商家到 promotion rules 的 end-to-end 覆蓋仍需補強。
- Production backend cold start 約可到 60-75 秒，必須被視為正式 UX 情境。

---

## 相關文件

- [CardSense Review 2026-04-29](./reviews/2026-04-29-cardsense-review/CardSense-Review-2026-04-29.md) — product / UX / QA / engineering / security 綜合 review
- [CardSense Product Direction vs iCard.AI](./reviews/2026-04-29-cardsense-review/CardSense-Product-Direction-vs-iCardAI.md) — 下一階段產品北極星與 30/60/90 roadmap
- [cardsense-api/IMPLEMENTATION_CHECKLIST.md](../cardsense-api/IMPLEMENTATION_CHECKLIST.md) — API 待辦細項
- [CardSense-Bank-Promo-Review-Workflow.md](./CardSense-Bank-Promo-Review-Workflow.md) — 優惠審查與 benefit-plan 流程
- [fleet-command/specs/spec-cardSense.md](./specs/spec-cardSense.md) — 完整專案規格書
- [fleet-command/docs/Supabase-Discord-Webhook-Setup.md](./docs/Supabase-Discord-Webhook-Setup.md) — Feedback Widget 串接說明
