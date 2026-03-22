# CardSense — 情境式信用卡推薦平台

CardSense 是一個以**情境式卡片比較**為核心的信用卡推薦平台。不同於傳統的單筆優惠排名，CardSense 接收使用者的消費情境（金額、類別、通路、日期等），過濾不符合條件的優惠，比較各張卡在該情境下的有效回饋，回傳可解釋的推薦結果。

> **Live**: https://cardsense-web.vercel.app

## 子專案

| 子專案 | 角色 | 技術棧 | 部署 |
|--------|------|--------|------|
| [cardsense-contracts](./cardsense-contracts/) | 共用資料契約（schema、DTO、列舉） | JSON Schema | — |
| [cardsense-extractor](./cardsense-extractor/) | 銀行優惠資料擷取與正規化 | Python 3.13+ / uv / Pydantic / SQLite | Local |
| [cardsense-api](./cardsense-api/) | 情境推薦 REST API | Java 21 / Spring Boot / SQLite | Railway |
| [cardsense-web](./cardsense-web/) | 前端展示 | Vite + React + shadcn/ui + Tailwind | Vercel |

## 架構總覽

```
銀行官網 ──→ Extractor ──→ JSONL ──→ SQLite ──→ API (Railway) ──→ Frontend (Vercel)
              │                        │
              │  parse / normalize     │  promotion_current table
              │  validate / version    │
              ▼                        ▼
        cardsense-contracts      cardsense-contracts
        (schema 驗證)            (DTO / response 契約)
```

**資料流**：
1. **Extractor** 從銀行官網擷取原始優惠頁面（local 執行）
2. 經過 parse → normalize → validate → version 產生 JSONL
3. JSONL 匯入 **SQLite** 的 `promotion_current` table
4. `refresh_and_deploy.py` 一鍵完成全銀行提取 → 匯入 → 部署至 Railway
5. **API** (Railway) 從 SQLite 讀取 promotion 資料，提供情境推薦端點
6. **Frontend** (Vercel) 呼叫 API 展示推薦結果

## 完成進度

| 模組 | 狀態 | 說明 |
|------|------|------|
| cardsense-contracts | ✅ 完成 | Promotion / Recommendation schema 穩定 |
| cardsense-extractor | ✅ 核心完成 | E.SUN + Cathay + TAISHIN + FUBON real extractor、JSONL + SQLite 匯入 |
| cardsense-api | ✅ 核心完成 + 已部署 | 情境推薦、雙模式比較（BEST_SINGLE / STACK_ALL）、break-even、scope 過濾；Railway 上線 |
| cardsense-web | ✅ MVP 完成 + 已部署 | 推薦表單 + 卡片目錄（63 張卡）+ 銀行篩選 + API 連線狀態；Vercel 上線 |
| 資料庫遷移 | ⏳ 規劃中 | SQLite → Supabase，待前端需求觸發 |
| 銀行擴充 | 🔄 進行中 | TAISHIN ✅ FUBON ✅ 完成、下一批：CTBC |
| Auth / Rate Limiting | ⏳ 未開始 | Phase 2 商業化時實作 |

## 已支援銀行

- ✅ **E.SUN（玉山）** — HTML 頁面抽取
- ✅ **CATHAY（國泰）** — Model JSON 抽取
- ✅ **TAISHIN（台新）** — Cloudflare Browser Rendering + HTML 抽取
- ✅ **FUBON（富邦）** — Cloudflare Browser Rendering + HTML 抽取
- ⏳ CTBC / MEGA / FIRST / SINOPAC / TPBANK / UBOT

## 待辦工作路線圖（Roadmap）

### Phase 1：新銀行擴充 + Extractor 能力提升

**新銀行優先序**：TAISHIN ✅ → FUBON ✅ → CTBC（CTBC 因 WAF 保護暫緩）

- 每家銀行先分析官網結構，判斷適用 HTML 抽取或 JSON API
- 復用 `promotion_rules.py` 與 `run_real_bank_job.py` 共用層
- 每家銀行作為獨立 extractor 檔案（如 `ctbc_real.py`）
- 完成一家就匯入 SQLite 並跑 API smoke test，不等全部做完

**Extractor 能力提升**：

- 強化 `sectioned_page.py` 的 section detection，支援更多 heading 模式
- 在 `promotion_rules.py` 增加更多 category/channel signal 權重
- 為每家新銀行建立 fixture 檔案，確保 heuristic 變更不破壞既有銀行
- 考慮加入「頁面結構偵測」步驟，自動判斷頁面類型再分派 extractor

### Phase 2：商業化準備

**前提**：Phase 1 達到 5 家銀行 + 前端穩定。

- API Key 認證 + Rate Limiting
- 免責聲明 + 聯盟行銷連結揭露
- B2B 客戶 onboarding 流程
- Stripe Billing 整合（API 訂閱制）
- 前端進階功能：break-even 視覺化、多優惠堆疊展示（feature flag 控制）

### Phase 3：資料庫遷移（SQLite → Supabase）

不急，按觸發條件決定時機。**任一成立即啟動**：

- 多個前端環境需要共享讀取
- audit log 需外部查詢
- extractor 需集中儲存
- 部署環境需共享 persistence

**遷移步驟**：

1. 凍結前端 API 契約
2. 完成 E.SUN / CATHAY 端對端 smoke coverage
3. 建立 PostgreSQL schema parity
4. 加入 repository abstraction 雙跑測試
5. 切換至 Supabase

### Phase 4：Skill 整理

- 現有 3 個 skill（contract-evolution、git-commit-push、api-smoke-postman）維護良好，保持不變
- 考慮新增：
  - `cardsense-extractor-new-bank` — 新銀行 extractor 開發的標準流程
  - `cardsense-full-pipeline-verify` — 從抽取到 API 驗證的端對端驗收流程
- 把重複性高的操作（extract → import → smoke test）封裝成 skill

## 快速開始

### Extractor — 擷取銀行優惠資料

```bash
cd cardsense-extractor
uv sync
uv run pytest                                    # 單元測試
uv run python jobs/run_esun_real_job.py           # 玉山 real extraction
uv run python jobs/run_cathay_real_job.py         # 國泰 real extraction
uv run python jobs/run_taishin_real_job.py        # 台新 real extraction
uv run python jobs/run_fubon_real_job.py          # 富邦 real extraction
uv run python jobs/import_jsonl_to_db.py \
  --input outputs/fubon-real-*.jsonl \
  --db data/cardsense.db                          # 匯入 SQLite

# 一鍵全銀行提取 → 匯入 → 部署
uv run python jobs/refresh_and_deploy.py          # 全部銀行
uv run python jobs/refresh_and_deploy.py --banks FUBON TAISHIN  # 指定銀行
```

### API — 啟動推薦服務（本地開發）

```bash
cd cardsense-api
mvn spring-boot:run \
  -Dspring-boot.run.jvmArguments="\
    -Dcardsense.repository.mode=sqlite \
    -Dcardsense.repository.sqlite.path=D:/alan_self/cardsense/cardsense-extractor/data/cardsense.db"
```

### Frontend — 啟動前端（本地開發）

```bash
cd cardsense-web
npm install
npm run dev                                       # http://localhost:5173
```

### 線上環境

| 服務 | 平台 | URL |
|------|------|-----|
| Frontend | Vercel | https://cardsense-web.vercel.app |
| API | Railway | (internal，透過前端 proxy 存取) |

API 端點：

- `GET /health` — 健康檢查
- `GET /v1/cards?bank=ESUN&scope=RECOMMENDABLE` — 卡片目錄
- `GET /v1/banks` — 銀行列表
- `POST /v1/recommendations/card` — 情境推薦

### Contracts — 檢視共用契約

```bash
cd cardsense-contracts
# 直接瀏覽 promotion/ 與 recommendation/ 目錄下的 JSON Schema
```

## 子專案連結

- [cardsense-contracts README](./cardsense-contracts/README.md) — 共用資料契約、schema、列舉定義
- [cardsense-extractor README](./cardsense-extractor/README.md) — 資料擷取 pipeline、銀行 extractor、SQLite 匯入
- [cardsense-api README](./cardsense-api/README.md) — 推薦 API、比較模式、break-even 分析
- [cardsense-web README](./cardsense-web/README.md) — 前端展示、推薦表單、卡片目錄
- [API Implementation Checklist](./cardsense-api/IMPLEMENTATION_CHECKLIST.md) — API 待辦與前端 / 資料庫遷移時機
