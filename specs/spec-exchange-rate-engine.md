# CardSense — 即時匯率與價值轉換引擎 (Exchange Rate Engine)
### Version 1.0 | 2026-04-08

---

## 1. 目標

讓 CardSense 成為市場上唯一能將**哩程、點數、現金回饋**三種異質回饋單位，統一換算為「**等值台幣 (TWD)**」並跨卡排名的精算工具。

### 1.1 解決的問題

| 問題 | 現狀 | 目標 |
|------|------|------|
| 哩程卡 vs 現金回饋卡無法直接比較 | 排名只能按原始數字排序，1 哩 ≠ 1 元 | 統一轉換為 TWD 後精準排名 |
| 不同玩家對哩程/點數的價值認知不同 | 系統只有一個固定估值 | 玩家可自訂匯率，排名即時洗牌 |
| 靜態比價網只能寫「最高 X%」 | iCard.AI 等網站無法量化哩程實際價值 | CardSense 即時展示「等值台幣回饋」 |

### 1.2 戰略價值

此功能是 CardSense 相較於 iCard.AI 的**核心護城河**：
- **技術壁壘**：需要 `RewardCalculator` 的確定性引擎才能做到，靜態網站無法複製
- **高階用戶黏著性**：哩程玩家會因為「自訂匯率」頻繁回訪調整
- **品牌定位**：「匯率牌告板」在視覺上立即建立「專業金融工具」的印象

---

## 2. 設計規格

### 2.1 匯率資料結構

```json
// exchange-rates.json — 系統預設匯率表
{
  "version": "2026-04-08",
  "rates": {
    "POINTS": {
      "CTBC":    { "value": 1.0, "unit": "LINE Points",  "note": "1:1 折抵消費" },
      "CATHAY":  { "value": 1.0, "unit": "小樹點",       "note": "1:1 折抵消費" },
      "TAISHIN": { "value": 1.0, "unit": "DAWHO 幣",     "note": "1:1 折抵消費" },
      "ESUN":    { "value": 1.0, "unit": "e point",      "note": "1:1 折抵消費" },
      "FUBON":   { "value": 1.0, "unit": "mmo 幣",       "note": "1:1 折抵消費" }
    },
    "MILES": {
      "_DEFAULT":       { "value": 0.40, "unit": "航空哩程", "note": "保守估值，經濟艙兌換基準" },
      "EVA_INFINITY":   { "value": 0.50, "unit": "長榮哩程", "note": "亞洲區段經濟艙" },
      "ASIA_MILES":     { "value": 0.40, "unit": "亞洲萬里通", "note": "國泰/港龍經濟艙" },
      "JALPAK":         { "value": 0.35, "unit": "JAL 哩程",  "note": "日航經濟艙" }
    }
  }
}
```

### 2.2 API 介面擴充

#### Request 擴充

在 `POST /v1/recommendations/card` 的 request body 中新增 optional 欄位：

```json
{
  "scenario": {
    "category": "TRAVEL",
    "amount": 60000,
    "subcategory": "AIRLINE"
  },
  "customExchangeRates": {
    "MILES._DEFAULT": 0.60,
    "POINTS.ESUN": 0.80
  }
}
```

**規則**：
- Key 格式為 `{cashbackType}.{bankCode}` 或 `{cashbackType}._DEFAULT`
- Value 為玩家認定的 1 單位對應的 TWD 價值
- 未提供的 key 使用系統預設值
- `customExchangeRates` 為 optional，不傳則完全使用系統預設

#### Response 擴充

在 `CardRecommendation` 中新增匯率資訊：

```json
{
  "cardName": "國泰世華 CUBE 卡",
  "estimatedReturn": 1600,
  "rewardDetail": {
    "rawReward": 4000,
    "rawUnit": "MILES",
    "exchangeRate": 0.40,
    "exchangeRateSource": "SYSTEM_DEFAULT",
    "ntdEquivalent": 1600,
    "note": "航空哩程 × 0.40 TWD/哩"
  }
}
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `rawReward` | Integer | 原始回饋數量（哩程數 / 點數 / 現金） |
| `rawUnit` | String | 回饋單位（MILES / POINTS / TWD） |
| `exchangeRate` | BigDecimal | 使用的匯率 |
| `exchangeRateSource` | String | `SYSTEM_DEFAULT` 或 `USER_CUSTOM` |
| `ntdEquivalent` | Integer | 換算後的等值台幣 |

### 2.3 新增 API Endpoint

#### `GET /v1/exchange-rates`

回傳目前系統預設的完整匯率牌告表，供前端渲染「匯率看板」元件。

```json
{
  "version": "2026-04-08",
  "rates": [
    { "type": "POINTS", "bank": "CTBC", "unit": "LINE Points", "value": 1.0 },
    { "type": "POINTS", "bank": "CATHAY", "unit": "小樹點", "value": 1.0 },
    { "type": "MILES", "bank": "_DEFAULT", "unit": "航空哩程", "value": 0.40 }
  ]
}
```

---

## 3. 實作計畫

### Phase 1：系統預設匯率 + RewardCalculator 整合 ✅ 已完成基礎

- [x] `RewardCalculator.getMileValueRate()` — 哩程估值（目前回傳 0.40）
- [x] `RewardCalculator.getPointValueRate()` — 點數估值（目前依銀行回傳 1.0）
- [ ] 將匯率表抽為外部 JSON 設定檔（`exchange-rates.json`）
- [ ] 建立 `ExchangeRateService` 統一管理匯率查詢

### Phase 2：API 擴充 + 玩家自訂匯率

- [ ] `RecommendationRequest` 新增 `customExchangeRates` 欄位
- [ ] `DecisionEngine` 注入匯率 context，傳遞至 `RewardCalculator`
- [ ] `CardRecommendation` 新增 `rewardDetail` 欄位（rawReward / rawUnit / exchangeRate / ntdEquivalent）
- [ ] `GET /v1/exchange-rates` endpoint 實作
- [ ] contracts repo 更新 recommendation-request/response schema

### Phase 3：前端呈現

- [ ] 推薦結果頁「匯率牌告」看板元件
- [ ] `/calc` 進階選項：「自訂點數/哩程價值」折疊面板 
- [ ] 推薦結果卡片：顯示 `rawReward` + `exchangeRate` → `ntdEquivalent` 明細
- [ ] 分享圖（Canvas）中加入使用的匯率標註

---

## 4. 前端互動設計

### 4.1 匯率牌告看板

位置：推薦結果頁頂部或側邊欄。以跑馬燈或表格形式顯示：

```
📊 回饋匯率牌告
LINE Points = 1.0 TWD | 小樹點 = 1.0 TWD | 航空哩程 = 0.40 TWD
```

### 4.2 自訂匯率面板

位置：`/calc` 的「進階設定」折疊區。

- 預設收合，點擊展開
- 每個回饋類型一個 slider 或 input，預填系統預設值
- 修改後即時觸發重新計算，排名動態更新
- 顯示提示文字：「哩程價值因兌換方式而異，頭等艙約 0.6-0.8 TWD/哩，經濟艙約 0.3-0.4 TWD/哩」

### 4.3 結果卡片匯率標註

在推薦結果中，回饋型別非 TWD 現金的卡片，追加折行顯示：

```
預估回饋：4,000 哩 × 0.40 TWD/哩 = 1,600 TWD 等值
```

---

## 5. 與其他功能的關係

| 功能 | 關係 |
|------|------|
| **MILES 計算** | Exchange Rate Engine 是其直接延伸，將原始哩程數轉為可比較的 TWD |
| **我的卡包** | 搭配 My Wallet 使用時，玩家可以設定「我的哩程估值」作為個人化錢包的一部分 |
| **分享圖** | Canvas 分享圖需包含匯率標註，讓社群看到精確的計算依據 |
| **Checkout Widget** | B2B 場景下使用系統預設匯率即可，不需玩家自訂 |

---

*Owner: Alan | Created: 2026-04-08 | Priority: 🔥 P0*
