# 591 租屋推播 Bot — 完整專案規格說明書
### Version 2.0 | 2026-04-20 | 個人使用版

---

## 1. 專案概述

### 1.1 一句話定位
**監控 591 租屋網的新上架物件，符合自訂條件時立即推播 LINE 和 Discord 通知，讓你第一時間看到符合需求的物件。**

### 1.2 問題陳述
591 租屋網沒有原生的「新物件通知」功能，使用者必須手動重整頁面才能發現新上架物件。在租屋市場競爭激烈的台北，好物件往往數小時內就被預約，人工監控根本來不及。

### 1.3 解決方案
在 Oracle Cloud 永久免費 VM 跑一個 Python 排程服務，每 15 分鐘：
1. 用 Playwright 自動刷新的 T591_TOKEN 呼叫 591 BFF API
2. 比對 Supabase 資料庫，找出新物件
3. 透過 LINE Messaging API（Flex Message）和 Discord Webhook 推播符合條件的物件

### 1.4 使用範圍
**個人使用，不商業化、不轉售資料。**

---

## 2. 系統架構

```
┌──────────────────────────────────────────────────────────────┐
│               Oracle Cloud VM（常駐服務）                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │ Token 取得層  │───▶│  爬取排程層   │───▶│    推播層       │  │
│  │              │    │              │    │                │  │
│  │ • Playwright │    │ • 每15分鐘   │    │ • LINE Flex    │  │
│  │   無頭瀏覽器  │    │   呼叫BFF API │    │   Messaging    │  │
│  │ • 每2小時    │    │ • Diff 比對  │    │ • Discord      │  │
│  │   自動刷新   │    │ • 過濾 matcher│    │   Webhook      │  │
│  └──────────────┘    └──────────────┘    └────────────────┘  │
│          │                   │                               │
│          ▼                   ▼                               │
│   本地 SQLite            Supabase                            │
│  (token_cache.db)    (listings / my_filters / notify_log)    │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              LINE Bot              Discord
           （Flex Message）         （Embed）
```

---

## 3. 技術選型

| 層 | 選擇 | 原因 |
|---|---|---|
| 語言 | Python 3.12 | 快速開發，生態豐富 |
| 套件管理 | uv | 比 pip 快，內建虛擬環境管理 |
| Token 取得 | Playwright（無頭 Chromium） | 自動刷新 T591_TOKEN，免手動操作 |
| 591 API | BFF API v3（bff-house.591.com.tw） | 2026 年後的新端點，使用 T591_TOKEN cookie |
| HTTP 請求 | requests | 輕量，拿到 token 後直接打 API |
| 排程 | schedule | 簡單的 Python 排程庫 |
| 主資料庫 | Supabase（PostgreSQL） | 雲端托管，免維護，多裝置共享 |
| Token 快取 | 本地 SQLite | 輕量快取，不影響主資料庫 |
| 推播（主） | LINE Messaging API | Flex Message 支援圖文排版 |
| 推播（副） | Discord Webhook | 備用管道，Embed 格式豐富 |
| 部署 | Oracle Cloud Free Tier VM | 永久免費，24hr 常駐執行 |

---

## 4. 反爬蟲分析與對策

### 4.1 591 新版防護（2026+）

| 防護層 | 技術 | 對策 |
|---|---|---|
| CDN 層 | Cloudflare Bot Management | 使用真實瀏覽器產生的 token，不模擬 |
| 請求驗證 | `T591_TOKEN` cookie + `deviceid` header | Playwright 攔截真實請求取得 |
| API 端點 | 從 rsList 改為 BFF v3 API | fetcher 已更新至新端點 |
| IP 封鎖 | Datacenter IP 可能快速封鎖 | Oracle Cloud IP 目前無問題 |
| 行為偵測 | Request timing、順序 | 加入隨機延遲（2-4 秒） |

### 4.2 Token 生命週期

- `T591_TOKEN` 有效期：約 2-4 小時
- 取得方式：Playwright 無頭 Chromium，自動開啟 591 首頁截取 token
- 刷新頻率：每 2 小時由 `token_refresher.py` 自動執行

---

## 5. 資料模型

### 5.1 Supabase（主資料庫）

```sql
-- 物件主表
CREATE TABLE listings (
    id            TEXT PRIMARY KEY,      -- 591 house_id
    title         TEXT,
    price         INTEGER,               -- 月租金（元）
    district      TEXT,                  -- 行政區（如「大安區」）
    section_name  TEXT,                  -- 更細的地區
    address       TEXT,
    area          REAL,                  -- 坪數
    floor         TEXT,                  -- 樓層（如「3/12」）
    kind          TEXT,                  -- 整層/套房/雅房/分租套房
    gender_limit  TEXT,
    images        TEXT,                  -- JSON array of URLs
    url           TEXT,
    first_seen    TEXT,                  -- ISO 8601
    last_seen     TEXT,
    is_active     INTEGER DEFAULT 1
);

-- 篩選條件（可存多組）
CREATE TABLE my_filters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    config      JSONB NOT NULL           -- 見 §6.2
);

-- 推播紀錄（避免重複通知）
CREATE TABLE notify_log (
    id            BIGSERIAL PRIMARY KEY,
    listing_id    TEXT NOT NULL,
    filter_id     INTEGER NOT NULL,
    sent_at       TIMESTAMPTZ DEFAULT now(),
    status        TEXT DEFAULT 'sent'
);
```

### 5.2 本地 SQLite（token_cache.db）

```sql
CREATE TABLE token_cache (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    x_token     TEXT NOT NULL,   -- T591_TOKEN / deviceid
    cookie      TEXT NOT NULL,   -- 完整 cookie 字串
    updated_at  TEXT NOT NULL
);
```

### 5.3 591 BFF API 欄位對應

| BFF API 欄位 | 本地欄位 | 說明 |
|---|---|---|
| `id` | `houseid` | 唯一識別 |
| `title` | `title` | 物件標題 |
| `price` | `price` | 月租金 |
| `address`（`區-路段`格式） | `regionname` / `section_name` | 行政區 + 路段 |
| `area` | `area` | 坪數 |
| `kind_name` | `kind_name` | 租屋類型 |
| `floor_name`（`6F/23F`格式） | `floor`（`6/23`） | 樓層（正規化） |
| `photoList` | `photo_list` | 圖片 URL 陣列 |
| `surrounding.desc` | `metro_desc` | 捷運站名 |
| `surrounding.distance` | `metro_distance_m` | 捷運距離（公尺） |
| `layoutStr`（`2房2廳`） | `layout_rooms` | 房數（整數） |
| `tags` | `tags` + `is_top_floor_addition` | 標籤（含頂樓加蓋判斷） |

---

## 6. 核心功能規格

### 6.1 Token 刷新：Playwright 方案

```python
# token_refresher.py
# 監聽 591 首頁發出的 API 請求，擷取 T591_TOKEN cookie 和 deviceid header

async def refresh_token():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # 攔截 bff-house API 請求，取出 T591_TOKEN + cookie
        # 存入本地 token_cache.db
```

### 6.2 篩選條件格式（`config` JSONB）

```json
{
  "region": 1,
  "section_ids": [4233, 4234],
  "kinds": ["整層住家"],
  "price_min": 20000,
  "price_max": 35000,
  "area_min": 15,
  "floor_min": 3,
  "gender_limit": ["不限", "男"],
  "notice": "not_cover",
  "metro_stations": ["善導寺", "忠孝新生"],
  "metro_max_distance": 500,
  "layout": 2,
  "stations": [306, 307],
  "options": ["cold", "washer"]
}
```

| 欄位 | 類型 | 說明 |
|---|---|---|
| `region` | int | 縣市代碼（1=台北市） |
| `section_ids` | list/str | 591 行政區 ID |
| `kinds` | array | 整層住家/獨立套房/分租套房/雅房 |
| `price_min/max` | int | 月租金範圍（元） |
| `area_min` | float | 最小坪數 |
| `floor_min` | int | 最低樓層 |
| `gender_limit` | array | 性別限制白名單 |
| `notice` | str | `"not_cover"` = 排除頂樓加蓋 |
| `metro_stations` | array | 捷運站名白名單 |
| `metro_max_distance` | int | 捷運距離上限（公尺） |
| `layout` | int | 房數（API + matcher 雙重過濾） |
| `stations` | list | 捷運站 ID（API 層過濾） |
| `options` | list | 設備代碼（如 `cold`=冷氣，`washer`=洗衣機） |

### 6.3 篩選比對引擎（matcher.py）

API 層已透過 query params 做初步過濾，`matcher.py` 在 client 端補強以下條件：

- 價格範圍（`price_min/max`）
- 坪數下限（`area_min`）
- 行政區白名單（`districts`）
- 類型白名單（`kinds`）
- 性別限制（`gender_limit`）
- 最低樓層（`floor_min`）
- 排除頂樓加蓋（`notice=not_cover`）
- 房數精確比對（`layout`）
- 捷運站名過濾（`metro_stations`）
- 捷運距離上限（`metro_max_distance`）

### 6.4 推播格式

**LINE Messaging API — Flex Message（Bubble）**

```
┌─ 🏠 新物件｜{filter_name} ─────────────┐
│ [物件圖片]                              │
│ {title}                                │
│ 租金  $20,000/月                        │
│ 類型  整層住家｜25坪｜5/12樓            │
│ 位置  大安區 敦化南路一段               │
│         [查看物件]                      │
└────────────────────────────────────────┘
```

**Discord — Embed**

```
🏠 新物件｜{filter_name}
{title}  →  連結
租金: $20,000/月   類型: 整層住家｜25坪
樓層: 5/12         地點: 大安區 敦化南路一段
捷運: 距忠孝敦化 320m
[物件圖片]
```

---

## 7. 排程主程式（main.py）

- 啟動時執行一次 Token 刷新 + 完整掃描
- 每 **15 分鐘**觸發 `run_scan()`
- 每 **2 小時**觸發 `run_token_refresh()`
- 網路中斷時自動重試下一輪（不崩潰）
- Token 失效時立即刷新後繼續

---

## 8. 目錄結構

```
rent-radar/
│
├── main.py               # 主排程進入點
├── fetcher.py            # 呼叫 591 BFF API v3
├── differ.py             # 新物件比對（Supabase）
├── matcher.py            # 篩選條件比對（client 端）
├── notifier.py           # LINE Flex + Discord 推播
├── token_refresher.py    # Playwright 自動刷新 token
├── mitm_intercept.py     # mitmproxy 攔截腳本（手動備用）
├── setup_db.py           # 初始化本地 SQLite schema
├── add_filter.py         # CLI 工具：新增篩選條件
├── cold_start.py         # 冷啟動工具
├── probe_api.py          # API 連通測試
├── db.py                 # 資料存取層（Supabase + SQLite）
│
├── .env                  # 環境變數（不進 git）
├── .env.example          # 環境變數範本
├── token_cache.db        # 本地 SQLite token 快取（自動建立）
├── pyproject.toml        # uv 專案設定
├── oracle_cloud_setup.md # Oracle Cloud 部署指南
└── 591-LineBot-Spec.md   # 本文件
```

---

## 9. 環境變數

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_USER_ID=your-line-user-id

# Discord（選填）
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 10. 部署（Oracle Cloud Free Tier）

參考 [`oracle_cloud_setup.md`](./oracle_cloud_setup.md)，使用 systemd 常駐執行：

```ini
[Service]
ExecStart=/home/ubuntu/.local/bin/uv run --python 3.12 python main.py
Restart=on-failure
```

```bash
sudo systemctl enable rent-radar
sudo systemctl start rent-radar
sudo journalctl -u rent-radar -f
```

**目前狀態：已部署至 Oracle Cloud，正常運行。**

---

## 11. 風險與限制

| 風險 | 等級 | 說明 |
|---|---|---|
| 591 更新 BFF API 格式 | 🟡 中 | 需更新 fetcher.py normalize_listing |
| Oracle Cloud VM 重啟導致 token 失效 | 🟡 中 | systemd Restart=on-failure 會重啟，再等 2hr 自動刷新 |
| Playwright 在無頭模式被偵測 | 🟡 中 | 目前無問題，若失效改用 mitmproxy 方案 |
| 爬取頻率過高被 IP 封鎖 | 🟢 低 | 15 分鐘一次 + 2-4 秒隨機延遲 |
| 漏掉物件（只抓前幾頁） | 🟢 低 | 預設抓 3 頁（約 90 筆），新物件通常在第 1 頁 |

---

## 12. 未來可擴充功能

| 功能 | 難度 | 說明 |
|---|---|---|
| 每日摘要推播 | 低 | 每天早上推播過去 24hr 的新物件統計 |
| 物件下架偵測 | 低 | last_seen 超過 24hr 標記 is_active = false |
| LINE Bot 雙向對話 | 中 | 支援指令查詢、動態修改篩選條件 |
| 591 以外的房源（好房網、樂屋網）| 高 | 需各別實作 fetcher |

---

*Owner: Alan（個人使用）| Created: 2026-04-12 | Updated: 2026-04-20*
*Tech Stack: Python 3.12 / uv / requests / Playwright / Supabase / LINE Messaging API / Discord / Oracle Cloud*
*Status: 已部署至 Oracle Cloud，正常運行*
