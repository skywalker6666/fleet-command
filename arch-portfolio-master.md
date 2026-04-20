# Alan's Project Portfolio — 主力專案整合架構
### Version 1.3 | 2026-04-20

---

## 1. 為什麼需要這份文件

Alan 同時推進 6 個主力專案。這份文件解決：
1. **重複造輪子**：統一技術棧、共享元件、一致的架構模式
2. **時間碎片化**：明確優先級和時間分配
3. **整合機會**：專案之間有天然的串接點，提前規劃

---

## 2. 六大主力專案總覽

```
┌─────────────────────────────────────────────────────────────┐
│                    Alan's Portfolio 2026                      │
│                                                              │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ CardSense  │ │   RTA    │ │SEEDCRAFT │  產品專案         │
│  │ 信用卡推薦  │ │ 評論分析  │ │ 家庭教育  │                  │
│  └────────────┘ └──────────┘ └──────────┘                  │
│                                                              │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ TechTrend  │ │ 小決定    │ │冰箱管理   │  產品專案         │
│  │ 技術週刊    │ │ 決策輔助  │ │ 食材系統  │                  │
│  └────────────┘ └──────────┘ └──────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            OpenClaw (自動化層)                         │   │
│  │     Discord Bot × Notion × GPT-5.3                   │   │
│  │     → Cron 排程 → Agent 編排 → 跨專案自動化            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 專案定位矩陣

| 專案 | 一句話定位 | 商業模式 | 階段 | 優先級 |
|------|----------|---------|------|--------|
| **CardSense** | 確定性信用卡推薦 API | B2B API + B2C 比較站 | Sprint 2+ 進行中 | 🔴 最高 |
| **RTA** | AI 驅動的 Google 評論信任度分析 | Freemium SaaS | V1 完成 | 🔴 高 |
| **SEEDCRAFT** | 台灣家庭的 AI 教育成長系統 | 訂閱制 (LINE) | Rebrand 完成 | 🟡 中 |
| **TechTrend** | 面向技術決策者的 AI 驅動技術週刊 | B2B 訂閱制電子報 | Spec 完成 | 🟡 中 |
| **小決定** | 日常選擇困難的 AI 決策輔助工具 | Freemium App | 概念階段 | 🟢 規劃中 |
| **冰箱管理** | 家庭食材管理 + 過期提醒 + 食譜推薦 | Freemium App | 概念階段 | 🟢 規劃中 |

> **TechTrend 是一個獨立的 B2B 產品**，主要面向企業 CTO 和技術主管。它也附帶服務 Alan 自己的其他專案（作為情報來源），但這只是它的功能之一，不是它的全部定位。

### 2.2 商業化優先級排序邏輯

```
CardSense (最高)
  確定性邏輯 = 可審計 = 金融場景剛需
  收入路徑最清晰：API 訂閱 + 聯盟行銷
  
RTA (高)
  V1 已有、Google Maps 生態龐大
  需要 custom model 拉開差距
  
SEEDCRAFT (中)
  台灣市場明確、LINE 平台就緒
  教育市場付費轉換慢

TechTrend (中)
  B2B 週刊訂閱 = 可預測的 recurring revenue
  MVP 零程式碼、低成本啟動
  附帶功能：Alan 自己的技術情報來源
  
小決定 (規劃中)
  日常高頻 = 高黏性
  monetization 路徑待驗證

冰箱管理 (規劃中)
  家庭剛需但競品多
  與「小決定」和 CardSense 有整合空間
```

---

## 3. 共享基礎設施

### 3.1 技術共享層

```
共享基礎設施
│
├── 🔐 Auth & User (共用設計模式)
│   ├── JWT + RBAC pattern
│   ├── 各專案獨立 DB，但 schema 設計一致
│   └── 未來可用 shared auth service 統一
│
├── 💳 Payment (Stripe 為主)
│   ├── CardSense: Stripe Billing (API 訂閱)
│   ├── RTA: Stripe Payment Links (Freemium)
│   ├── SEEDCRAFT: 綠界 + LINE Pay (台灣市場)
│   ├── TechTrend: Stripe Billing (電子報訂閱)
│   ├── 小決定: Stripe or IAP (待定)
│   └── 冰箱管理: Stripe or IAP (待定)
│
├── 🚀 Deployment (Vercel + Railway)
│   ├── Next.js 前端 → Vercel (all projects)
│   ├── API backend → Railway (CardSense, RTA)
│   ├── LINE Bot → Railway (SEEDCRAFT)
│   └── 靜態/輕量 → Vercel (TechTrend, 小決定, 冰箱)
│
├── 📊 Monitoring (統一儀表板)
│   ├── Vercel Analytics (前端)
│   ├── PostHog (用戶行為)
│   └── UptimeRobot (API 健康)
│
├── 🤖 LLM 策略 (三訂閱分工)
│   ├── GPT-5.3 (via OpenClaw): Agent 自動化
│   ├── Claude Sonnet 4.5: 寫作品質 + 複雜推理
│   └── Gemini Flash: 免費額度 + NotebookLM
│
└── 📦 Shared npm Packages (Phase 4 目標)
    ├── @alan/auth-utils
    ├── @alan/stripe-helpers
    ├── @alan/ui-components (shadcn wrapper)
    └── @alan/web-mcp-tools (AEO 策略)
```

### 3.2 OpenClaw 跨專案 Agent 部署

```
OpenClaw Agent Hub (GPT-5.3)
│
├── 🕵️ TechTrend Agents (4 個)
│   ├── SourceMonitor — 每日來源偵測
│   ├── DraftWriter — 每周初稿
│   ├── Publisher — 審核後發佈
│   └── FeedbackBot — 回饋收集
│
├── 💳 CardSense Agents (2 個，Phase 3)
│   ├── PromoWatcher — 監控銀行優惠頁更新
│   └── DataExtractor — 新優惠自動進 extraction pipeline
│
├── ⭐ RTA Agents (2 個，Phase 3)
│   ├── ReviewMonitor — 追蹤目標商家新評論
│   └── ModelTrainer — 定期觸發 training pipeline
│
├── 🌱 SEEDCRAFT Agents (1 個，Phase 2)
│   └── ContentScheduler — LINE 推播排程 + 個性化內容
│
├── 🎲 小決定 Agents (1 個，Phase 2)
│   └── ContextGatherer — 蒐集環境資訊 (天氣/時間/位置) 輔助推薦
│
├── 🧊 冰箱管理 Agents (1 個，Phase 2)
│   └── ExpiryAlert — 食材到期提醒 + 食譜建議推播
│
└── 🔧 跨專案 Agents
    ├── HealthChecker — 每日檢查所有專案 API 健康
    ├── CostTracker — 月度成本彙總 (API calls, hosting)
    └── WeeklyDigest — 匯整所有專案本周進度 → Discord
```

### 3.3 TechTrend 的附帶功能：跨專案情報

TechTrend 是一個面向外部客戶的 B2B 技術週刊產品。它的**主要商業目標**是為企業技術決策者提供付費訂閱內容。

**附帶功能**：TechTrend 在內容生產過程中累積的情報，也能回饋到 Alan 自己的其他專案。這是加分項，不是核心定位。

| NB 來源 | 主要用途 (對外) | 附帶回饋 (對內) |
|---------|---------------|----------------|
| NB1 AI 模型 | 週刊 AI 版塊 | RTA embedding 選型、SEEDCRAFT TTS 工具 |
| NB2 框架 | 週刊框架版塊 | CardSense Spring Boot CVE、全專案 Next.js |
| NB3 DevOps | 週刊 DevOps 版塊 | 部署平台定價變動影響評估 |
| NB4 商業 | 週刊商業版塊 | CardSense 聯盟行銷、SEEDCRAFT LINE 生態 |

---

## 4. 跨專案依賴與整合點

### 4.1 專案間資料流

```
CardSense ◄──────── 小決定 (消費場景 → 最佳付款卡推薦)
    ▲
    │                冰箱管理 (超市採購 → 最優信用卡)
    │
RTA ◄──────────── SEEDCRAFT (教育場所評論 → 家長決策)
    ▲
    └──────────── 小決定 (餐廳選擇 → 評論可信度)

TechTrend ─── 獨立 B2B 產品 (附帶：內部技術情報回饋)

OpenClaw ──── ALL (所有專案的 Agent 編排引擎)
```

### 4.2 具體整合場景

| 場景 | 涉及專案 | 整合邏輯 |
|------|---------|---------|
| 「今晚吃什麼」 | 小決定 → RTA → CardSense | 小決定推薦餐廳 → RTA 驗證評論 → CardSense 推薦最優卡 |
| 「冰箱快過期」 | 冰箱管理 → 小決定 | 到期食材 → 推薦食譜 → (選) 缺料採購建議 |
| 「採購最划算」 | 冰箱管理 → CardSense | 採購清單 → CardSense 推薦超市回饋最高的卡 |
| 「補習班選哪家」 | SEEDCRAFT → RTA | 推薦補習班 → RTA 分析家長評論真實度 |
| 「這餐廳評論可信嗎」 | 小決定 → RTA | 點選餐廳 → RTA 信任度評分 |

### 4.3 整合優先級

```
Phase 現在：各專案獨立開發
Phase 2：小決定 → CardSense API 串接（最高商業價值的組合）
Phase 2：冰箱管理 → 小決定（食材到期 → 食譜推薦）
Phase 3：RTA 評論引擎開放 API → SEEDCRAFT / 小決定呼叫
Phase 3：冰箱管理 → CardSense（採購 → 最優卡推薦）
Phase 4：統一用戶系統 + 跨專案數據打通
```

---

## 5. 統一技術棧

### 5.1 語言與框架

| 層 | 選擇 | 使用的專案 |
|----|------|----------|
| 前端 | Next.js (App Router) + shadcn/ui | ALL |
| API (輕量) | Next.js API Routes | TechTrend, 小決定/冰箱 |
| API (重) | FastAPI (Python) | RTA (ML pipeline) |
| API (金融) | Spring Boot (Java) | CardSense (審計需求) |
| 平台整合 | LINE Messaging API + LIFF | SEEDCRAFT |
| DB | PostgreSQL (Supabase) | ALL |
| ORM | Drizzle (TS) / SQLAlchemy (Python) / Spring Data JPA | 依語言 |
| 部署 | Vercel (前端) + Railway (backend) | ALL |

### 5.2 LLM 使用矩陣

| 專案 | 請求路徑用 LLM？ | 離線用 LLM？ | 模型 |
|------|----------------|-------------|------|
| CardSense | ❌ 確定性規則 | ✅ 優惠文字 extraction | Gemini Flash (免費) |
| RTA | ⚠️ 混合 (rules+ML) | ✅ embedding + training | Cohere Embed + 自訂模型 |
| SEEDCRAFT | ✅ 教練對話 | ✅ 內容生成 | Claude Sonnet (對話) + Gemini Flash (內容) |
| TechTrend | ❌ 非即時 | ✅ 週刊生成 | GPT-5.3 (初稿) + Claude (精修) |
| 小決定 | ✅ 推薦邏輯 | — | GPT-5.3 (via OpenClaw) 或 Claude |
| 冰箱管理 | ✅ 食譜推薦 | ✅ 食材辨識 | GPT-5.3 + 圖像辨識模型 (待選) |

### 5.3 成本總覽

| 項目 | 月費 | 服務的專案 |
|------|------|----------|
| GPT Plus | $20 | OpenClaw (ALL) + 小決定 |
| Claude Pro | $20 | SEEDCRAFT 對話 + TechTrend 精修 + 開發輔助 |
| Gemini Pro | $20 | CardSense extraction + NotebookLM + 備用 |
| Vercel (Free→Pro) | $0-20 | ALL 前端 |
| Railway (Starter) | $0-5 | CardSense API + RTA API |
| Supabase (Free) | $0 | ALL DB |
| Buttondown (Free) | $0 | TechTrend |
| **Total** | **$60-85** | |

---

## 6. 文件體系

### 6.1 規格書架構

```
Portfolio Documentation
│
├── 📋 Portfolio-Master-Architecture.md ← 本文件
│   (跨專案架構、共享基礎設施、整合點、統一技術棧)
│
├── 📘 CardSense-Spec.md
│   (3-repo 架構、確定性 API、銀行優惠 extraction)
│   Status: 待產出（基於 Sprint 0 資料補齊）
│
├── 📘 RTA-Spec.md
│   (混合評分系統、Google Maps 整合、custom model 計劃)
│   Status: 待產出（基於 V1 資料補齊）
│
├── 📘 SEEDCRAFT-Spec.md
│   (LINE-first MVP、100% 原創 IP、台灣家庭市場)
│   Status: 待產出（基於 rebrand 後資料補齊）
│
├── 📘 TechTrend-Briefing-Spec.md ✅ 已完成
│   (B2B 技術週刊、NotebookLM、OpenClaw Agent)
│
├── 📘 SmartChoice-Spec.md (小決定，暫定名)
│   (日常決策輔助、情境感知推薦)
│   Status: 待產出（全新規劃）
│
├── 📘 FridgeManager-Spec.md (冰箱管理，暫定名)
│   (食材管理、到期提醒、食譜推薦)
│   Status: 待產出（全新規劃）
│
└── 📎 支援文件 (已完成)
    ├── AI-Industry-Landscape-2026.md
    ├── AI-Links-URLs-Only.txt
    ├── NB2-Dev-Frameworks-URLs.txt
    ├── NB3-DevOps-Infra-URLs.txt
    ├── NB4-Commercial-Product-URLs.txt
    └── NotebookLM-Weekly-Briefing-Prompts.md
```

### 6.2 各 Spec 文件標準結構

每份專案 spec 都包含以下章節（確保一致性）：

```
1. 專案概述（定位、問題、解法、目標用戶）
2. 商業模式（定價、指標、成本、里程碑）
3. 系統架構（架構圖、技術選型）
4. 資料模型（DB schema、API 契約）
5. LLM 策略（用什麼模型、在哪個環節、成本）
6. OpenClaw Agent 設計（自動化哪些流程）
7. 跨專案整合點（與其他專案的 API 串接、依賴）
8. 版權與法律風險
9. 成功標準與退出條件
10. 下一步行動
```

> 注意：不是每個專案都需要從 TechTrend 獲取情報。TechTrend 是獨立 B2B 產品，不是其他專案的必要依賴。跨專案整合在 Section 7 中按需描述。

---

## 7. TechTrend Spec 的補充建議

TechTrend 的核心定位不變：**B2B 技術週刊訂閱服務**。以下是建議在現有 spec 中補充的小功能：

### 7.1 附帶功能：內部專案情報路由

在 Prompt 1-B（專案影響分析）中，可選擇加入 Alan 自己 6 個專案的追蹤項。這不是 TechTrend 的核心功能，而是 Alan 作為第一個用戶的個人化使用方式：

| NB 來源 | CardSense | RTA | SEEDCRAFT | 小決定 | 冰箱管理 |
|---------|-----------|-----|-----------|-------|---------|
| NB1 AI | OCR 模型 | Embedding | TTS/圖像 | 推薦 AI | 食材辨識 |
| NB2 框架 | Spring Boot | FastAPI | LINE SDK | Next.js | Next.js/PWA |
| NB3 DevOps | Railway | Modal | Vercel | Vercel | Vercel |
| NB4 商業 | 聯盟行銷 | SaaS 定價 | LINE 生態 | App 變現 | 訂閱模式 |

### 7.2 SourceMonitor 可選擴充

如果 Alan 想讓 TechTrend 的 Agent 1 同時監控各專案相關來源，可以加入專案專屬 RSS。但這是 **opt-in 擴充**，不是必要功能。

---

## 8. 建議的產出順序

```
已完成:
  ✅ TechTrend-Briefing-Spec.md
  ✅ Portfolio-Master-Architecture.md (本文件)
  ✅ Supabase-Discord-Webhook-Setup.md (2026-04-20)

下一步 (建議順序):
  1️⃣ CardSense-Spec.md         ← 最高商業優先級 + Sprint 2+ 資料持續累積
  2️⃣ RTA-Spec.md               ← V1 已有，補齊 custom model + Agent SDK
  3️⃣ SEEDCRAFT-Spec.md         ← rebrand 後需重新定義 LINE MVP scope
  4️⃣ SmartChoice-Spec.md (小決定) ← 全新，需從頭設計
  5️⃣ FridgeManager-Spec.md (冰箱) ← 全新，可與小決定平行規劃

每份 spec 預估:
  - 已有基礎 (CardSense, RTA, SEEDCRAFT): 1 個對話回合
  - 全新 (小決定, 冰箱管理): 1-2 個對話回合
```

---

## 9. 每周時間分配建議

| 專案 | 每周時數 | 活動 |
|------|---------|------|
| CardSense | 8-10 hr | Sprint 1 開發 |
| RTA | 6-8 hr | Custom model + Agent SDK |
| SEEDCRAFT | 4-6 hr | LINE MVP 開發 |
| TechTrend | 3-4 hr | 週刊生成 + 來源維護 + 訂閱增長 |
| 小決定 | 2-3 hr | 規格設計 + 原型 |
| 冰箱管理 | 2-3 hr | 規格設計 + 原型 |
| OpenClaw | 2 hr | Agent 開發 (跨專案共用) |
| **Total** | **27-36 hr/week** | |

> ⚠️ 超過 32 hr/week 時的砍線順序：冰箱管理 → 小決定 → SEEDCRAFT → TechTrend
> CardSense 和 RTA 的時數不能低於各自下限。

---

*本文件為 Portfolio Master Architecture，統籌所有主力專案的技術決策和資源分配。*
*Owner: Alan | Created: 2026-02-24 | Updated: 2026-04-20 | Next: 產出 CardSense-Spec.md*
