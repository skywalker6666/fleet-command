# FridgeManager（冰箱管理）— 專案規格書
### Version 1.0 | 2026-02-25

---

## 1. 專案概述

**一句話定位：** 家庭食材管理 + 到期提醒 + AI 食譜推薦，減少食物浪費、降低採購成本

### 1.1 問題

台灣家庭每年浪費大量食材，痛點集中在：
- **忘記冰箱有什麼**：買重複的食材、忘了快過期的東西
- **不知道能煮什麼**：有食材但缺靈感，最後叫外送
- **到期才發現**：蔬菜放到爛、肉過期才聞到，浪費金錢
- **採購沒計劃**：衝動購買，回家才發現跟冰箱裡的重複

### 1.2 解法

一個 PWA 應用，核心功能三件事：
- **食材清單管理**：掃條碼或手動輸入，記錄食材、數量、到期日
- **到期提醒**：提前 1-3 天推播通知，優先處理快過期食材
- **AI 食譜推薦**：根據「現有食材 + 快過期食材」推薦可以做的料理

### 1.3 核心設計原則

- **最少操作**：掃條碼 > 拍照辨識 > 手動輸入，三種輸入方式由快到慢
- **到期驅動**：所有 UI 以「幾天到期」排序，紅黃綠三色直覺提示
- **零浪費導向**：食譜推薦優先使用快過期食材，減少丟棄量
- **家庭共享**：同一冰箱多人可存取，媽媽記錄、爸爸查看

### 1.4 目標用戶

| 用戶類型 | Profile | 場景 |
|---------|---------|------|
| 主要 | 負責煮飯的家庭成員（30-50 歲） | 日常食材管理和烹飪決策 |
| 次要 | 外食為主但偶爾開伙 | 減少食材浪費 |
| 延伸 | 小家庭/獨居 | 精準購買、不囤過多 |

---

## 2. 商業模式

### 2.1 收入線

**Freemium App（B2C）：**
- Free：最多追蹤 30 項食材、基礎到期提醒、每日 3 次食譜推薦
- Pro $3.99/mo：無限食材追蹤、AI 食譜無限推薦、營養分析、採購清單自動生成、家庭共享（最多 4 人）

**聯盟行銷（B2B，Phase 3）：**
- 推薦食譜缺少的食材 → 導流到量販店/電商
- 與 CardSense 整合 → 推薦超市最高回饋的信用卡

### 2.2 Phase 2 目標

| 指標 | 目標 |
|------|------|
| 週活躍用戶 | 300 |
| Pro 訂閱者 | 30 (10% conversion) |
| 平均每用戶追蹤食材數 | 15 |
| MRR | $120 |

### 2.3 MVP 成本

< $10/mo（LLM via premium subscriptions + Supabase free tier + Vercel hobby）

### 2.4 里程碑

```
Phase 0 ✅ 概念定義、跨專案整合點確認
Phase 1 (Month 1-2)：MVP PWA、手動輸入 + 到期提醒、50 beta users
Phase 2 (Month 3-4)：條碼掃描 + AI 食譜、300 users
Phase 3 (Month 5-8)：家庭共享 + 採購清單 + CardSense 整合、$120 MRR
Phase 4 (Month 9+)：圖像辨識輸入、$300 MRR
```

---

## 3. 系統架構

### 3.1 系統元件

```
┌──────────────────────────────────────────────────────┐
│                FridgeManager System                     │
│                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │  PWA Frontend │  │  Food Item    │  │  Recipe    │  │
│  │  (Next.js)    │  │  Service      │  │  Engine    │  │
│  │               │  │               │  │            │  │
│  │  • 食材清單    │  │  • CRUD 管理  │  │  • LLM 推薦│  │
│  │  • 條碼掃描    │  │  • 到期計算   │  │  • 營養計算│  │
│  │  • 食譜瀏覽    │  │  • 分類管理   │  │  • 食材匹配│  │
│  │  • 推播通知    │  │  • 條碼查詢   │  │  • 缺料清單│  │
│  └──────────────┘  └───────────────┘  └────────────┘  │
│                                                        │
│  ┌──────────────┐  ┌───────────────┐                   │
│  │  Notification │  │  Integration  │                   │
│  │  Service      │  │  Layer        │                   │
│  │               │  │               │                   │
│  │  • 到期提醒    │  │  • 小決定 API │                   │
│  │  • 食譜建議    │  │  • CardSense  │                   │
│  │  • Web Push   │  │  • 條碼 DB    │                   │
│  └──────────────┘  └───────────────┘                   │
└──────────────────────────────────────────────────────┘
```

### 3.2 資料流

```
食材輸入（三種方式）：
  1. 條碼掃描 → 查 Open Food Facts API → 自動填入名稱/類別/保存期限
  2. 拍照辨識 → (Phase 4) 圖像辨識模型 → 自動辨識食材
  3. 手動輸入 → 名稱 + 類別 + 到期日

食材進入系統後：
  → 計算到期天數 → 排序展示（紅<3天、黃3-7天、綠>7天）
    → 到期提醒 cron：每日 08:00 檢查 → Web Push 通知
      → 食譜推薦：LLM 根據現有食材（優先快過期）推薦食譜
        → 缺料清單：推薦食譜需要但冰箱沒有的 → 採購清單
          → (Phase 3) CardSense 推薦超市最優卡
```

### 3.3 技術棧

| 層 | 選擇 |
|----|------|
| 前端 | Next.js (App Router) + PWA + Web Push API |
| UI | shadcn/ui + Tailwind |
| 條碼 | quagga2 (browser-based barcode scanner) |
| API | Next.js API Routes |
| 資料庫 | PostgreSQL (Supabase) |
| LLM | GPT-5.3 (食譜推薦) + 圖像辨識模型 (Phase 4, 待選) |
| 外部 API | Open Food Facts (條碼查詢, 免費) |
| 推播 | Web Push API + service worker |
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
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_time TIME DEFAULT '08:00',  -- 每日提醒時間
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 家庭群組
households (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,           -- "我們家的冰箱"
  owner_id INTEGER REFERENCES users(id),
  invite_code VARCHAR UNIQUE,      -- 6 碼邀請碼
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 家庭成員
household_members (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
)

-- 食材項目（核心表）
food_items (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL CHECK (category IN (
    'vegetable', 'fruit', 'meat', 'seafood', 'dairy',
    'egg', 'grain', 'condiment', 'beverage', 'frozen', 'other'
  )),
  quantity DECIMAL(8,2),
  unit VARCHAR,                    -- "g", "ml", "個", "包", "瓶"
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  barcode VARCHAR,
  storage_location VARCHAR DEFAULT 'fridge' CHECK (storage_location IN ('fridge', 'freezer', 'pantry')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'discarded')),
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 食譜推薦紀錄
recipe_recommendations (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  used_items JSONB NOT NULL,       -- [{"item_id": 1, "name": "雞胸肉"}, ...]
  recipe_name VARCHAR NOT NULL,
  recipe_content TEXT NOT NULL,    -- markdown format
  missing_items JSONB DEFAULT '[]', -- 缺少的食材
  was_cooked BOOLEAN DEFAULT FALSE,
  feedback_rating SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 採購清單
shopping_lists (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  items JSONB NOT NULL,            -- [{"name": "洋蔥", "quantity": 2, "unit": "個"}]
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  best_card JSONB,                 -- Phase 3: CardSense recommendation
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.2 到期計算邏輯

```python
from datetime import date, timedelta

def get_expiry_status(expiry_date: date) -> dict:
    days_left = (expiry_date - date.today()).days
    
    if days_left < 0:
        return {"status": "expired", "color": "black", "label": f"已過期 {abs(days_left)} 天"}
    elif days_left <= 2:
        return {"status": "critical", "color": "red", "label": f"剩 {days_left} 天"}
    elif days_left <= 7:
        return {"status": "warning", "color": "yellow", "label": f"剩 {days_left} 天"}
    else:
        return {"status": "safe", "color": "green", "label": f"剩 {days_left} 天"}

def get_default_expiry(category: str) -> int:
    """回傳預設保存天數"""
    defaults = {
        "vegetable": 7, "fruit": 5, "meat": 3, "seafood": 2,
        "dairy": 14, "egg": 21, "grain": 180, "condiment": 365,
        "beverage": 30, "frozen": 90, "other": 14
    }
    return defaults.get(category, 14)
```

### 4.3 API Contracts

```python
class FoodItemCreate(BaseModel):
    name: str
    category: str
    quantity: float | None = None
    unit: str | None = None
    expiry_date: date | None = None  # None → auto-calculate from category
    barcode: str | None = None
    storage_location: str = "fridge"

class FoodItemResponse(BaseModel):
    id: int
    name: str
    category: str
    quantity: float | None
    unit: str | None
    expiry_date: date
    days_left: int
    expiry_status: str             # "expired", "critical", "warning", "safe"
    storage_location: str

class RecipeRequest(BaseModel):
    household_id: int
    prioritize_expiring: bool = True  # 預設優先使用快過期食材
    servings: int = 2
    cuisine: str | None = None        # "台式", "日式", "西式"

class RecipeResponse(BaseModel):
    recipe_name: str
    ingredients_used: list[str]       # 從冰箱使用的食材
    missing_ingredients: list[str]    # 需要額外購買的
    instructions: str                 # markdown
    estimated_time: int               # 分鐘
    difficulty: str                   # "easy", "medium", "hard"

class ShoppingListResponse(BaseModel):
    items: list[dict]                 # [{"name", "quantity", "unit"}]
    estimated_total: int | None       # TWD
    best_card: dict | None            # Phase 3: CardSense
```

---

## 5. LLM 策略

### 5.1 使用邊界

| 允許 | 禁止 |
|------|------|
| ✅ 食譜推薦（根據現有食材） | ❌ 食品安全判斷（「過期 3 天的牛奶能不能喝」） |
| ✅ 食材辨識輔助（Phase 4, 圖像→名稱） | ❌ 營養/醫療建議（過敏、疾病飲食） |
| ✅ 採購清單優化建議 | ❌ 取代條碼查詢（用 Open Food Facts） |

### 5.2 模型選擇

| 角色 | 模型 | 成本 |
|------|------|------|
| 食譜推薦 | GPT-5.3 (via OpenClaw) | via premium subscription |
| 食材辨識 (Phase 4) | 待選 — Google Vision / local model | 待評估 |
| 條碼未命中時的名稱建議 | Gemini Flash | Free tier |

### 5.3 食譜推薦 Prompt Template

```
You are a home cooking assistant for a Taiwan family.
Respond in Traditional Chinese.

Available ingredients (sorted by expiry, soonest first):
{available_items}

Constraints:
- Servings: {servings}
- Cuisine preference: {cuisine or "any"}
- Must use at least one item expiring within 3 days (marked 🔴)
- Keep it simple: max 30 minutes, common equipment

Output JSON:
{
  "recipe_name": "...",
  "ingredients_used": ["item1", "item2"],
  "missing_ingredients": ["item3"],  // things not in fridge
  "instructions": "Step 1: ...\nStep 2: ...",
  "estimated_time": 25,
  "difficulty": "easy"
}
```

### 5.4 成本控制

```
食譜推薦平均 ~400 tokens out
透過 GPT Plus subscription 呼叫，無額外 API 費用
條碼查詢走 Open Food Facts (免費 API)
食材辨識 Phase 4 才需要，成本到時評估
Goal: $0 additional LLM cost on MVP
```

---

## 6. OpenClaw Agent 設計

### 6.1 FridgeManager Agent（1 個，Phase 2 啟用）

```
ExpiryAlert Agent
  ├── 觸發：每日 cron 08:00（台灣時間）
  ├── 功能：
  │   ├── 掃描所有 household 的 food_items
  │   ├── 找出 expiry_date <= today + 3 days 的項目
  │   ├── 為有快過期食材的家庭生成食譜建議
  │   └── 發送 Web Push 通知
  ├── 輸出：
  │   ├── Push notification: "🔴 3 項食材即將到期！點擊查看食譜建議"
  │   └── Discord #fridge-alerts（開發監控）
  └── 依賴：PostgreSQL + LLM (recipe) + Web Push API
```

### 6.2 自動化流程

```
ExpiryAlert 每日流程：
  1. 查詢所有 notification_enabled = true 的用戶
  2. 掃描各家庭 food_items WHERE expiry_date <= NOW() + INTERVAL '3 days'
  3. 分群：expired（已過期）/ critical（1-2天）/ warning（3天）
  4. 已過期 → 自動標記 status = 'expired'
  5. critical + warning → 生成食譜建議（LLM）
  6. 推送通知（Web Push）附食譜摘要
  7. 紀錄推送結果到 DB
```

---

## 7. TechTrend 整合

TechTrend 是獨立的 B2B 技術週刊產品。冰箱管理可從其內容生產過程中獲取的附帶情報：

| NB 來源 | 冰箱管理追蹤項 | 影響 |
|---------|--------------|------|
| NB1 AI 模型 | 食材辨識模型（Google Vision 等）、食譜 AI | Phase 4 圖像辨識功能 |
| NB2 框架 | Next.js PWA 更新、Web Push API 規範 | 推播穩定性和離線能力 |
| NB3 DevOps | Vercel Edge Functions | 推播延遲和 cron 可靠性 |
| NB4 商業 | 訂閱模式案例、食品電商生態 | 定價和聯盟行銷策略 |

---

## 8. 跨專案整合點

| 專案 | 整合方式 | 階段 | 價值 |
|------|---------|------|------|
| 小決定 | 食材快過期 → 觸發「今天煮什麼」推薦 | Phase 2 | 🟡 中 |
| CardSense | 採購清單 → 推薦超市回饋最高的信用卡 | Phase 3 | 🟡 中 |
| RTA | 超市/量販店評論分析（間接，低優先） | Phase 4 | 🟢 低 |

### 整合觸發邏輯

```python
# 冰箱管理 → 小決定 整合
def check_expiring_trigger(household_id: int):
    expiring = get_items_expiring_within(household_id, days=2)
    if len(expiring) >= 3:
        # 觸發小決定的「今天煮什麼」場景
        smartchoice_api.trigger_recommendation(
            scenario="cook_at_home",
            available_ingredients=[item.name for item in expiring],
            household_id=household_id
        )

# 冰箱管理 → CardSense 整合
def generate_shopping_recommendation(shopping_list_id: int):
    items = get_shopping_list(shopping_list_id)
    estimated_total = estimate_cost(items)
    
    # CardSense 推薦最優超市卡
    card = cardsense_api.recommend(
        category="supermarket",
        amount=estimated_total
    )
    # → {"card_name": "聯邦賴點卡", "cashback": "5%", "amount_saved": 45}
    
    update_shopping_list(shopping_list_id, best_card=card)
```

---

## 9. 版權與法律風險

### 9.1 風險矩陣

**🟡 MEDIUM：食品安全資訊責任**
- Mitigation：不提供食品安全判斷（「過期能不能吃」由用戶自行決定）；到期日僅為提醒、非安全保證；免責聲明

**🟡 MEDIUM：Open Food Facts 資料準確度**
- Mitigation：條碼查詢結果允許用戶修改；標記「自動填入，請確認」；錯誤資料回報機制

**🟢 LOW：食譜推薦準確度**
- Mitigation：LLM 食譜標記「AI 生成」；允許回報不佳食譜；不涉及過敏或特殊飲食建議

**🟢 LOW：用戶資料隱私**
- Mitigation：食材資料不含敏感個人資訊；家庭共享需邀請碼；可刪除所有資料

### 9.2 必要免責聲明

```
冰箱管理提供食材追蹤和 AI 食譜建議，僅供參考。
食材到期日為預估值，實際保存狀態請自行判斷。
如有食物過敏或特殊飲食需求，請諮詢專業營養師。
```

### 9.3 合規 TODO

- [ ] Open Food Facts API 使用條款確認
- [ ] 食品安全免責聲明法律審查
- [ ] 用戶資料刪除工作流
- [ ] 過敏警示功能（Phase 3 — 標記用戶過敏原、食譜自動排除）

---

## 10. 成功標準與退出條件

| 階段 | 成功標準 | 退出條件 |
|------|---------|---------|
| Phase 1 | 50 beta users, 平均追蹤 10+ 項食材 | 2 個月，< 10 weekly active |
| Phase 2 | 300 weekly active, 30 Pro subscribers | 4 個月，< 5% conversion |
| Phase 3 | $120 MRR, 家庭共享 50+ households | 6 個月，< $50 MRR |
| Phase 4 | $300 MRR, 圖像辨識 MVP | 連續 3 個月下滑 |

**每週時間投入：** 2-3 hr/week（規劃中），進入開發後提升到 4-6 hr/week

---

## 11. 下一步行動（Sprint 1）

**Sprint 1 目標：** Working PWA + 手動食材管理 + 到期提醒

### Week 1-2：基礎建設
- Next.js project scaffold + PWA manifest + service worker
- Supabase DB schema 建立
- 用戶註冊/登入 + 家庭群組建立
- 食材 CRUD UI（手動輸入表單）

### Week 3-4：核心功能
- 食材清單頁面（到期排序、紅黃綠標記）
- 到期提醒 cron job（每日 08:00）
- Web Push notification 實作
- 食材類別預設到期天數

### Week 5-6：AI 食譜 + Beta
- LLM 食譜推薦 API：`POST /api/recipe`
- 食譜展示 UI（食材匹配高亮 + 缺料提示）
- 條碼掃描整合（quagga2 + Open Food Facts）
- 10 位 beta users 測試

### Sprint 1 交付物

```
✅ PWA with food item CRUD
✅ Expiry tracking with color-coded alerts
✅ Daily push notification for expiring items
✅ AI recipe recommendation (prioritizing expiring items)
✅ Barcode scanning (basic)
✅ 10 beta users providing feedback
```

---

*Owner: Alan | Created: 2026-02-25 | Status: 概念完成，待進入 Sprint 1*
