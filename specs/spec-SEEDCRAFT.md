# SEEDCRAFT — 專案規格書
### Version 1.0 | 2026-02-25

---

## 1. 專案概述

**一句話定位：** LINE-first family education coaching platform using Claude Sonnet for personalized guidance + Gemini Flash for content generation, targeting Taiwan parents of 3-12 year olds

### 1.1 問題

台灣家長面臨四個核心痛點：
- **資訊過載**：各種矛盾的育兒建議，不知道該聽誰的
- **缺乏個人化指導**：通用文章無法針對自己孩子的狀況
- **時間不足**：雙薪家庭沒時間參加實體工作坊
- **文化不匹配**：西方育兒內容不符合台灣家庭價值觀

### 1.2 解法

LINE chatbot + LIFF mini-app 提供：
- **每日微型教練**（3-5 分鐘）：針對孩子年齡和個性的個人化建議
- **台灣在地內容**：符合本地教育制度和文化價值觀
- **社群支持**：家長按孩子年齡/主題分組的交流空間

### 1.3 為什麼是 LINE-first

- 台灣智慧型手機滲透率 95%，LINE 是第一通訊工具
- 用戶不需要安裝新 App（零摩擦）
- Rich messaging（Flex Messages、LIFF mini-app）
- 內建支付（LINE Pay）

### 1.4 目標用戶

| 用戶類型 | Profile | 階段 |
|---------|---------|------|
| 主要 | 台灣母親 30-45 歲，孩子 3-12 歲 | Phase 1 |
| 次要 | 祖父母（協助照顧的角色） | Phase 2 |
| 未來 B2B | 幼兒園、補習班、才藝教室 | Phase 3 |

### 1.5 100% 原創 IP

所有品牌、角色、內容均為原創設計，無任何既有 IP 引用。SEEDCRAFT 品牌代表「播下種子、培養成長」的教育理念。

---

## 2. 商業模式

### 2.1 三條收入線

**Freemium 訂閱（B2C 主力）：**
- Free：基礎每日提示 + 限量提問（3 次/天）
- Premium $9.99/mo：個人化教練對話無限制 + 專家內容 + 詳細成長報告

**社群群組（B2C 加購）：**
- $4.99/mo per group：按孩子年齡/主題分組的 moderated 家長社群

**B2B 授權（Phase 3）：**
- 學校/補習班白標平台授權

### 2.2 Phase 2 目標

| 指標 | 目標 |
|------|------|
| LINE 好友數 | 500（organic growth） |
| Premium 訂閱者 | 50（10% conversion） |
| 活躍社群群組 | 3 |
| MRR | $600 |

### 2.3 MVP 成本

< $25/mo（Claude API ~$10 + Gemini Flash free tier + Supabase free tier + LINE Messaging API free tier）

### 2.4 里程碑

```
Phase 0 ✅ LINE bot registered, LIFF app scaffolded, content strategy defined
Phase 1 (Month 1-2)：MVP bot 上線、100 LINE friends、50 篇內容
Phase 2 (Month 3-4)：Premium subscription、500 friends、50 付費用戶
Phase 3 (Month 5-8)：社群群組、$600 MRR、B2B pilot
Phase 4 (Month 9+)：$2K MRR、擴展到香港/新加坡華人社群
```

---

## 3. 系統架構

### 3.1 三元件 LINE-native 系統

```
┌─────────────────────────────────────────────────────────┐
│                   SEEDCRAFT System                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  LINE Bot     │  │  LIFF App    │  │  Backend API  │  │
│  │  (Webhook)    │  │  (Mini-App)  │  │  (FastAPI)    │  │
│  │              │  │              │  │               │  │
│  │  • 接收訊息   │  │  • 個人設定   │  │  • LLM 編排   │  │
│  │  • 路由處理   │  │  • 內容瀏覽   │  │  • 用戶管理   │  │
│  │  • 發送回覆   │  │  • 訂閱管理   │  │  • 內容 CMS   │  │
│  │  • 訂閱檢查   │  │  • 社群入口   │  │  • LINE Pay   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  LLM Layer:                                              │
│    Claude Sonnet 4.5 ─── 教練對話（高品質、有溫度）       │
│    Gemini Flash ──────── 內容生成 + 摘要 + 意圖分類      │
└─────────────────────────────────────────────────────────┘
```

### 3.2 資料流

```
用戶在 LINE 發送訊息
  → LINE webhook → FastAPI handler
    → 檢查：訂閱狀態、對話脈絡、意圖分類
      → 教練問題 → call Claude Sonnet (user profile + history)
      → 內容請求 → retrieve from CMS or generate with Gemini Flash
        → Format as Flex Message → send via LINE Messaging API
          → Log conversation → PostgreSQL
```

### 3.3 技術棧

| 層 | 選擇 |
|----|------|
| Backend | Python 3.11 + FastAPI + Pydantic |
| 資料庫 | PostgreSQL (Supabase) + conversation history |
| LLM | Claude Sonnet 4.5 (教練) + Gemini Flash (內容) |
| LINE 整合 | Messaging API + LIFF SDK |
| 前端 (LIFF) | Next.js + React |
| 部署 | Vercel (API + LIFF app) |
| 支付 | LINE Pay API |

---

## 4. 資料模型

### 4.1 核心表（7 張）

```sql
-- 用戶
users (
  id SERIAL PRIMARY KEY,
  line_user_id VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR,
  subscription_tier VARCHAR DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PREMIUM')),
  subscribed_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 孩子資訊
children (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR,
  birth_date DATE,
  gender VARCHAR,
  personality_tags JSONB DEFAULT '[]',   -- ["curious", "shy", "active"]
  concerns JSONB DEFAULT '[]'            -- ["screen_time", "sibling_rivalry"]
)

-- 對話紀錄
conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  llm_model VARCHAR NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 內容庫
content_library (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  category VARCHAR CHECK (category IN ('PARENTING_TIPS', 'EDUCATION', 'HEALTH', 'ACTIVITIES')),
  age_range VARCHAR CHECK (age_range IN ('3-5', '6-8', '9-12')),
  content_markdown TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  published_at TIMESTAMPTZ
)

-- 教練紀錄
coaching_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  child_id INTEGER REFERENCES children(id),
  topic VARCHAR,
  claude_prompt TEXT,
  claude_response TEXT,
  feedback_rating SMALLINT CHECK (feedback_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 社群群組
community_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  age_range VARCHAR,
  member_count INTEGER DEFAULT 0,
  subscription_required BOOLEAN DEFAULT TRUE
)

-- 群組成員
group_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  group_id INTEGER REFERENCES community_groups(id),
  joined_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.2 對話脈絡管理

```python
# 策略：滑動視窗 + 舊對話摘要
# - 保留最近 10 則訊息（完整內容）
# - 更早的對話用 Gemini Flash 壓縮成摘要（成本優化）
# - 傳給 Claude：user profile + child profiles + recent context + current question

context = {
    "user_profile": get_user_profile(user_id),
    "children": get_children(user_id),
    "recent_messages": get_last_n_messages(user_id, n=10),
    "conversation_summary": get_compressed_history(user_id),
    "current_question": message_text
}
```

### 4.3 API Contracts（內部）

```python
class CoachingRequest(BaseModel):
    user_id: int
    message: str
    child_id: int | None = None

class CoachingResponse(BaseModel):
    response_text: str
    flex_message: dict
    tokens_used: int

class ContentGenerateRequest(BaseModel):
    topic: str
    age_range: str
    format: Literal["article", "activity", "tip"]

class ContentGenerateResponse(BaseModel):
    title: str
    content_markdown: str
    tags: list[str]
```

---

## 5. LLM 策略

### 5.1 使用邊界

| 允許（核心功能） | 禁止 |
|-----------------|------|
| ✅ 個人化教練對話（Claude Sonnet） | ❌ 醫療/法律建議（加免責聲明，轉介專業人士） |
| ✅ 內容生成：文章、活動點子、對話引導 (Gemini Flash) | ❌ 違反台灣文化價值觀的內容 |
| ✅ 對話摘要壓縮（Gemini Flash） | ❌ 取代人類專家內容（LLM 是補充不是替代） |
| ✅ 意圖分類：路由用戶訊息到正確 handler (Gemini Flash) | |

### 5.2 模型選擇理由

| 模型 | 用途 | 為什麼 |
|------|------|--------|
| Claude Sonnet 4.5 | 教練對話 | 最佳同理心回覆品質、強安全護欄、理解台灣文化脈絡 |
| Gemini Flash | 內容生成 + 摘要 | 快速、便宜、structured output 良好、free tier 足夠 MVP |

### 5.3 Claude 教練 Prompt Template

```
You are a Taiwan family education coach. Respond in Traditional Chinese.

User profile:
- Parent: {user_name}
- Child: {child_name}, age {child_age}, personality: {personality_tags}
- Concerns: {concerns}

Recent context:
{conversation_summary}

Current question:
{user_message}

Guidelines:
1. Respond with empathy and cultural sensitivity
   (Taiwan values: respect for elders, academic achievement, family harmony)
2. Provide 1-2 specific, actionable suggestions (not generic advice)
3. Keep response under 200 characters (LINE message length)
4. If question requires professional help (medical, legal),
   acknowledge concern and recommend seeking expert
5. End with encouraging tone

Response:
```

### 5.4 Gemini 內容生成 Prompt Template

```
Generate a Traditional Chinese parenting article for Taiwan parents.

Topic: {topic}
Age range: {age_range}
Format: {format}

Requirements:
- Length: 300-500 characters
- Structure: Problem → Solution → Example → Action step
- Tone: Warm, practical, evidence-based
- Cultural fit: Taiwan education system, local examples
- Include 1-2 specific activities parents can try this week

Output markdown with ## headings.
```

### 5.5 成本控制

```
Claude Sonnet：~$0.01 per coaching response (200 tokens out)
  100 coaching questions/day → $1/day → $30/mo（within budget）

Gemini Flash：Free tier 1,500 requests/day
  內容生成 + 摘要 + 意圖分類全部走 free tier

對話摘要：batch process nightly（減少 API calls）
```

---

## 6. OpenClaw Agent 設計

### 6.1 SEEDCRAFT Agent（1 個，Phase 2 啟用）

```
ContentScheduler Agent
  ├── 觸發：每日 cron（早上 7:00 台灣時間）
  ├── 功能：
  │   ├── 從內容庫選取當日推送內容（按用戶孩子年齡分群）
  │   ├── 個性化推播（Flex Message carousel）
  │   └── opt-in 用戶才推送（不 spam）
  ├── 輸出：LINE 推播 + 推播紀錄到 PostgreSQL
  └── 依賴：Content Library + LINE Messaging API
```

### 6.2 自動化流程

```
ContentScheduler 每日流程：
  1. 查詢 opt-in 用戶 + 其孩子年齡分組
  2. 從 content_library 選取匹配 age_range 的內容
  3. 若庫存不足 → 觸發 Gemini Flash 生成新內容
  4. 格式化為 Flex Message carousel（3 張 swipeable cards）
  5. 透過 LINE Messaging API 推送
  6. 紀錄推播結果（送達率、開啟率）
```

---

## 7. TechTrend 整合

TechTrend 是獨立的 B2B 技術週刊產品。SEEDCRAFT 可從其內容生產過程中獲取的附帶情報：

| NB 來源 | SEEDCRAFT 追蹤項 | 影響 |
|---------|-----------------|------|
| NB1 AI 模型 | TTS / 圖像生成工具更新（ElevenLabs, Imagen） | 未來語音故事功能 |
| NB2 框架 | Next.js 更新 + LINE SDK 版本 | LIFF app 穩定性和功能 |
| NB3 DevOps | Vercel CDN 台灣節點、LINE API rate limit 變動 | 延遲和推播效能 |
| NB4 商業 | LINE 生態系變動 + 台灣教育市場趨勢 | 定價和市場策略 |

---

## 8. 跨專案整合點

| 專案 | 整合方式 | 階段 | 價值 |
|------|---------|------|------|
| RTA | 教育場所（補習班/才藝班）評論分析 → 家長選擇依據 | Phase 3 | 🟡 中 |
| 小決定 | 家庭餐廳推薦（kid-friendly 標籤） | Phase 3 | 🟢 低 |
| TechTrend | 追蹤 edtech / parenting app 市場動態 | Ongoing | Intelligence |

---

## 9. 版權與法律風險

### 9.1 風險矩陣

**🔴 HIGH：提供育兒建議但無專業資質**
- Mitigation：清楚的免責聲明；敏感主題加入「諮詢專家」按鈕；Phase 2 與持照教育者合作進行內容審核

**🟡 MEDIUM：LLM 生成內容準確度**
- Mitigation：已發佈文章經人工審核；LLM 僅用於個人化教練對話（ephemeral）；回饋迴路（用戶評分 + flag）

**🟡 MEDIUM：PDPA 合規（兒童資料）**
- Mitigation：最小化兒童資料收集（僅年齡、性格標籤，無照片/名字存 DB）；需家長同意；可刪除資料；不與第三方分享

**🟡 MEDIUM：LINE ToS 合規（商業使用）**
- Mitigation：使用官方 LINE Messaging API；遵守 rate limits；不 spam（每日提示為 opt-in）；遵循 LINE Pay 商家規範

**🟢 LOW：內容版權（文章、活動設計）**
- Mitigation：所有內容原創或適當授權；LLM 生成內容為衍生作品；引用來源

### 9.2 必要免責聲明（首次互動時顯示）

```
歡迎使用 SEEDCRAFT！
本平台提供家庭教育資訊分享，內容僅供參考，
不構成專業醫療、心理或法律建議。
如您的孩子有特殊需求或疑慮，請諮詢專業人士。
使用本服務即表示您同意我們的服務條款與隱私政策。
```

### 9.3 合規 TODO

- [ ] 擬定服務條款（台灣法律審查）
- [ ] 實作 PDPA 資料刪除工作流
- [ ] 與 1-2 位持照教育者合作內容審核
- [ ] 加入「回報不當內容」功能
- [ ] 建立危機應對協議（若用戶通報兒童安全問題 → 提供專線號碼）

---

## 10. 成功標準與退出條件

| 階段 | 成功標準 | 退出條件 |
|------|---------|---------|
| Phase 1 | 100 LINE friends, 50 weekly active users | 2 個月，< 20 active users |
| Phase 2 | 500 friends, 50 Premium subscribers (10% conversion) | 4 個月，< 5% conversion |
| Phase 3 | $600 MRR, 3 community groups (30+ members each) | 6 個月，< $300 MRR |
| Phase 4 | $2K MRR, B2B pilot with 1 school | 連續 3 個月下滑 |

**每週時間投入：** 8-10 hr/week（高優先級 for 台灣市場），下限 6 hr/week

---

## 11. 下一步行動（Sprint 1）

**Sprint 1 目標：** Working LINE bot + basic coaching + 50 LINE friends

### Week 1-2：LINE Bot 基礎
- 註冊 LINE Official Account（verified account for credibility）
- 設定 LINE Messaging API webhook（FastAPI endpoint）
- 實作歡迎流程：greeting → profile setup prompt → first coaching tip
- 用 5 位朋友/家人測試

### Week 3-4：Claude 教練整合
- 整合 Claude Sonnet 教練回覆
- 建立對話脈絡管理（store last 10 messages）
- 製作 10 則每日提示範本（人工撰寫，非 LLM 生成）
- 設計 Rich Menu（4 tabs）

### Week 5-6：LIFF App + 內容庫
- 建立 LIFF app scaffold (Next.js)
- 實作個人資料設定表單（孩子資訊、關注議題）
- 建立內容庫（20 篇人工撰寫文章）
- 軟啟動：邀請 50 位 beta users（parenting Facebook groups）

### Sprint 1 交付物

```
✅ LINE bot responding to messages (<3s latency)
✅ Claude coaching integration (personalized responses)
✅ LIFF profile setup working
✅ 50 LINE friends (beta users)
✅ 20 articles in content library
```

### LINE 整合設計備忘

**Rich Menu（底部 tab bar）：**
- Tab 1：「今日建議」→ 發送每日教練提示
- Tab 2：「問問題」→ 開啟文字輸入
- Tab 3：「內容庫」→ 開啟 LIFF app
- Tab 4：「我的方案」→ 訂閱狀態

**Flex Messages 範本：**
- 教練回覆：Bubble layout with avatar, advice text, 「詳細內容」button
- 每日提示 carousel：3 swipeable cards（不同主題）
- Premium upsell：Hero image + 功能清單 + CTA button

**LINE Pay 訂閱流程：**
- 用戶點擊「升級」→ LIFF 支付頁 → LINE Pay → webhook 確認 → 更新 subscription_tier
- 7 天免費試用（不需信用卡，到期自動降回 FREE）

---

*Owner: Alan | Created: 2026-02-25 | Status: Rebrand 完成，進入 Sprint 1*
