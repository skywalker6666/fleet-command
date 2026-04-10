# CardSense - My Wallet Mode Design
### Date: 2026-04-10

---

## 1. Goal

把 `/calc` 從一次性的全網比價工具，往「我的卡包最佳化」再推進一步。

第一版 `My Wallet` 的核心目標不是新增獨立頁面，也不是做帳號系統，而是讓使用者在 `/calc` 內可以：

1. 保存自己的持卡清單
2. 保存卡片對應的 benefit plan / runtime 狀態
3. 保存常用的 points / miles 自訂估值
4. 下次回來時自動還原這些偏好，直接從自己的卡包開始比較

---

## 2. Product Positioning

### 2.1 What My Wallet Means in v1

`My Wallet` 在 v1 是 `/calc` 裡的一個持久化能力，不是新頁面，也不是登入後的個人資料中心。

它代表的是：

- 你的持卡清單
- 你的卡片權益狀態
- 你的估值偏好

它不代表：

- 你上次的消費情境
- 你上次的算卡結果
- 雲端同步帳戶

### 2.2 User Feeling We Want

使用者回來時的主感受應該是：

> 「這是我的卡包，連方案狀態和估值都還原好了，我可以直接開始算。」

而不是：

> 「我被帶回上一次某個特定情境的表單。」

---

## 3. Scope

### 3.1 In Scope

- 在 `/calc` 加入 `My Wallet` 保存與還原能力
- 使用 `localStorage` 保存 wallet snapshot
- 保存以下 state
  - `selectedCards`
  - `activePlansByCard`
  - `planRuntimeByCard`
  - `customExchangeRates`
- 頁面載入時自動讀取並還原有效 snapshot
- 提供明確的 `Save my wallet` 與 `Clear wallet` 操作
- 在 wallet 已存在且卡數足夠時，避免 auto-select 覆蓋使用者卡包

### 3.2 Out of Scope

- 後端帳號系統
- 跨裝置同步
- `/calc` 情境欄位保存
  - `amount`
  - `category`
  - `subcategory`
  - `merchantName`
  - `paymentMethod`
- 上次結果快照
- 我的卡包獨立頁面
- 利差估算 / 新卡加入模擬

---

## 4. Design Choice

### 4.1 Options Considered

#### Option A: 只保存持卡清單

只保存 `selectedCards`。

優點：

- 最快上線
- 實作風險最低

缺點：

- 無法還原 plan 與 runtime 狀態
- 對 Cube / Richart / Unicard 這類卡體驗不完整
- miles / points 使用者也失去自訂估值

#### Option B: 保存完整卡包狀態

保存 `selectedCards`、`activePlansByCard`、`planRuntimeByCard`、`customExchangeRates`。

優點：

- 最符合 `My Wallet` 本質
- 還原後可直接重跑自己的卡包比較
- 不會把一次性的情境表單一起黏住
- 未來可自然擴充成更完整 workspace

缺點：

- 要處理 schema version 與部分資料失效
- 需要設計明確的儲存/清空 UX

#### Option C: 保存完整工作台

除了卡包狀態，再保存整個 `/calc` 情境欄位。

優點：

- 回訪最完整

缺點：

- 第一版容易混淆「我的卡包」與「上次表單」
- 回來時畫面可能過度黏住某個舊情境

### 4.2 Recommendation

採用 **Option B: 保存完整卡包狀態**。

原因：

- 它最接近 `My Wallet` 的產品定義
- 可立即提升回訪便利性
- 能保留 benefit plan 與估值這些相對穩定的偏好
- 未來若要升級到 Option C，只要擴充 schema，不需要推翻 v1

---

## 5. Storage Model

### 5.1 Storage Key

使用單一 key：

```ts
const MY_WALLET_STORAGE_KEY = 'cardsense.my-wallet.v1'
```

### 5.2 Snapshot Shape

```ts
interface MyWalletSnapshot {
  version: 1
  savedAt: string
  selectedCards: string[]
  activePlansByCard: Record<string, string>
  planRuntimeByCard: Record<string, Record<string, string>>
  customExchangeRates: Record<string, number>
}
```

### 5.3 Why This Shape

- `selectedCards` 是卡包核心
- `activePlansByCard` 保存卡片當前方案
- `planRuntimeByCard` 保存方案對應的 runtime input
- `customExchangeRates` 保存使用者對 miles / points 的估值偏好
- `version` 讓未來 schema 演進時可安全兼容
- `savedAt` 讓 UI 能顯示最後更新時間

---

## 6. UI Design

### 6.1 Placement

`My Wallet` 控制列放在 `/calc` 左欄，靠近 `CardSelector`，因為它主要控制的是「我的卡包」而不是情境欄位。

建議位置：

- `InlineExchangeRatesPanel` 之後
- `CardSelector` 之前

這樣順序會是：

1. 情境輸入
2. 切卡 / benefit plan 狀態
3. exchange rate 偏好
4. My Wallet 保存控制
5. CardSelector

### 6.2 Controls

控制列包含：

- `Save my wallet` 按鈕
- 儲存狀態文字
  - 例如 `Saved 5 cards · updated just now`
- `Clear wallet` 次要操作

### 6.3 Load Feedback

頁面在成功還原 wallet 後，顯示輕量提示，讓使用者知道目前不是空白狀態。

例如：

- `Loaded your wallet: 5 cards, 2 custom rates`
- 若有部分項目失效：`Loaded your wallet with some unavailable items removed`

---

## 7. Interaction Model

### 7.1 Save Behavior

v1 採用 **手動保存**，不採用每次變更即自動覆蓋。

理由：

- 卡包屬於偏穩定的使用者資產
- 手動保存能避免誤操作立刻寫回 storage
- 行為更可預期，適合第一版

### 7.2 Clear Behavior

`Clear wallet` 會：

- 清除 `localStorage` 中的 wallet snapshot
- 重置以下 state
  - `selectedCards`
  - `activePlansByCard`
  - `planRuntimeByCard`
  - `customExchangeRates`

不重置以下情境欄位：

- `amount`
- `category`
- `subcategory`
- `merchantName`
- `paymentMethod`

理由是避免使用者正在進行中的算卡情境被整頁洗掉。

### 7.3 First Visit Behavior

若 storage 不存在有效 wallet：

- 頁面維持現有行為
- auto-select 可從全卡庫挑預設比較卡
- 不顯示已載入 wallet 提示

---

## 8. Data Flow

### 8.1 Ownership

`CalcPage` 維持目前作為單一 state source，不引入 global store。

新增一個專用 hook，例如：

```ts
useMyWalletStorage()
```

負責：

- 讀取 snapshot
- 驗證 snapshot
- 保存 snapshot
- 清除 snapshot

### 8.2 Load Flow

1. `CalcPage` mount
2. 讀取 `localStorage`
3. parse JSON
4. 檢查 `version`
5. 過濾不存在的 card code
6. 過濾失效的 plan / runtime / exchange rate values
7. 將有效資料灌回 page state
8. 顯示 loaded 提示

### 8.3 Save Flow

1. 使用者點 `Save my wallet`
2. 由目前 `CalcPage` state 組出 snapshot
3. 寫入 `localStorage`
4. 更新 saved 狀態提示

### 8.4 Auto-Select Rule Change

目前 `/calc` 會在條件改變時從全卡庫 auto-select 推薦卡。

My Wallet v1 加入後，規則調整為：

- 若已成功載入 wallet，且 `selectedCards.length >= 2`
  - 不自動覆蓋目前卡包
- 若沒有 wallet，或還原後少於 2 張卡
  - 保持原本 auto-select 行為

這樣可以避免使用者的卡包在載入後又被系統選卡洗掉。

---

## 9. Validation and Error Handling

### 9.1 Invalid JSON

若 storage 內容不是合法 JSON：

- 靜默忽略
- 視為沒有 wallet
- 可選擇清除壞資料，避免之後反覆失敗

### 9.2 Version Mismatch

若 `version !== 1`：

- 不套用資料
- 視為不相容 snapshot

### 9.3 Missing Cards

若 snapshot 裡的 card code 已不存在於目前 card catalog：

- 僅還原仍存在的卡片
- 顯示部分還原提示

### 9.4 Invalid Plans or Runtime Fields

若某張卡的 plan 或 runtime field 已失效：

- 保留該卡在 `selectedCards`
- 丟棄無效 plan / runtime
- 不阻斷其他資料還原

### 9.5 Invalid Exchange Rate Values

若 `customExchangeRates` 含有非數值、負值或無法使用的內容：

- 過濾掉無效項目
- 保留有效項目

---

## 10. Testing

### 10.1 Unit Tests

- `useMyWalletStorage` save / load / clear
- invalid JSON handling
- version mismatch handling
- unknown card filtering
- invalid runtime / plan filtering
- invalid exchange rate filtering
- wallet exists 時 auto-select 不覆蓋既有 card selection

### 10.2 Behavior Verification

1. 選 3 張卡，設定 plan / runtime / 自訂估值後儲存
2. 重整頁面後，卡包與狀態完整還原
3. 還原後不會被 auto-select 覆蓋
4. 清空 wallet 後，持卡/plan/rates 被清掉，但情境欄位保留
5. 當某張卡已不存在時，只部分還原其餘卡片
6. 當 storage 資料壞掉時，頁面仍可正常載入

---

## 11. Risks

### 11.1 Product Risk

若 UI 不清楚，使用者可能分不清：

- 目前只是暫時勾選
- 還是已經保存到 My Wallet

因此必須提供清楚的 saved state 文案。

### 11.2 Data Drift Risk

卡片 catalog、plan config、runtime fields 可能持續演進。

因此 restore 流程必須以「部分還原、盡量不壞」為原則，不能因一張卡失效就讓整個 wallet 載入失敗。

### 11.3 Scope Creep Risk

v1 很容易被拉去同時做：

- 上次情境保存
- 新卡利差估算
- 雲端同步

這些都應明確排除，避免模糊 `My Wallet` 第一版的交付邊界。

---

## 12. Outcome

完成後，`/calc` 會從「每次都要重新勾卡」升級成一個真正可回訪的個人卡包工具：

- 回來後自動載入自己的卡包
- benefit plan 與 runtime 狀態會被還原
- miles / points 自訂估值會被還原
- 比較結果會更接近真實持卡場景

這為下一步的兩個方向打底：

1. `新卡利差估算`
2. `完整工作台 / 上次情境回訪`
