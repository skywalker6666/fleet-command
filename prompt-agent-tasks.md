# prompt-agent-tasks — OpenClaw 任務指令模板

> 透過 Discord 下指令給 OpenClaw 時使用的標準化指令模板。  
> 複製 → 填入 {變數} → 貼到 Discord 即可。

---

## 日常維護類

### 每日專案狀態彙報

```
@OpenClaw 請幫我檢查以下 repo 的最新狀態：
- skywalker6666/cardsense-api
- skywalker6666/review-trust-analyzer
- skywalker6666/seedcraft

列出：
1. 過去 24 小時的 commit 摘要
2. 開放中的 PR（含狀態）
3. 標記為 P0 或 P1 的 Issues
4. 結果寫入 fleet-command/agent-log/ 今天的日期
```

### 每週進度回顧

```
@OpenClaw 產生本週進度回顧：
1. 檢查所有 skywalker6666 底下 repo 過去 7 天的 commit
2. 統計各 repo 的 commit 數和主要變更
3. 列出新開和關閉的 Issues/PR
4. 寫成 Markdown 格式的週報
5. commit 到 fleet-command/agent-log/weekly-{YYYY-WXX}.md
```

---

## GitHub 操作類

### 開 Issue

```
@OpenClaw 在 skywalker6666/{repo} 開一個 Issue：
標題：{issue 標題}
內容：{issue 描述}
標籤：{bug/feature/enhancement/P0/P1}
```

### 更新 Issue 狀態

```
@OpenClaw 在 skywalker6666/{repo} 的 Issue #{number}：
- 加上留言：{進度更新內容}
- 標籤改為：{新標籤}
```

### 整理 Issues

```
@OpenClaw 幫我整理 skywalker6666/{repo} 的 Issues：
1. 列出所有 open Issues
2. 依優先級排序（P0 > P1 > 其他）
3. 標記超過 14 天未更新的為 stale
4. 結果回報到 Discord
```

---

## 研究調查類

### 技術調研

```
@OpenClaw 幫我調研 {技術主題}：
1. 用瀏覽器搜尋最新的文章、GitHub repo、討論
2. 重點整理：
   - 這個技術解決什麼問題
   - 主流的實作方式
   - 與我的 {專案名} 的相關性
3. 結果寫成 ref-{topic}.md，commit 到 fleet-command
```

### Reddit 技術討論蒐集

```
@OpenClaw 搜尋 Reddit 上關於 {關鍵字} 的最新討論：
- subreddit: r/{subreddit}
- 時間範圍: 過去 30 天
- 整理出 top 5 最有價值的討論串
- 各附上連結和重點摘要
- 回報到 Discord
```

---

## 專案開發輔助類

### Code Review 準備

```
@OpenClaw 幫我準備 skywalker6666/{repo} PR #{number} 的 review：
1. 讀取 PR 的變更檔案清單
2. 檢查是否符合 AGENTS.md 的規範
3. 列出潛在問題或需要注意的地方
4. 回報到 Discord
```

### 文件更新

```
@OpenClaw 更新 skywalker6666/{repo} 的 README.md：
根據最新的 fleet-command/spec-{project}.md，
確保 README 中的以下資訊是最新的：
- 專案簡介
- 技術棧
- 安裝/執行步驟
- 目前狀態

做完後開 PR，branch: agent/update-readme
```

---

## TechTrend 專屬

### 週刊素材蒐集

```
@OpenClaw 幫 TechTrend 蒐集本週素材：
1. 瀏覽以下來源，找出過去 7 天最值得報導的技術新聞：
   - Hacker News top stories
   - r/programming, r/machinelearning
   - GitHub Trending
2. 每則附上：標題、連結、一句話摘要、與 B2B 的相關性
3. 整理成 url-techtrend-{YYYY-WXX}.txt（一行一條 URL）
4. commit 到 fleet-command
```

---

## 跨專案整合類

### 整合點驗證

```
@OpenClaw 驗證 {專案A} → {專案B} 的整合路徑：
（參考 fleet-command README 的跨專案整合段落）
1. 確認 {專案A} 的輸出格式
2. 確認 {專案B} 的輸入期望
3. 檢查是否有 API 契約或共用 schema
4. 列出缺少的部分
5. 在 fleet-command 開 Issue 追蹤
```

---

## 使用注意事項

- 指令中的 `{變數}` 請替換為實際值再發送
- 涉及 code 變更的指令，agent 會走 PR 流程，不會直接 push main
- 大型任務建議拆成多個小指令，方便追蹤
- 如果 agent 回報不確定的事，先暫停，你確認後再繼續

---

*模板持續擴充中。有新的常用指令模式時，加到這裡。*
