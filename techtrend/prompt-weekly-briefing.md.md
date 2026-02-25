# NotebookLM 每周趨勢簡報 — Prompt 模板集
# 適用對象：Alan (2.5年經驗 side project 開發者，8個商業化專案同時進行)
# 最後更新：2026/02/24

---

## ═══════════════════════════════════════
## 🔄 使用流程 (每周一次，約 30 分鐘)
## ═══════════════════════════════════════
##
## 1. 進入對應的 NotebookLM notebook
## 2. 點擊來源旁的「刷新」確保內容最新（部落格/新聞類來源）
## 3. 複製下方對應 prompt 貼入聊天
## 4. 將輸出存成筆記 or 匯出
## 5. 每月底用「月度彙總」prompt 做回顧
##
## ⚠️ NotebookLM 只能基於已加入的來源回答
##    所以來源品質 = 簡報品質
##    建議每周手動新增 1-2 篇當周重要文章作為來源


## ═══════════════════════════════════════
## 📘 NB1：AI 模型 & 工具 — 周報 Prompt
## ═══════════════════════════════════════

### Prompt 1-A：AI 周度趨勢摘要

```
根據所有來源中的最新資訊，幫我生成本周 AI 產業趨勢簡報，格式如下：

## 🔥 本周重點 (Top 3)
列出本周最重要的 3 個 AI 產業動態，每個包含：
- 事件摘要（2-3 句）
- 對獨立開發者的影響（1 句）
- 行動建議（1 句）

## 📊 模型更新追蹤
列出本周有版本更新或重大公告的模型，用表格呈現：
| 模型商 | 更新內容 | 影響程度 (高/中/低) |

## 🛠️ 工具動態
列出本周有重大更新的 AI 開發工具或創意工具

## 💰 定價變動
列出任何 API 定價、免費額度、訂閱方案的變動

## 🔮 下周關注
根據目前趨勢，下周值得關注的事件或發布

請用繁體中文回答，風格簡潔直接，避免廢話。
```

### Prompt 1-B：特定專案影響分析

```
我同時在開發以下專案，請根據來源中的最新資訊，分析本周 AI 動態對每個專案的具體影響：

1. CardSense — 規則式信用卡推薦 API（刻意不用 LLM）
2. Review Trust Analyzer — Google Maps 評論可信度分析（Gemini Flash + 規則 + ML 混合）
3. SEEDCRAFT — 台灣家庭教育平台（LINE-first，Claude Sonnet + Gemini Flash）
4. OpenClaw — Agent 自動化框架（Discord + Notion + n8n）
5. TechTrend Briefing — B2B 技術趨勢訂閱服務

對每個專案，回答：
- 本周是否有直接相關的模型/工具更新？
- 是否有新的免費額度或降價機會？
- 是否有競品動態需要注意？
- 具體行動項目（如果有的話）

沒有影響的專案直接寫「本周無直接影響」，不要硬湊。
```

### Prompt 1-C：競品與替代方案監控

```
根據來源，幫我比較以下各類別中的主要競爭者最新狀態：

1. 通用 LLM：GPT-5.2 vs Claude Opus 4.6 vs Gemini 3 Pro — 最新能力、定價、context window
2. 快速推理：Gemini Flash vs Claude Haiku vs GPT-5 mini — 延遲、成本、適用場景
3. 開源模型：Llama 4 vs DeepSeek vs Qwen vs Mistral — 最新版本、授權、性能
4. 程式碼助手：Cursor vs Claude Code vs Copilot vs Aider — 最新功能比較
5. 圖像生成：Midjourney v7 vs Imagen 4 vs Flux vs Firefly — 商用授權差異

用表格呈現，重點標出「本周有變動」的項目。
```


## ═══════════════════════════════════════
## 📘 NB2：開發語言 & 框架 — 周報 Prompt
## ═══════════════════════════════════════

### Prompt 2-A：框架更新摘要

```
根據來源，整理本周我的技術棧相關的更新：

我的技術棧：
- Java 21 + Spring Boot 4 + Spring Security + JPA
- TypeScript + Next.js + React + Tailwind + shadcn/ui
- Python + FastAPI + Pydantic + SQLAlchemy
- PostgreSQL + Redis

請整理：

## 框架版本更新
| 技術 | 版本 | 重要變更 | 是否需要升級 |

## 安全性公告
列出任何影響我技術棧的 CVE 或安全更新

## 新功能 / 最佳實踐
本周來源中提到的、對我的專案有價值的新功能或實踐

## 棄用警告
即將 EOL 或被棄用的技術/版本

只列出有實際變動的項目，沒更新的不用提。
```

### Prompt 2-B：跨專案技術決策參考

```
根據來源中的最新資訊，針對我正在考慮的以下技術決策提供建議：

1. Spring Boot 4 vs 3.5 — 我的 CardSense API 應該升級嗎？有什麼 breaking changes？
2. Next.js App Router 最新狀態 — 穩定度如何？效能改善多少？
3. FastAPI vs Spring Boot — 我的新專案應該用哪個？考量因素包含：開發速度、部署成本、生態系
4. Drizzle ORM vs Prisma — TypeScript 專案該選哪個？最新比較
5. PostgreSQL 最新版的向量搜尋能力 — pgvector 是否足以取代獨立向量資料庫？

每個決策給我：結論 → 理由 → 注意事項，各 1-2 句就好。
```


## ═══════════════════════════════════════
## 📘 NB3：DevOps & Infra — 周報 Prompt
## ═══════════════════════════════════════

### Prompt 3-A：DevOps 動態摘要

```
根據來源，整理本周 DevOps 和基礎設施相關的重要動態：

我的部署環境：
- Vercel (前端)
- Docker + 可能未來用 K8s
- GitHub Actions (CI/CD)
- PostgreSQL
- 考慮中：Railway / Fly.io / Coolify

## 平台更新
列出 Vercel、GitHub Actions、Docker 等的重要更新

## 安全公告
容器、CI/CD、雲端平台的安全更新

## 成本優化機會
新的免費方案、降價、或更便宜的替代方案

## 值得關注的新工具
本周來源中出現的、適合獨立開發者的新 DevOps 工具

重點放在「solo developer / small team」適用的資訊，企業級的可以略過。
```

### Prompt 3-B：部署策略評估

```
根據來源，幫我評估我的 8 個專案的最佳部署策略：

專案清單：
- CardSense API (Spring Boot + PostgreSQL) — 需要高可用
- Review Trust Analyzer (FastAPI + ML model) — 需要 GPU 偶爾
- SEEDCRAFT (Next.js + LINE webhook) — 台灣用戶為主
- OpenClaw (n8n + Discord bot) — 長時間運行
- Japan Trip OS (Next.js) — 靜態為主
- Smart Menu Decision (待定)
- TechTrend Briefing (Next.js + 排程任務)
- MLA Exam Booster (已完成)

針對每個專案建議：
1. 最適合的部署平台
2. 預估月成本（免費方案能撐多久）
3. 從 MVP 到 SaaS 的升級路徑

用表格呈現。
```


## ═══════════════════════════════════════
## 📘 NB4：商業化 & 產品 — 周報 Prompt
## ═══════════════════════════════════════

### Prompt 4-A：商業化趨勢摘要

```
根據來源，整理本周與 SaaS 商業化相關的重要資訊：

我的情境：
- 台灣開發者，專案目標用戶有台灣市場也有國際市場
- 8 個 side project，CardSense 商業化優先級最高
- Bootstrap 路線（不融資）
- 一人開發，需要最小化營運成本

## 市場動態
本周 SaaS / Micro-SaaS 市場的重要趨勢

## 定價策略洞察
來源中提到的定價策略建議或案例

## 台灣市場
台灣金流、LINE 平台、本地市場的任何更新

## 獨立開發者成功案例
本周來源中值得學習的 indie hacker 故事或策略

## 我的行動項目
基於以上資訊，建議我本周應該做的 1-3 件事
```

### Prompt 4-B：CardSense 商業化深度分析

```
CardSense 是我最高優先級的商業化專案：
- 確定性信用卡推薦 API
- 3-repo 架構（contracts / extractor / api）
- 規則式邏輯，刻意不用 LLM
- 目標：台灣信用卡比較市場

根據來源，幫我分析：

1. 台灣信用卡比較市場現況（Money101、卡優等競品動態）
2. API-first B2B SaaS 在台灣的商業模式建議
3. 金流整合方案比較（Stripe TW vs 綠界 vs 藍新）— 哪個最適合 SaaS 訂閱？
4. 定價策略建議（Freemium vs 直接付費 vs API call 計價）
5. 法規注意事項（金融資訊提供是否需要特殊許可？）

每點給結論和理由，標注需要進一步研究的項目。
```

### Prompt 4-C：LINE 生態 & SEEDCRAFT 市場分析

```
SEEDCRAFT 是我的家庭教育專案，LINE-first MVP 瞄準台灣家庭：

根據來源，分析：

1. LINE Messaging API 最新功能更新 — 有什麼新功能可以用？
2. LIFF 最新開發限制與最佳實踐
3. LINE 在台灣的開發者生態現況
4. 台灣家庭教育市場的數位化程度
5. LINE Bot 變現模式（訂閱、內購、廣告）的可行性比較

重點放在「可以直接實作」的具體建議。
```


## ═══════════════════════════════════════
## 📆 月度彙總 Prompt（每月底使用）
## ═══════════════════════════════════════

### Prompt M-1：月度總結

```
請根據所有來源，生成本月的技術與商業趨勢總結：

## 本月 Top 5 趨勢
影響最大的 5 個趨勢，每個用 1 句話概括

## 模型格局變化
本月 AI 模型市場的權力移動（誰上升、誰下降）

## 對我的專案的累積影響
回顧本月動態，哪些專案應該加速、哪些應該暫停、哪些需要轉向

## 下月預測
根據本月趨勢，下月最可能發生什麼

## 本月我應該已完成但可能遺漏的事
根據本月資訊，提醒我是否有該做但可能忘記的行動
```


## ═══════════════════════════════════════
## 🎙️ Audio Overview Prompt
## ═══════════════════════════════════════

### 生成 Podcast 式摘要時的自訂指令

```
Generate a weekly tech briefing podcast for a solo developer
based in Taiwan who runs 8 side projects simultaneously.
Focus on: AI model updates, pricing changes, new dev tools,
Taiwan market dynamics, and SaaS commercialization strategies.
Keep it practical — skip hype, focus on "what should I do this week."
Duration: aim for 10-15 minutes of content.
Language: Use Traditional Chinese for Taiwan-specific content,
English for technical terms.
```


## ═══════════════════════════════════════
## 💡 進階技巧
## ═══════════════════════════════════════
##
## 1. 每周新增 2-3 篇「本周熱門文章」作為來源
##    → 確保 NotebookLM 有最新素材可用
##
## 2. 把上周的簡報輸出存成筆記
##    → 下周可以問「跟上周比有什麼變化」
##
## 3. 用 Audio Overview 生成通勤聽的摘要
##    → 貼上面的 Audio prompt 作為自訂指令
##
## 4. 跨 Notebook 手動整合
##    → 每月底把四本的月度總結複製到一份 Google Doc
##    → 這就是你的「月度技術雷達」
##
## 5. 配合你的 OpenClaw
##    → 設定 Discord cron 提醒每周一跑一次這個流程
##    → 把輸出自動貼到 Notion
