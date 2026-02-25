# Review Trust Analyzer (RTA) — 專案規格書
### Version 1.0 | 2026-02-25

---

## 1. 專案概述

**一句話定位：** Hybrid scoring system analyzing Google Maps review authenticity using rule-based logic + ML embeddings + optional LLM reasoning

### 1.1 問題

台灣消費者不信任線上評論，原因包括：
- 假評論（商家自刷好評、競爭對手灌負評）
- 激勵型五星評論（打卡送折扣）
- 現有平台（Google、Yelp）僅顯示原始平均分數，無信任度分析

消費者每天在 Google Maps 上做餐廳、旅館、服務選擇，卻沒有工具幫他們判斷「這些評論可以信嗎？」

### 1.2 解法

三層混合架構（Rule Engine → Embedding Similarity → LLM Reasoning），對每則評論產出 0-100 的信任度評分，附帶可解釋的標記理由。

**為什麼是混合架構而非純 LLM：**
- **成本控制**：Rule engine 處理 95% 的評論，LLM 只處理邊界案例
- **可解釋性**：規則輸出可直接告訴用戶「為什麼這則評論被標記」
- **確定性基線**：規則引擎結果穩定、可審計
- **LLM 只處理邊緣案例**：score 40-60 的模糊區間才觸發

### 1.3 目標用戶

| 用戶類型 | 場景 | 階段 |
|---------|------|------|
| B2C 消費者 | 餐廳/旅館決策前快速判斷評論真實度 | Phase 1 |
| B2B 商家 | 聲譽監控、競品分析、偵測惡意評論攻擊 | Phase 2 |
| B2B2C 評論平台 | 白標信任度評分 API 嵌入自家平台 | Phase 3 |

---

## 2. 商業模式

### 2.1 三條收入線

**Freemium 瀏覽器擴充功能（B2C 主力）：**
- Free：基礎信任度評分（每日 5 次查詢）
- Pro $4.99/mo：詳細評分拆解、異常評論警報、歷史趨勢

**商家儀表板（B2B）：**
- $49/mo：自家商家評論監控 + 競品分析 + 惡意評論偵測

**API 授權（B2B2C）：**
- 白標信任度評分引擎，供評論平台整合
- 依 API call 量計費

### 2.2 Phase 2 目標

| 指標 | 目標 |
|------|------|
| 瀏覽器擴充活躍用戶 | 1,000 |
| 商家監控付費客戶 | 50 |
| API 合作夥伴 | 1 |
| MRR | $500 |

### 2.3 MVP 成本

< $20/mo（Gemini Flash free tier + Supabase free tier + Vercel hobby）

### 2.4 里程碑

```
Phase 0 ✅ 混合評分演算法設計完成、API contracts 定義
Phase 1 (Month 1-2)：瀏覽器擴充 MVP、100 beta users
Phase 2 (Month 3-4)：商家儀表板、首批付費客戶
Phase 3 (Month 5-8)：API 產品、$500 MRR
Phase 4 (Month 9+)：$2K MRR、擴展到其他評論平台
```

---

## 3. 系統架構

### 3.1 三元件混合系統

```
┌─────────────────────────────────────────────────────┐
│                   RTA Pipeline                       │
│                                                      │
│  ┌──────────┐   ┌───────────────┐   ┌─────────────┐ │
│  │  Rule     │──▶│  Embedding    │──▶│  LLM        │ │
│  │  Engine   │   │  Similarity   │   │  Reasoning  │ │
│  │ (always)  │   │ (flagged)     │   │ (ambiguous) │ │
│  └──────────┘   └───────────────┘   └─────────────┘ │
│     100%             ~20%               ~5%          │
│                                                      │
│  Input: Scraped reviews + metadata                   │
│  Output: trust_score (0-100) + flags + reasoning     │
└─────────────────────────────────────────────────────┘
```

**Rule Engine（確定性，每則評論必跑）：**
- Pattern detection：評論長度極端值、關鍵字 spam、時間聚集
- Reviewer profile：帳號年齡、評論數量、照片有無、Local Guide 等級
- Linguistic signals：過多大寫、emoji 密度、促銷用語
- 輸出：0-100 基礎分數 + 標記的 patterns

**Embedding Similarity（ML，僅跑被標記的評論）：**
- Cohere Embed v4 或 Gemini embedding API
- 偵測語意相似度聚集（copy-paste 評論、範本濫用）
- Cosine similarity threshold > 0.85 = suspicious
- 輸出：cluster IDs + similarity scores

**LLM Reasoning（可選，僅跑模糊案例）：**
- Gemini Flash（free tier）以控制成本
- 觸發條件：rule score 40-60（模糊）AND 高 embedding similarity
- 輸出：adjusted score + 人類可讀的解釋

### 3.2 資料流

```
Scraping (Playwright)
  → Parsing (extract metadata + text + timestamps)
    → Scoring: Rule Engine (all) → Embedding (flagged) → LLM (ambiguous)
      → Storage: PostgreSQL (reviews, scores, explanations)
        → API: REST endpoint → trust_score + breakdown + reasoning
```

### 3.3 技術棧

| 層 | 選擇 |
|----|------|
| 語言 | Python 3.11 |
| 框架 | FastAPI + Pydantic |
| 資料庫 | PostgreSQL (Supabase) + pgvector |
| 爬蟲 | Playwright (headless browser) |
| LLM | Gemini Flash (AI Studio free tier) |
| Embedding | Cohere Embed v4（備用：Gemini embedding） |
| 瀏覽器擴充 | TypeScript + Plasmo framework |
| 部署 | Vercel (API + extension backend) |

---

## 4. 資料模型

### 4.1 核心表（5 張）

```sql
-- 商家資訊
places (
  id SERIAL PRIMARY KEY,
  google_place_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  category VARCHAR,
  address TEXT,
  avg_rating DECIMAL(2,1),
  total_reviews INTEGER,
  last_scraped TIMESTAMPTZ
)

-- 評論原始資料
reviews (
  id SERIAL PRIMARY KEY,
  place_id INTEGER REFERENCES places(id),
  google_review_id VARCHAR UNIQUE,
  reviewer_name VARCHAR,
  reviewer_id VARCHAR,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photos_count SMALLINT DEFAULT 0,
  review_date DATE,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
)

-- 評論者 profile
reviewer_profiles (
  id SERIAL PRIMARY KEY,
  google_reviewer_id VARCHAR UNIQUE,
  account_age_days INTEGER,
  total_reviews INTEGER,
  local_guide_level SMALLINT,
  has_profile_photo BOOLEAN
)

-- 信任度評分
trust_scores (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id),
  rule_score SMALLINT CHECK (rule_score BETWEEN 0 AND 100),
  embedding_score SMALLINT CHECK (embedding_score BETWEEN 0 AND 100),
  llm_score SMALLINT,
  final_score SMALLINT NOT NULL,
  flagged_patterns JSONB DEFAULT '[]',
  reasoning_text TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW()
)

-- Embedding 向量
embedding_vectors (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id),
  vector VECTOR(1024),  -- pgvector
  model_version VARCHAR NOT NULL
)
```

### 4.2 混合評分公式

```python
def calculate_final_score(rule_score, embedding_score, llm_score):
    # 明顯可信（rule > 70）：直接採用，跳過 ML/LLM
    if rule_score > 70:
        return rule_score
    
    # 明顯造假（rule < 40）：直接採用，跳過 LLM
    if rule_score < 40:
        return rule_score
    
    # 模糊區間（40-70）且 embedding similarity > 0.85：觸發 LLM
    if 40 <= rule_score <= 70 and embedding_score is not None:
        if llm_score is not None:
            return int(0.5 * rule_score + 0.3 * embedding_score + 0.2 * llm_score)
        return int(0.6 * rule_score + 0.4 * embedding_score)
    
    return rule_score
```

### 4.3 API Contracts

```python
# Request
class AnalyzeRequest(BaseModel):
    place_url: str
    force_refresh: bool = False

# Response
class AnalyzeResponse(BaseModel):
    place_name: str
    overall_trust_score: int  # 0-100
    total_reviews: int
    flagged_count: int
    breakdown: ScoreBreakdown
    top_suspicious_reviews: list[ReviewAnalysis]

class ScoreBreakdown(BaseModel):
    rule_based_avg: float
    embedding_based_avg: float | None
    llm_adjusted_count: int

class ReviewAnalysis(BaseModel):
    review_text: str
    reviewer_name: str
    rating: int
    trust_score: int
    flags: list[str]
    reasoning: str | None
```

---

## 5. LLM 策略

### 5.1 使用邊界

| 允許（離線/非同步） | 禁止 |
|-------------------|------|
| ✅ 模糊評論分析（rule score 40-60） | ❌ 對所有評論即時評分（成本爆炸） |
| ✅ 生成用戶可讀的解釋 | ❌ 取代 rule engine（失去可解釋性） |
| ✅ Training data annotation（LLM 建議標籤，人工審核） | ❌ 生成假評論範例（倫理風險） |

### 5.2 模型選擇

| 角色 | 模型 | 成本 |
|------|------|------|
| Primary | Gemini Flash (AI Studio free tier) | $0，15 RPM limit |
| Backup | Claude Haiku | Pay-per-use fallback |
| Future (Phase 3+) | Fine-tuned small model on annotated data | 訓練成本一次性 |

### 5.3 Prompt Template

```
You are a review authenticity analyzer. Analyze this Google Maps review:

Review: "{text}"
Rating: {rating}/5
Reviewer: {reviewer_name} (account age: {account_age} days, total reviews: {total_reviews})
Context: {place_category} in {location}

Rule-based signals detected: {flagged_patterns}
Embedding similarity: {similarity_score} (cluster size: {cluster_size})

Output JSON:
{
  "trust_score": 0-100,
  "reasoning": "2 sentence explanation focusing on specific red flags or authenticity signals"
}
```

### 5.4 成本控制

```
Free tier：1,500 requests/day (Gemini Flash)
觸發率：~5% of reviews (ambiguous cases only)
1,000 reviews/day → 50 LLM calls → 遠在 free tier 內
Fallback：if quota exceeded → return rule+embedding score only (graceful degradation)
```

---

## 6. OpenClaw Agent 設計

### 6.1 RTA Agents（2 個，Phase 3 啟用）

```
ReviewMonitor Agent
  ├── 觸發：每日 cron 或商家設定的監控排程
  ├── 功能：追蹤目標商家新評論、偵測異常波動
  ├── 輸出：Discord 通知 + Notion 更新
  └── 依賴：Playwright scraper + Rule Engine

ModelTrainer Agent
  ├── 觸發：annotated data 累積到閾值（每 500 則）
  ├── 功能：定期觸發 training pipeline、產出模型評估報告
  ├── 輸出：模型版本更新 + accuracy report
  └── 依賴：PostgreSQL training set + scikit-learn / PyTorch
```

### 6.2 自動化流程

```
ReviewMonitor 每日流程：
  1. 從 DB 讀取監控中的 place list
  2. Playwright 抓取各商家最新評論
  3. 新評論進入 scoring pipeline
  4. 異常偵測（單日大量新評論、平均分急跌/急升）
  5. 有異常 → Discord #rta-alerts 通知 + Notion 紀錄
```

---

## 7. TechTrend 整合

TechTrend 是獨立的 B2B 技術週刊產品。RTA 可從其內容生產過程中獲取的附帶情報：

| NB 來源 | RTA 追蹤項 | 影響 |
|---------|-----------|------|
| NB1 AI 模型 | Embedding 模型更新（Cohere v4、OpenAI v4） | 可能提升相似度偵測準確度 |
| NB2 框架 | FastAPI 版本 / scikit-learn 更新 | 安全性和效能影響 |
| NB3 DevOps | Modal GPU 定價、Vercel 功能變動 | 訓練成本和部署影響 |
| NB4 商業 | SaaS 定價案例、評論平台市場動態 | 定價策略和競品追蹤 |

---

## 8. 跨專案整合點

| 專案 | 整合方式 | 階段 | 價值 |
|------|---------|------|------|
| 小決定 | 用戶選定餐廳 → RTA 驗證其評論可信度 | Phase 2 | 🔴 高 |
| SEEDCRAFT | 教育場所（補習班/才藝班）評論分析 → 家長決策依據 | Phase 3 | 🟡 中 |
| CardSense | 信用卡優惠驗證（銀行評論信任度） | Phase 3 | 🟡 中 |
| 冰箱管理 | 超市/量販店評論分析（間接） | Phase 4 | 🟢 低 |

---

## 9. 版權與法律風險

### 9.1 風險矩陣

**🔴 HIGH：Scraping Google Maps ToS 合規**
- Mitigation：盡量使用 Google Places API 官方接口；scraping 僅用於 API 未提供的功能；遵守 rate limits；不商業轉售原始 Google 資料

**🟡 MEDIUM：誹謗風險（標記評論為「假的」）**
- Mitigation：使用中性用語（「低信任度評分」而非「假評論」）；展示方法論；允許商家申訴；免責聲明

**🟡 MEDIUM：PDPA 合規（儲存評論者資料）**
- Mitigation：僅儲存公開資料；報告中匿名化；允許資料刪除請求；不跨平台追蹤個別評論者

**🟢 LOW：LLM 輸出準確度**
- Mitigation：LLM 僅佔最終分數 20%；rule engine 提供基線；爭議案件可人工審核

### 9.2 必要免責聲明

```
RTA 提供基於公開評論資料的自動化信任度分析。
評分為機率性評估，非最終的詐騙認定。
做決策前，請務必自行閱讀評論。
```

### 9.3 合規 TODO

- [ ] 與律師審查 Google Maps ToS
- [ ] 實作 PDPA 資料刪除工作流
- [ ] 建立商家申訴流程
- [ ] 加入「回報評分錯誤」功能

---

## 10. 成功標準與退出條件

| 階段 | 成功標準 | 退出條件 |
|------|---------|---------|
| Phase 1 | 100 beta users, <500ms P95 latency | 2 個月，< 20 active users |
| Phase 2 | 1,000 users, 10 paying customers | 4 個月，0 paying customers |
| Phase 3 | $500 MRR, 1 API partner | 6 個月，< $100 MRR |
| Phase 4 | $2K MRR, expand to Yelp/TripAdvisor | 連續 3 個月下滑 |

**每週時間投入：** 6-8 hr/week（高優先級），下限 4 hr/week

---

## 11. 下一步行動（Sprint 1）

**Sprint 1 目標：** Working browser extension + hybrid scoring API

### Week 1-2：Rule Engine
- 實作 Rule Engine (Python)，含 10 個核心 pattern
- 用 100 則手動標記的評論測試
- 目標：> 80% accuracy on obvious fakes

### Week 3-4：API + LLM 整合
- 整合 Gemini Flash 處理模糊案例
- 建立 FastAPI endpoint：`POST /analyze {place_url}`
- 部署到 Vercel

### Week 5-6：Browser Extension
- 建立 Plasmo browser extension (content script + popup)
- 整合 API
- 10 位 beta users 測試

### Sprint 1 交付物

```
✅ Rule engine with 10 patterns (80%+ accuracy)
✅ Hybrid scoring API (<500ms P95)
✅ Browser extension MVP (Chrome)
✅ 10 beta users providing feedback
```

---

*Owner: Alan | Created: 2026-02-25 | Status: V1 完成，進入 Sprint 1*
