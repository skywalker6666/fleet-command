# SmartChoice（小決定）— 專案規格書
### Version 1.0 | 2026-02-25

---

## 1. 專案概述

**一句話定位：** 日常選擇困難的 AI 決策輔助工具，根據用戶偏好、情境和歷史選擇，快速給出個人化推薦

### 1.1 問題

台灣消費者每天面臨大量小決策，卻缺乏快速決策工具：
- **選擇麻痺**：「今晚吃什麼」「週末去哪」「看什麼電影」，每次都猶豫不決
- **資訊碎片化**：Google Maps、IG、PTT、朋友推薦分散在各處，無法快速彙整
- **沒有記憶**：每次推薦都要重新描述偏好，沒有累積的個人化
- **決策疲勞**：選項越多越累，最後隨便選或不選

### 1.2 解法

一個輕量的 Web App（PWA），用戶描述當下需求，系統結合：
- **個人偏好檔案**（喜好、禁忌、過往選擇）
- **情境感知**（時間、天氣、位置、同行人數）
- **外部資料**（Google Maps 評分、RTA 信任度、CardSense 最優付款）

快速產出 2-3 個推薦選項，附帶理由，並學習用戶最終選擇以持續優化。

### 1.3 核心設計原則

- **3 秒出結果**：不要讓用戶等。LLM 推薦 + 預快取 = 即時體驗
- **最多 3 個選項**：選擇悖論 — 越少選項越容易決策
- **可解釋推薦**：每個推薦附帶「為什麼推薦這個」的一句話理由
- **學習閉環**：用戶選了什麼 → 回饋到偏好模型

### 1.4 目標用戶

| 用戶類型 | Profile | 場景 |
|---------|---------|------|
| 主要 | 25-40 歲上班族 | 午餐選擇、下班後活動、週末規劃 |
| 次要 | 情侶/朋友聚會 | 聚餐地點、活動推薦 |
| 延伸 | 家庭 | 親子餐廳、周末行程（與 SEEDCRAFT 整合） |

---

## 2. 商業模式

### 2.1 收入線

**Freemium App（B2C）：**
- Free：每日 5 次推薦、基礎偏好設定
- Pro $3.99/mo：無限推薦、進階情境感知（天氣/位置整合）、選擇歷史分析、群組決策

**聯盟行銷（B2B，Phase 3）：**
- 推薦餐廳/活動時嵌入合作商家，依轉換計費
- 與 CardSense 聯合推薦（推薦餐廳 + 最優付款卡）

### 2.2 Phase 2 目標

| 指標 | 目標 |
|------|------|
| 週活躍用戶 | 500 |
| Pro 訂閱者 | 50 (10% conversion) |
| 每日推薦請求 | 1,000 |
| MRR | $200 |

### 2.3 MVP 成本

< $15/mo（LLM via premium subscriptions + Supabase free tier + Vercel hobby）

### 2.4 里程碑

```
Phase 0 ✅ 概念定義、跨專案整合點確認
Phase 1 (Month 1-2)：MVP PWA、「今天吃什麼」單一場景、100 beta users
Phase 2 (Month 3-4)：多場景擴展、CardSense 整合、500 users
Phase 3 (Month 5-8)：RTA 整合、聯盟行銷、$200 MRR
Phase 4 (Month 9+)：群組決策、$500 MRR
```

---

## 3. 系統架構

### 3.1 系統元件

```
┌──────────────────────────────────────────────────────┐
│                SmartChoice System                      │
│                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │  PWA Frontend │  │  Recommend    │  │  Context   │  │
│  │  (Next.js)    │  │  Engine       │  │  Collector │  │
│  │               │  │               │  │            │  │
│  │  • 快速輸入    │  │  • LLM 推薦   │  │  • 天氣API │  │
│  │  • 結果展示    │  │  • 偏好匹配   │  │  • 位置    │  │
│  │  • 回饋收集    │  │  • 排序過濾   │  │  • 時間    │  │
│  └──────────────┘  └───────────────┘  └────────────┘  │
│                                                        │
│  ┌──────────────┐  ┌───────────────┐                   │
│  │  User Profile │  │  Integration  │                   │
│  │  Service      │  │  Layer        │                   │
│  │               │  │               │                   │
│  │  • 偏好管理    │  │  • RTA API    │                   │
│  │  • 歷史紀錄    │  │  • CardSense  │                   │
│  │  • 學習模型    │  │  • Google Maps│                   │
│  └──────────────┘  └───────────────┘                   │
└──────────────────────────────────────────────────────┘
```

### 3.2 推薦流程

```
用戶輸入：「兩個人晚餐，想吃日式，預算 $800 以內」
  → Context Collector：時間 19:00、天氣晴、位置信義區
    → User Profile：偏好辣味、不吃生魚片、上次選了拉麵
      → Recommend Engine (LLM)：
          結合 context + profile + Google Maps data
          產出 3 個推薦 + 理由
        → (Phase 2) RTA 驗證：每家店評論信任度
        → (Phase 2) CardSense 附加：最適合的信用卡
          → 展示結果 → 用戶選擇 → 回饋到 profile
```

### 3.3 技術棧

| 層 | 選擇 |
|----|------|
| 前端 | Next.js (App Router) + PWA manifest |
| UI | shadcn/ui + Tailwind |
| API | Next.js API Routes (輕量) |
| 資料庫 | PostgreSQL (Supabase) |
| LLM | Claude Sonnet (推薦品質) 或 GPT-5.3 (via OpenClaw) |
| 外部 API | Google Maps Places API、OpenWeatherMap |
| 部署 | Vercel |

---

## 4. 資料模型

### 4.1 核心表（6 張）

```sql
-- 用戶
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  display_name VARCHAR,
  subscription_tier VARCHAR DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO')),
  location_default JSONB,         -- {"lat": 25.03, "lng": 121.56, "label": "信義區"}
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 偏好設定
preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category VARCHAR NOT NULL,       -- 'food', 'activity', 'movie', 'shopping'
  likes JSONB DEFAULT '[]',        -- ["日式", "義式", "辣"]
  dislikes JSONB DEFAULT '[]',     -- ["生魚片", "香菜"]
  budget_range JSONB,              -- {"min": 200, "max": 800, "currency": "TWD"}
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- 推薦紀錄
recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query_text TEXT NOT NULL,        -- 用戶原始輸入
  context JSONB NOT NULL,          -- {"time", "weather", "location", "companions"}
  options JSONB NOT NULL,          -- [{"name", "reason", "score", "place_id"}]
  chosen_option INTEGER,           -- 用戶最終選了哪個（0-indexed）
  feedback_rating SMALLINT,        -- 1-5 事後滿意度
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 場景模板
scenario_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,           -- "今天吃什麼", "週末去哪", "看什麼電影"
  category VARCHAR NOT NULL,
  prompt_template TEXT NOT NULL,   -- LLM prompt 模板
  required_context JSONB,          -- ["location", "budget", "companions"]
  active BOOLEAN DEFAULT TRUE
)

-- 群組決策（Phase 3）
group_sessions (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id),
  scenario VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'voting' CHECK (status IN ('voting', 'decided', 'expired')),
  options JSONB NOT NULL,
  votes JSONB DEFAULT '{}',        -- {"user_id": option_index}
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 外部資料快取
place_cache (
  id SERIAL PRIMARY KEY,
  google_place_id VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  category VARCHAR,
  rating DECIMAL(2,1),
  price_level SMALLINT,
  address TEXT,
  photos JSONB DEFAULT '[]',
  rta_trust_score SMALLINT,        -- Phase 2: from RTA API
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ           -- 24hr TTL
)
```

### 4.2 推薦引擎邏輯

```python
def generate_recommendation(user_id: int, query: str, context: dict) -> list[Option]:
    # 1. 收集 context
    enriched_context = {
        "time": context.get("time", now()),
        "weather": fetch_weather(context["location"]),
        "location": context["location"],
        "companions": context.get("companions", 1),
    }
    
    # 2. 讀取 user profile
    profile = get_user_preferences(user_id, category=detect_category(query))
    history = get_recent_choices(user_id, limit=10)
    
    # 3. LLM 推薦
    options = llm_recommend(
        query=query,
        context=enriched_context,
        profile=profile,
        history=history,
        max_options=3
    )
    
    # 4. (Phase 2) 外部驗證
    for option in options:
        if option.place_id:
            option.rta_score = rta_api.get_trust_score(option.place_id)
            option.best_card = cardsense_api.recommend_card(
                category=option.category,
                amount=option.estimated_price
            )
    
    # 5. 排序：relevance * trust * user_preference
    return sorted(options, key=lambda o: o.composite_score, reverse=True)[:3]
```

### 4.3 API Contracts

```python
class RecommendRequest(BaseModel):
    query: str                     # "兩個人晚餐，日式，$800 以內"
    location: dict | None = None   # {"lat": 25.03, "lng": 121.56}
    companions: int = 1
    scenario: str | None = None    # "food", "activity", "movie"

class RecommendResponse(BaseModel):
    options: list[Option]          # max 3
    context_used: dict             # what context was considered
    query_id: str                  # for feedback tracking

class Option(BaseModel):
    name: str
    reason: str                    # 一句話推薦理由
    category: str
    estimated_price: int | None
    google_maps_url: str | None
    rating: float | None
    rta_trust_score: int | None    # Phase 2
    best_card: str | None          # Phase 2: CardSense recommendation

class FeedbackRequest(BaseModel):
    query_id: str
    chosen_index: int              # 0, 1, or 2
    satisfaction: int | None       # 1-5, optional post-choice
```

---

## 5. LLM 策略

### 5.1 使用邊界

| 允許 | 禁止 |
|------|------|
| ✅ 即時推薦生成（核心功能） | ❌ 生成虛假餐廳/活動資訊 |
| ✅ 自然語言 query 解析 | ❌ 取代 Google Maps 真實資料 |
| ✅ 個人化推薦理由生成 | ❌ 操縱推薦結果（付費排序偽裝自然） |
| ✅ 情境分析（parse companions, budget etc） | |

### 5.2 模型選擇

| 角色 | 模型 | 成本 |
|------|------|------|
| 推薦生成 | Claude Sonnet 4.5 或 GPT-5.3 | via premium subscription |
| Query 解析 | Gemini Flash | Free tier |
| 意圖分類 | Gemini Flash | Free tier |

### 5.3 Prompt Template

```
You are a personal decision assistant for a Taiwan user.

User profile:
- Likes: {likes}
- Dislikes: {dislikes}
- Budget: {budget_range} TWD
- Recent choices: {history}

Current context:
- Time: {time} ({day_of_week})
- Weather: {weather}
- Location: {location}
- Companions: {companions} people

Query: "{query}"

Instructions:
1. Suggest exactly 3 options
2. Each option must include: name, one-sentence reason (in Traditional Chinese), 
   estimated price, and category
3. Diversify options (don't suggest 3 ramen places)
4. Consider user's history (avoid recently chosen places)
5. Factor in time (lunch vs dinner vs late night)
6. Factor in weather (rainy → indoor, hot → AC)

Output JSON array of 3 options.
```

### 5.4 成本控制

```
推薦請求平均 ~300 tokens out
透過 premium subscription 呼叫，無額外 API 費用
Query 解析 + 意圖分類走 Gemini Flash free tier
Goal: $0 additional LLM cost on MVP
```

---

## 6. OpenClaw Agent 設計

### 6.1 SmartChoice Agent（1 個，Phase 2 啟用）

```
ContextGatherer Agent
  ├── 觸發：用戶發出推薦請求時
  ├── 功能：
  │   ├── 平行呼叫天氣 API + Google Maps nearby search
  │   ├── 查詢 place_cache，過期的重新抓取
  │   └── (Phase 2) 呼叫 RTA API 批次查詢信任度
  ├── 輸出：enriched context object
  └── 依賴：OpenWeatherMap API + Google Maps Places API + RTA API
```

### 6.2 自動化流程

```
Place Cache 維護（每日 cron）：
  1. 掃描 place_cache 中 expires_at 已過期的記錄
  2. 批次呼叫 Google Maps API 更新（respect rate limit）
  3. 如有 RTA 整合 → 同步更新 rta_trust_score
  4. 清除 30 天內無人查詢的快取記錄
```

---

## 7. TechTrend 整合

TechTrend 是獨立的 B2B 技術週刊產品。小決定可從其內容生產過程中獲取的附帶情報：

| NB 來源 | 小決定追蹤項 | 影響 |
|---------|------------|------|
| NB1 AI 模型 | 推薦系統相關 AI 工具 | 推薦品質提升 |
| NB2 框架 | Next.js 更新、PWA 規範變動 | 前端穩定性和離線能力 |
| NB3 DevOps | Vercel Edge Functions、CDN 效能 | 推薦延遲優化 |
| NB4 商業 | App 變現模式案例、聯盟行銷趨勢 | 定價和合作策略 |

---

## 8. 跨專案整合點

| 專案 | 整合方式 | 階段 | 價值 |
|------|---------|------|------|
| CardSense | 推薦餐廳/活動 → 附帶最優付款卡建議 | Phase 2 | 🔴 高 |
| RTA | 推薦地點 → 驗證其 Google 評論信任度 | Phase 2 | 🔴 高 |
| 冰箱管理 | 食材快過期 → 觸發「今天吃什麼」推薦 | Phase 2 | 🟡 中 |
| SEEDCRAFT | 家庭場景推薦（親子餐廳、兒童活動） | Phase 3 | 🟢 低 |

### 整合 API 串接規格（Phase 2）

```python
# CardSense 整合
cardsense_response = cardsense_api.recommend(
    category="dining",           # 消費場景
    amount=800,                  # 預估金額
    merchant_type="japanese"     # 商家類型
)
# → {"card_name": "國泰 CUBE", "cashback": "3%", "amount_saved": 24}

# RTA 整合
rta_response = rta_api.analyze(
    place_id="ChIJ..."          # Google Place ID
)
# → {"trust_score": 82, "flagged_count": 3, "total_reviews": 156}
```

---

## 9. 版權與法律風險

### 9.1 風險矩陣

**🟡 MEDIUM：Google Maps 資料使用**
- Mitigation：使用官方 Places API（付費）；遵守 API ToS；快取策略減少 call 量；不商業轉售原始資料

**🟡 MEDIUM：推薦結果責任**
- Mitigation：免責聲明「推薦僅供參考，不保證餐廳品質」；展示推薦理由（可解釋性）；允許回報不佳推薦

**🟡 MEDIUM：聯盟行銷揭露（Phase 3）**
- Mitigation：付費合作商家標記「合作推薦」；自然推薦和付費推薦視覺區隔；遵守台灣公平交易法

**🟢 LOW：用戶資料隱私**
- Mitigation：位置資訊僅於請求時使用、不持續追蹤；偏好資料可刪除；不跨平台追蹤

### 9.2 必要免責聲明

```
小決定提供 AI 輔助的個人化推薦，僅供參考。
推薦結果基於公開資訊和您的偏好設定，不保證商家服務品質。
做決策前，建議自行確認餐廳營業狀態和評論。
```

### 9.3 合規 TODO

- [ ] Google Maps Platform API 方案選擇和合規確認
- [ ] 聯盟行銷揭露標準制定
- [ ] 用戶資料刪除工作流
- [ ] 「回報不佳推薦」功能

---

## 10. 成功標準與退出條件

| 階段 | 成功標準 | 退出條件 |
|------|---------|---------|
| Phase 1 | 100 beta users, <3s 推薦延遲 | 2 個月，< 20 weekly active |
| Phase 2 | 500 weekly active, 50 Pro subscribers | 4 個月，< 5% conversion |
| Phase 3 | $200 MRR, 1 聯盟行銷合作 | 6 個月，< $50 MRR |
| Phase 4 | $500 MRR, 群組決策功能 | 連續 3 個月下滑 |

**每週時間投入：** 2-3 hr/week（規劃中），進入開發後提升到 4-6 hr/week

---

## 11. 下一步行動（Sprint 1）

**Sprint 1 目標：** Working PWA + 「今天吃什麼」單一場景

### Week 1-2：基礎建設
- Next.js project scaffold + PWA manifest
- Supabase DB schema 建立
- 用戶註冊/登入（email-based, simple JWT）
- 偏好設定頁面（food likes/dislikes/budget）

### Week 3-4：推薦引擎
- LLM 推薦 API endpoint：`POST /api/recommend`
- Google Maps Places API 整合（nearby search + place details）
- 推薦結果展示 UI（3 cards with reason）
- 用戶選擇回饋機制

### Week 5-6：Beta 測試
- PWA install 優化（home screen 引導）
- 10 位 beta users 測試 + 收集回饋
- 推薦品質調優（prompt iteration）
- 位置和天氣 context 整合

### Sprint 1 交付物

```
✅ PWA app with install prompt
✅ "今天吃什麼" recommendation working (<3s)
✅ User preference setup
✅ Choice feedback loop
✅ 10 beta users providing feedback
```

---

*Owner: Alan | Created: 2026-02-25 | Status: 概念完成，待進入 Sprint 1*
