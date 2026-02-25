# TechTrend Briefing — 完整專案規格說明書
### Version 1.0 | 2026-02-24

---

## 1. 專案概述

### 1.1 一句話定位
**面向技術決策者的 AI 驅動週刊訂閱服務，將碎片化的 AI/DevOps/框架動態轉化為可執行的商業洞察。**

### 1.2 問題陳述
企業 CTO 和技術主管每周需要花 5-10 小時追蹤 AI 模型更新、框架版本變動、工具定價異動、安全公告等碎片資訊。這些資訊散落在數百個官方文件站、部落格、GitHub Release 頁面中，且缺乏「對我的業務意味著什麼」的脈絡化分析。

### 1.3 解決方案
一套半自動化的內容生產 pipeline：
1. **資料蒐集層**：結構化管理 400+ 個資訊來源 URL
2. **分析生成層**：透過 NotebookLM + 自訂 Prompt 模板生成初稿
3. **編輯精煉層**：人工審稿 + AI 輔助校對
4. **發佈分發層**：電子報 + Web Dashboard + 可選 Podcast (Audio Overview)

### 1.4 目標用戶 (B2B)
| 用戶角色 | 痛點 | 付費意願 |
|---------|------|---------|
| 企業 CTO / VP Engineering | 沒時間追所有更新，怕漏掉關鍵變動 | 高 ($49-199/mo) |
| Tech Lead / Staff Engineer | 需要為團隊篩選值得關注的技術趨勢 | 中 ($19-49/mo) |
| 獨立開發者 / Side Project 族 | 同時管多個專案，需要跨領域情報整合 | 低-中 (Free-$9/mo) |

### 1.5 與 Alan 其他專案的關係
- **吃自己的狗食**：Alan 自己就是第一個用戶（6 個 side project 需要追蹤技術動態）
- **獨立產品**：TechTrend 的商業化不依賴其他專案，目標客群是外部 CTO/Tech Lead
- **附帶好處**：內容生產過程中累積的情報可回饋到其他專案的技術決策
- **OpenClaw 共用**：4 個 Agent 跑在 OpenClaw 上，與其他專案共享 Agent 基礎設施

---

## 2. 商業模式

### 2.1 營收模型：Freemium + 訂閱

| 方案 | 價格 | 內容 |
|------|------|------|
| **Free** | $0 | 月度摘要 (每月 1 篇)、公開部落格精選文章 |
| **Pro** | $9/mo | 完整週刊 (4 本 NB 涵蓋範圍)、歷史存檔搜尋、Audio 版 |
| **Team** | $29/mo (5 seats) | Pro 全部 + 自訂追蹤清單、Slack/Discord 推送、API 存取 |
| **Enterprise** | $99-199/mo | Team 全部 + 客製垂直領域報告、專屬分析師時間 |

### 2.2 關鍵指標 (North Star)
- **核心指標**：Weekly Active Readers (WAR) — 每周開啟閱讀的訂閱者數
- **商業指標**：MRR、Churn Rate、LTV:CAC ratio (目標 > 3:1)
- **內容指標**：完讀率 > 60%、可執行建議採用率（透過 survey 追蹤）

### 2.3 成本結構 (MVP 階段)
| 項目 | 月成本 | 備註 |
|------|--------|------|
| NotebookLM | $0 | Google 免費提供 |
| Gemini Pro 訂閱 | $0 | Alan 已有 |
| Claude Pro 訂閱 | $0 | Alan 已有 |
| 電子報平台 (Buttondown/Resend) | $0-9 | 初期免費方案 |
| Vercel 部署 | $0 | Hobby plan |
| 網域 | ~$12/yr | |
| Alan 的時間 (4hr/week) | — | 主要成本 |
| **Total** | **< $10/mo** | |

### 2.4 商業化里程碑
| 階段 | 時間 | 目標 | 動作 |
|------|------|------|------|
| Phase 0 (現在) | Week 0 | 內部使用驗證 | Alan 自己用 4 周，打磨 prompt 和流程 |
| Phase 1 | Month 1-2 | 50 免費訂閱者 | 公開 Free 版，在 Indie Hackers / Twitter / PTT 推廣 |
| Phase 2 | Month 3-4 | 10 付費用戶 | 開放 Pro 方案，驗證付費意願 |
| Phase 3 | Month 5-8 | $500 MRR | 新增 Team plan、API、Audio |
| Phase 4 | Month 9+ | $2K MRR | 自動化 pipeline、垂直領域擴展 |

---

## 3. 知識庫架構

### 3.1 四本 NotebookLM 設計

```
┌─────────────────────────────────────────────────────┐
│                TechTrend Briefing                     │
│              Knowledge Base Architecture              │
├─────────────┬─────────────┬──────────┬───────────────┤
│   📘 NB1    │   📘 NB2    │  📘 NB3  │    📘 NB4     │
│  AI 模型    │  開發框架    │  DevOps  │   商業化       │
│  & 工具     │  & 語言      │ & Infra  │   & 產品      │
├─────────────┼─────────────┼──────────┼───────────────┤
│ 130+ URLs   │ 70+ URLs    │ 80+ URLs │  90+ URLs     │
│             │             │          │               │
│ • 模型商     │ • Java/     │ • CI/CD  │ • SaaS 定價   │
│   官方文件   │   Spring    │ • Docker │ • 台灣金流    │
│ • 開源模型   │ • TS/       │ • K8s    │ • LINE 平台   │
│ • AI IDE    │   Next.js   │ • IaC    │ • Growth      │
│ • 圖像/影片  │ • Python/   │ • 監控   │ • 法律/IP     │
│ • 音樂/3D   │   FastAPI   │ • 安全   │ • 台灣創業    │
│ • Agent 平台 │ • DB        │ • 部署   │ • 信用卡市場  │
│ • 產業報告   │ • Roadmap   │ • 網路   │ • 成功案例    │
└─────────────┴─────────────┴──────────┴───────────────┘
```

### 3.2 來源管理規則
| 規則 | 說明 |
|------|------|
| 每本上限 | 50 個來源 (NotebookLM 限制) |
| 來源類型偏好 | docs 站 > 部落格 > GitHub > Wiki (避免 SPA/需登入頁) |
| 更新頻率 | 每周手動新增 2-3 篇當周重要文章 |
| 淘汰規則 | 超過 3 個月沒更新的來源降級或移除 |
| 失敗處理 | 紅色來源換為 /docs 或 /blog 替代路徑 |

### 3.3 來源檔案清單 (已建立)
| 檔案 | 內容 | URL 數量 |
|------|------|---------|
| `AI-Links-URLs-Only.txt` | NB1 全部 URL | 130+ |
| `NB2-Dev-Frameworks-URLs.txt` | NB2 全部 URL | 70+ |
| `NB3-DevOps-Infra-URLs.txt` | NB3 全部 URL | 80+ |
| `NB4-Commercial-Product-URLs.txt` | NB4 全部 URL | 90+ |

---

## 4. Prompt 系統

### 4.1 Prompt 架構總覽

```
Prompt 系統 (13 個模板)
│
├── 📘 NB1 周報 (3 個)
│   ├── 1-A：AI 周度趨勢摘要
│   ├── 1-B：專案影響分析 (8 個專案逐一對照)
│   └── 1-C：競品比較監控表
│
├── 📘 NB2 周報 (2 個)
│   ├── 2-A：框架版本更新 + 安全 + 棄用警告
│   └── 2-B：技術決策參考
│
├── 📘 NB3 周報 (2 個)
│   ├── 3-A：DevOps 動態 + 成本優化
│   └── 3-B：8 專案部署策略表
│
├── 📘 NB4 周報 (3 個)
│   ├── 4-A：SaaS 商業化趨勢
│   ├── 4-B：CardSense 深度分析
│   └── 4-C：SEEDCRAFT / LINE 生態分析
│
├── 📆 月度彙總 (1 個)
│   └── M-1：月度總結 + 下月預測 + 遺漏提醒
│
└── 🎙️ Audio Overview (1 個)
    └── Podcast 式自訂指令 (英文，10-15 分鐘)
```

### 4.2 Prompt 設計原則
| 原則 | 說明 |
|------|------|
| 結構化輸出 | 每個 prompt 指定 markdown 表格 / 分段格式 |
| 情境注入 | 每個 prompt 包含 Alan 的技術棧和專案清單作為 context |
| 消極確認 | 明確要求「沒影響就寫沒影響，不要硬湊」 |
| 可執行導向 | 每個輸出都包含「行動建議」欄位 |
| 繁體中文 | 所有 prompt 指定繁中，技術名詞保留英文 |

### 4.3 Prompt 檔案
| 檔案 | 內容 |
|------|------|
| `NotebookLM-Weekly-Briefing-Prompts.md` | 完整 13 個 prompt 模板 + 使用流程 + 進階技巧 |

---

## 5. 內容生產 Pipeline

### 5.1 每周工作流程

```
每周一 (30-45 分鐘)
│
├── Step 1：來源更新 (5 min)
│   ├── 掃描本周重要文章/公告
│   ├── 新增 2-3 篇到對應 NB
│   └── 移除過期或失效來源
│
├── Step 2：生成初稿 (15 min)
│   ├── NB1 → 跑 Prompt 1-A
│   ├── NB2 → 跑 Prompt 2-A
│   ├── NB3 → 跑 Prompt 3-A
│   └── NB4 → 跑 Prompt 4-A
│
├── Step 3：專案影響分析 (5 min)
│   └── NB1 → 跑 Prompt 1-B (八個專案)
│
├── Step 4：人工審稿 (10 min)
│   ├── 驗證關鍵事實
│   ├── 補充個人觀點/經驗
│   ├── 調整優先級排序
│   └── 刪除低價值內容
│
├── Step 5：發佈 (5 min)
│   ├── 彙整為單一週刊
│   ├── 發送電子報
│   ├── 更新 Web Dashboard
│   └── (選) 生成 Audio Overview
│
└── Step 6：歸檔 (2 min)
    ├── 存入 NotebookLM 筆記（供下周比較）
    └── 存入 Notion（長期記錄）
```

### 5.2 每月工作流程

```
每月最後一周 (額外 30 分鐘)
│
├── 跑 Prompt M-1 月度彙總
├── 四本 NB 的月度總結 → 複製到 Google Doc
├── 回顧本月發佈的 4 期週刊
├── 檢討：哪些預測準了？哪些漏了？
├── 來源大掃除（移除失效/低價值來源）
└── 輸出「月度技術雷達」報告
```

### 5.3 未來自動化路徑 (Phase 3+) — OpenClaw 驅動

**為什麼選 OpenClaw 而非 n8n：**
- Alan 已有 OpenClaw 基礎設施（Discord + Notion cron 已跑通）
- 減少工具數量 = 減少維護負擔（一人開發原則）
- OpenClaw 的 multi-agent routing 正好適合「蒐集 → 分析 → 撰寫 → 發佈」的多步驟流程
- Discord 既是控制台也是發佈頻道，一石二鳥

```
Phase 3 自動化架構 — OpenClaw 為唯一編排引擎
│
├── 🤖 Agent 1：Source Monitor (每日)
│   ├── RSS 訂閱 + GitHub Release API 輪詢
│   ├── 偵測關鍵來源更新 (版本號、定價、公告)
│   ├── 分類標記：NB1/NB2/NB3/NB4
│   ├── 寫入 Notion DB「本周素材庫」
│   └── 超過閾值 → Discord #alerts 即時通知
│
├── 🤖 Agent 2：Draft Writer (每周一 cron)
│   ├── 從 Notion 讀取本周素材
│   ├── 呼叫 Claude API (Sonnet 4.5) 跑 4 個周報 prompt
│   ├── 合併為單一週刊初稿
│   ├── 寫入 Notion「週刊草稿」頁
│   └── Discord @ Alan「初稿已生成，請審核」
│
├── 👤 Alan 審稿 (手動，10-15 min)
│   ├── 在 Notion 直接編輯
│   └── 標記 status = "approved"
│
├── 🤖 Agent 3：Publisher (status 變更觸發)
│   ├── Notion → Markdown 轉換
│   ├── 發送 Buttondown / Resend 電子報
│   ├── 觸發 Vercel webhook 重新部署 (Next.js ISR)
│   ├── 推送精華到 Discord #weekly-briefing
│   └── 更新 Notion status = "published"
│
└── 🤖 Agent 4：Feedback Collector (每周五 cron)
    ├── 從電子報平台拉取開信率 / 點擊率
    ├── 掃描 Discord 頻道回饋
    ├── 寫入 Notion「回饋追蹤」
    └── 月底自動觸發月度彙總 prompt
```

**OpenClaw Agent 通訊協議：**
```
Agent 間溝通 = Notion DB status 欄位變更
控制面板 = Discord（指令 + 通知 + 手動觸發）
數據面板 = Notion（素材庫 + 草稿 + 發佈記錄 + 指標）
```

---

## 6. 技術架構

### 6.1 MVP 架構 (Phase 0-2)：零程式碼

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  400+ URLs   │────▶│  NotebookLM  │────▶│  人工審稿     │
│  (4 本 NB)   │     │  + Prompts   │     │  (Alan)      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┤
                     ▼                            ▼
              ┌──────────────┐           ┌──────────────┐
              │  電子報       │           │  Web (靜態)   │
              │  Buttondown   │           │  Vercel       │
              └──────────────┘           └──────────────┘
```

**MVP 不需要寫任何程式碼。** 全部用現有工具串接。

### 6.2 Phase 3 架構：OpenClaw 半自動化

```
┌──────────────┐     ┌──────────────────────────────────────┐
│  RSS / GitHub│     │           OpenClaw                    │
│  Release API │────▶│  ┌─────────┐  ┌─────────┐           │
└──────────────┘     │  │ Agent 1 │─▶│ Agent 2 │           │
                     │  │ Monitor │  │ Writer  │           │
                     │  └─────────┘  └────┬────┘           │
                     │                    │                 │
                     │              ┌─────▼─────┐          │
                     │              │  Notion    │          │
                     │              │  (CMS)     │◀── Alan 審稿
                     │              └─────┬─────┘          │
                     │                    │                 │
                     │              ┌─────▼─────┐          │
                     │              │  Agent 3  │          │
                     │              │ Publisher │          │
                     │              └─────┬─────┘          │
                     └────────────────────┼────────────────┘
                                          │
                     ┌────────────────────┼────────────────┐
                     ▼                    ▼                 ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │  Buttondown   │  │   Next.js    │  │   Discord    │
              │  電子報       │  │   ISR/SSG    │  │  #briefing   │
              └──────────────┘  └──────┬───────┘  └──────────────┘
                                       │
                                ┌──────▼───────┐
                                │    Stripe    │
                                │   Billing    │
                                └──────────────┘
```

### 6.3 Phase 4 架構：全 SaaS (OpenClaw 全自動)

```
┌──────────────────────────────────────────────────────────┐
│                    OpenClaw Agent Hub                      │
│                    (GPT-5.3 驅動)                          │
│                                                           │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │ Monitor   │  │ Writer    │  │Publisher │  │Feedback│ │
│  │ Agent     │  │ Agent     │  │ Agent    │  │ Agent  │ │
│  │ (daily)   │  │ (weekly)  │  │(on-approve)│(weekly)│ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘ │
│        │              │              │             │      │
│        └──────────────┴──────┬───────┴─────────────┘      │
└──────────────────────────────┼────────────────────────────┘
                               │
                      ┌────────▼────────┐
                      │   GPT-5.3      │  ← 編排 + 初稿
                      │   (OpenClaw)   │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │  Claude Sonnet  │  ← 精修 + 觀點 (API or 手動)
                      │  4.5            │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │  PostgreSQL     │
                      │  + pgvector     │
                      │  (Supabase)     │
                      └────────┬────────┘
                               │
          ┌──────────┬─────────┼──────────┬──────────┐
          ▼          ▼         ▼          ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ Next.js  │ │ Resend │ │ REST   │ │Discord │ │ Notion │
   │Dashboard │ │ 電子報 │ │ API    │ │Bot     │ │ Mirror │
   └────┬─────┘ └────────┘ │(Team)  │ └────────┘ └────────┘
        │                   └────────┘
   ┌────▼─────┐
   │ Stripe   │
   │ + 綠界   │
   └──────────┘
```

### 6.4 技術選型

| 層 | Phase 0-2 (MVP) | Phase 3+ (SaaS) |
|----|-----------------|-----------------|
| 內容生成 | NotebookLM + 手動 Prompt | GPT-5.3 (初稿) + Claude Sonnet (精修) |
| 編排引擎 | 手動 | **OpenClaw** (GPT-5.3 驅動) |
| Agent 通訊 | — | Notion DB status + Discord 指令 |
| CMS | Google Docs / Notion | Notion API → PostgreSQL |
| 前端 | 靜態 HTML 或 Next.js | Next.js App Router + shadcn/ui |
| 電子報 | Buttondown (Free) | Resend API ($0 to start) |
| 付費 | Stripe Payment Links | Stripe Billing (訂閱管理) |
| 部署 | Vercel (Free) | Vercel Pro |
| 排程 | 手動 + Discord 提醒 | OpenClaw Discord Cron |
| 監控 | 無 | Vercel Analytics + PostHog |
| DB | 無 | PostgreSQL + pgvector (Supabase Free) |
| 搜尋 | 無 | pgvector (語義搜尋歷史期刊) |

---

## 7. OpenClaw Agent 設計規格

### 7.1 Agent 總覽

```
OpenClaw for TechTrend Briefing
│
├── Agent 1: SourceMonitor ─── 每日偵察兵
├── Agent 2: DraftWriter ───── 每周撰稿員
├── Agent 3: Publisher ──────── 發佈機器人
└── Agent 4: FeedbackBot ───── 回饋收集器
```

### 7.2 Agent 1: SourceMonitor

| 項目 | 規格 |
|------|------|
| 觸發方式 | Discord Cron，每日 08:00 UTC+8 |
| 輸入 | RSS feed list + GitHub Release API endpoints |
| LLM 呼叫 | GPT-5.3 (via OpenClaw，含在 GPT Plus 訂閱) |
| 輸出 | Notion DB「素材庫」新增記錄 |
| Discord 行為 | 靜默寫入；若偵測到高優先事件 → `#alerts` 頻道通知 |

**監控清單（初始 Phase 3）：**
```
RSS Feeds:
  - OpenAI Blog: https://openai.com/blog/rss.xml
  - Anthropic News: https://www.anthropic.com/rss.xml  
  - Google AI Blog: https://blog.google/technology/ai/rss/
  - Spring Blog: https://spring.io/blog.atom
  - Next.js Blog: https://nextjs.org/feed.xml
  - Vercel Blog: https://vercel.com/atom

GitHub Release Watch:
  - openai/openai-python
  - anthropics/anthropic-sdk-node
  - vercel/next.js
  - spring-projects/spring-boot
  - langchain-ai/langchain
  - ollama/ollama

API Pricing Watch (JSON endpoint polling):
  - OpenAI pricing page hash change
  - Anthropic pricing page hash change
```

**Notion DB Schema「素材庫」：**
```
| 欄位           | 類型     | 說明                          |
|---------------|----------|-------------------------------|
| title         | Title    | 事件標題                       |
| source        | URL      | 原始連結                       |
| category      | Select   | NB1 / NB2 / NB3 / NB4        |
| priority      | Select   | 🔴 高 / 🟡 中 / 🟢 低         |
| detected_at   | Date     | 偵測時間                       |
| summary       | Text     | Gemini Flash 生成的 2 句摘要    |
| used_in_issue | Relation | 關聯到哪一期週刊 (發佈後回填)    |
| status        | Select   | new / used / skipped          |
```

### 7.3 Agent 2: DraftWriter

| 項目 | 規格 |
|------|------|
| 觸發方式 | Discord Cron，每周一 09:00 UTC+8 |
| 輸入 | Notion「素材庫」status=new 的記錄 |
| LLM 呼叫 | GPT-5.3 (via OpenClaw，素材整理+初稿骨架) → Claude Sonnet 4.5 (精修+觀點生成，手動或 API) |
| Prompt 來源 | `NotebookLM-Weekly-Briefing-Prompts.md` 中的模板，動態注入本周素材 |
| 輸出 | Notion「週刊草稿」頁 |
| Discord 行為 | `@Alan 📝 Issue #XX 初稿已生成，請審核` + 連結 |

**Prompt 組裝邏輯（雙模型接力）：**
```python
# 虛擬碼 — OpenClaw Agent (GPT-5.3) 負責編排和初稿

# Step 1: GPT-5.3 via OpenClaw — 素材整理 + 初稿骨架
materials = notion.query("素材庫", filter={"status": "new"})
grouped = group_by(materials, "category")  # NB1/NB2/NB3/NB4

draft_sections = {}
for category in ["NB1", "NB2", "NB3", "NB4"]:
    prompt = load_template(f"prompt_{category}_weekly")
    prompt = inject_context(prompt, grouped[category])
    # OpenClaw 內建 GPT-5.3 處理
    draft_sections[category] = gpt_generate(prompt)

top3 = gpt_generate(
    f"從以下素材中挑出本周最重要的 3 個事件，列出標題和理由：{draft_sections}"
)

skeleton = assemble(top3, draft_sections, next_week_preview)

# Step 2: Claude Sonnet 4.5 — 精修觀點 (兩種路徑)
#   路徑 A (Phase 3 初期): Alan 手動貼入 Claude chat 精修
#   路徑 B (Phase 4): OpenClaw 呼叫 Claude API 自動精修
final_draft = claude_refine(skeleton)  # 路徑 B

notion.create_page("週刊草稿", content=final_draft, status="pending_review")
discord.notify("@Alan 📝 初稿已生成")
```

**為什麼雙模型接力而非單一模型：**
- OpenClaw 原生綁 GPT-5.3，改不了也不需要改
- GPT-5.3 擅長結構化整理、工具呼叫、多步驟編排
- Claude Sonnet 擅長繁中寫作語感、觀點生成、避免 AI 味
- 初稿 80% 靠 GPT（自動化），精修 20% 靠 Claude（品質）
- Phase 3 初期 Claude 精修可以手動做，零額外 API 成本

**Notion DB Schema「週刊草稿」：**
```
| 欄位           | 類型     | 說明                      |
|---------------|----------|---------------------------|
| issue_number  | Number   | 期數                       |
| week_range    | Text     | "2026-W09 (Feb 24 - Mar 2)"|
| content       | Text     | Markdown 全文              |
| status        | Select   | pending_review / approved / published |
| reviewer_note | Text     | Alan 審稿備註               |
| published_at  | Date     | 發佈時間                    |
| open_rate     | Number   | 電子報開信率 (回填)          |
| click_rate    | Number   | 點擊率 (回填)               |
```

### 7.4 Agent 3: Publisher

| 項目 | 規格 |
|------|------|
| 觸發方式 | Notion Webhook：status 從 `pending_review` → `approved` |
| 輸入 | Notion「週刊草稿」approved 頁面 |
| 輸出 | 電子報 + Web + Discord |
| Discord 行為 | `✅ Issue #XX 已發佈` + 各平台連結 |

**發佈動作序列：**
```
1. Notion 讀取 approved 草稿
2. Markdown → HTML 轉換 (含 email template)
3. Buttondown/Resend API 發送電子報
4. 觸發 Vercel Deploy Hook (Next.js rebuild)
5. Discord #weekly-briefing 貼出精華版 (Top 3 + 連結)
6. 更新 Notion status = "published" + published_at
```

### 7.5 Agent 4: FeedbackBot

| 項目 | 規格 |
|------|------|
| 觸發方式 | Discord Cron，每周五 17:00 UTC+8 |
| 輸入 | 電子報平台 API (開信率/點擊率) + Discord 頻道訊息 |
| LLM 呼叫 | GPT-5.3 (via OpenClaw，輕量分析) |
| 輸出 | Notion「回饋追蹤」+ Discord 週報 |

**月底額外觸發：**
```
每月最後一個周五：
1. 拉取當月 4 期的指標
2. GPT-5.3 跑月度彙總 prompt
3. (選) 把月度報告貼入 Claude chat 做深度觀點補充
4. 輸出「月度技術雷達」到 Notion
5. Discord @Alan「📊 月度報告已生成」
```

### 7.6 LLM 分工策略

```
┌─────────────────────────────────────────────────────┐
│              TechTrend LLM 分工                      │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │  GPT-5.3        │    │  Claude Sonnet  │         │
│  │  (via OpenClaw)  │    │  4.5            │         │
│  │                  │    │                  │         │
│  │  • Agent 編排    │    │  • 精修觀點      │         │
│  │  • 素材整理分類  │    │  • 繁中語感      │         │
│  │  • 初稿骨架生成  │    │  • 深度分析      │         │
│  │  • 工具呼叫      │    │  • 月度報告      │         │
│  │  • 回饋分析      │    │                  │         │
│  │                  │    │                  │         │
│  │  Cost: $0       │    │  Cost: $0       │         │
│  │  (GPT Plus)     │    │  (Claude Pro     │         │
│  │                  │    │   or 手動 chat)  │         │
│  └─────────────────┘    └─────────────────┘         │
│           │                      │                   │
│           ▼                      ▼                   │
│     自動化流程              品質把關流程              │
│     (80% 工作量)           (20% 工作量)              │
│                                                      │
│  ┌─────────────────┐                                │
│  │  Gemini Flash   │  備用：NotebookLM 內建         │
│  │  (AI Studio)    │  Phase 0-2 手動階段主力         │
│  │  Cost: $0       │  Phase 3+ 降為交叉驗證用        │
│  └─────────────────┘                                │
└─────────────────────────────────────────────────────┘
```

**三訂閱零 API 成本策略：**
| 訂閱 | 月費 | 在 TechTrend 的角色 |
|------|------|-------------------|
| GPT Plus | $20 | OpenClaw 全部 Agent 的 LLM 引擎 |
| Claude Pro | $20 | 精修寫作 + NotebookLM prompt (手動) |
| Gemini Pro | $20 | NotebookLM 內建 + AI Studio 驗證 |
| **Total** | **$60** | **已有訂閱，TechTrend 零額外成本** |

### 7.7 OpenClaw 開發優先級

| 順序 | Agent | 複雜度 | 前置條件 | 預估開發時間 |
|------|-------|--------|---------|------------|
| 1 | Agent 2 (DraftWriter) | 中 | Claude API key + Notion API | 2-3 天 |
| 2 | Agent 3 (Publisher) | 低 | Buttondown/Resend 帳號 | 1 天 |
| 3 | Agent 1 (SourceMonitor) | 中 | RSS 解析 + GitHub API | 2 天 |
| 4 | Agent 4 (FeedbackBot) | 低 | 電子報平台 API | 1 天 |

**建議**：先手動跑 Phase 0-2（4 周），同時開發 Agent 2。當 Agent 2 穩定後再依序建立其餘 Agent。這樣 Phase 0 的人工流程自然過渡到 Phase 3 的 Agent 驅動，不會有斷層。

---

## 8. 附帶功能：內部專案情報路由

> **本章描述的是 TechTrend 的附帶功能，不是核心定位。** TechTrend 的核心是面向外部客戶的 B2B 技術週刊。以下是 Alan 作為第一個用戶的個人化使用方式。

### 8.1 情報路由表（用於 Prompt 1-B）

每周 Prompt 1-B 的專案影響分析，可加入 Alan 自己 6 個專案的追蹤項：

| NB 來源 | CardSense | RTA | SEEDCRAFT | TechTrend 自身 | 小決定 | 冰箱管理 |
|---------|-----------|-----|-----------|---------------|-------|---------|
| NB1 AI | OCR 模型 | Embedding | TTS + 圖像 | 內容生成模型 | 推薦 AI | 食材辨識 |
| NB2 框架 | Spring Boot CVE | FastAPI | LINE SDK | Next.js | Next.js | PWA |
| NB3 DevOps | Railway | Modal GPU | Vercel CDN | Vercel | Vercel | Vercel |
| NB4 商業 | 聯盟行銷 | SaaS 定價 | LINE 生態 | 電子報趨勢 | App 變現 | 訂閱模式 |

### 8.2 SourceMonitor 可選擴充

如果需要，Agent 1 的監控清單可加入各專案關鍵來源。這是 opt-in 擴充：

```
CardSense 專屬: 銀行優惠公告、金管會 RSS、Stripe changelog
RTA 專屬: Google Maps Platform blog、Cohere blog、scikit-learn releases
SEEDCRAFT 專屬: LINE Developers blog、教育部公告、ElevenLabs changelog
小決定 專屬: 推薦系統論文、情境感知 API
冰箱管理 專屬: TFDA 食安公告、Open Food Facts API、食譜 API
```

### 8.3 情報觸發規則

| 事件類型 | 觸發動作 | 通知 |
|---------|---------|------|
| 框架 CVE (CVSS ≥ 7) | 即時 Discord #alerts | 受影響專案 |
| 平台定價變動 | 成本影響評估 | #cost-tracking |
| 模型重大更新 | 加入本周 Top 3 候選 | 週刊 + 對應專案 |

---

## 9. 內容規格

### 7.1 週刊結構

```
TechTrend Briefing — Week XX, 2026
│
├── 🔥 本周 Top 3 (必讀，< 2 分鐘)
│   ├── 事件摘要
│   ├── 影響分析
│   └── 行動建議
│
├── 📊 AI 模型 & 工具 (來自 NB1)
│   ├── 模型更新追蹤表
│   ├── 工具動態
│   └── 定價變動
│
├── ⚙️ 開發框架 & DevOps (來自 NB2 + NB3)
│   ├── 版本更新
│   ├── 安全公告
│   └── 新工具推薦
│
├── 💼 商業化洞察 (來自 NB4) [Pro only]
│   ├── SaaS 市場動態
│   ├── 定價策略案例
│   └── 台灣市場特報
│
├── 🔮 下周關注 (< 1 分鐘)
│
└── 📎 延伸閱讀連結 (5-10 個精選)
```

### 7.2 內容品質標準
| 維度 | 標準 |
|------|------|
| 長度 | 總字數 1500-2500 字（5-8 分鐘閱讀） |
| 時效性 | 所有內容基於當周 (Mon-Sun) 的動態 |
| 可執行性 | 每個 section 至少 1 個具體行動建議 |
| 原創性 | 不是轉貼，每則需加入分析觀點 |
| 準確性 | 版本號/價格/日期需交叉驗證 |
| 格式 | 表格優先、bullet 精簡、不超過 3 層嵌套 |

### 7.3 內容日曆
| 日 | 動作 |
|----|------|
| 周一 | 生成初稿 + 審稿 |
| 周二早 | 發佈週刊 (電子報 + Web) |
| 周二晚 | 生成 Audio Overview (選) |
| 周五 | 收集讀者回饋 + 記錄遺漏項 |
| 月底 | 月度彙總 + 來源大掃除 |

---

## 10. 版權與法律

### 12.1 內容版權策略
| 項目 | 策略 |
|------|------|
| 來源引用 | 所有事實需標注出處連結，不逐字引用 |
| 原創分析 | Alan 的觀點和分析為原創內容 |
| AI 生成內容 | 經人工審稿後發佈，視為編輯作品 |
| 訂閱者權利 | 個人使用；Team plan 可團隊內部轉發 |
| 商業轉載 | 需書面授權 |

### 12.2 風險項目
| 風險 | 等級 | 緩解措施 |
|------|------|---------|
| AI 生成不實資訊 | 中 | 人工審稿驗證所有數字/版本號 |
| 引用侵權 | 低 | 只做摘要分析，不逐字複製 |
| 金融資訊責任 | 中 | CardSense 相關內容加免責聲明 |
| NotebookLM 服務變動 | 中 | Phase 3 後遷移至 Claude API 自建 |

---

## 11. 成功標準與退出條件

### 12.1 各階段 Go/No-Go

| 階段 | 成功條件 | 退出條件 (Stop) |
|------|---------|----------------|
| Phase 0 | Alan 自己覺得有用，持續使用 4 周 | 跑了 2 周覺得是浪費時間 |
| Phase 1 | 50 免費訂閱者 within 2 months | 2 個月 < 20 訂閱者 |
| Phase 2 | 10 付費用戶 within 2 months | 2 個月 < 3 付費用戶 |
| Phase 3 | $500 MRR within 4 months | 4 個月 < $200 MRR |
| Phase 4 | $2K MRR, < 5% monthly churn | 連續 3 個月 MRR 下降 |

### 12.2 與其他專案的資源競爭
- TechTrend Briefing 每周投入上限：**4 小時**
- 如果超過此時間且未達成階段目標 → 優先降低此專案投入，專注 CardSense
- Phase 3 自動化後目標降至 **2 小時/周**

---

## 12. 已建立的資產清單

### 12.1 本次對話產出
| # | 檔案 | 用途 |
|---|------|------|
| 1 | `AI-Industry-Landscape-2026.md` | AI 產業完整版圖 (8 大類，含版權標注) |
| 2 | `AI-Landscape-Links-for-NotebookLM.md` | 帶分類說明的 URL 清單 |
| 3 | `AI-Links-URLs-Only.txt` | NB1 純 URL (130+) |
| 4 | `NB2-Dev-Frameworks-URLs.txt` | NB2 純 URL (70+) |
| 5 | `NB3-DevOps-Infra-URLs.txt` | NB3 純 URL (80+) |
| 6 | `NB4-Commercial-Product-URLs.txt` | NB4 純 URL (90+) |
| 7 | `NotebookLM-Weekly-Briefing-Prompts.md` | 13 個 Prompt 模板 + 流程 |
| 8 | `TechTrend-Briefing-Spec.md` | 本文件 |

### 12.2 待建立
| # | 項目 | 階段 | 優先級 |
|---|------|------|--------|
| 1 | Landing Page (Next.js or Carrd) | Phase 1 | 高 |
| 2 | Buttondown 電子報帳號設定 | Phase 1 | 高 |
| 3 | 第一期週刊樣本 | Phase 0 | 最高 |
| 4 | Stripe Payment Link | Phase 2 | 中 |
| 5 | OpenClaw Agent 1: Source Monitor | Phase 3 | 中 |
| 6 | OpenClaw Agent 2: Draft Writer | Phase 3 | 中 |
| 7 | OpenClaw Agent 3: Publisher | Phase 3 | 低 |
| 8 | Next.js Dashboard + Supabase | Phase 4 | 低 |

---

## 13. 下一步行動 (This Week)

```
□ 1. 把四份 URL 文件匯入 NotebookLM 四本 notebook
□ 2. 修復失效來源 (用替代 URL)
□ 3. 用 Prompt 1-A 跑第一次 AI 周報
□ 4. 用 Prompt 1-B 跑第一次專案影響分析
□ 5. 人工審稿，記錄體感 (值不值得繼續？)
□ 6. 存檔為「Issue #0 — Internal Pilot」
□ 7. 下周一重複，連續跑 4 周驗證
```

---

*本文件為 TechTrend Briefing 的 living document，隨專案演進持續更新。*
*Owner: Alan | Created: 2026-02-24 | Next Review: Phase 1 啟動時*
