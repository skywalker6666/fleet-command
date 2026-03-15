# ref-agent-cron — OpenClaw 排程任務配置參考

> OpenClaw 支援 cron 定時任務。本文件記錄建議的排程配置。  
> 注意：每次 cron 觸發都會消耗 ChatGPT Codex 額度，控制頻率。

---

## 建議排程

### 每日專案狀態（低消耗）

```yaml
cron:
  jobs:
    - name: "daily-project-status"
      schedule: "0 9 * * *"  # 每天 09:00
      task: |
        檢查以下 GitHub repo 的狀態並產生簡報：
        - skywalker6666/cardsense-api
        - skywalker6666/review-trust-analyzer
        - skywalker6666/seedcraft
        
        列出：
        1. 過去 24 小時新的 commit（數量 + 摘要）
        2. 開放中的 PR
        3. P0/P1 Issues
        
        結果發送到 Discord #agent-log 頻道。
        同時寫入 fleet-command/agent-log/ 今天的日期。
      agent: "default"
      channel: "discord"
```

### 每週進度回顧（中消耗）

```yaml
    - name: "weekly-review"
      schedule: "0 10 * * 1"  # 每週一 10:00
      task: |
        產生本週進度回顧：
        1. 過去 7 天所有 skywalker6666 repo 的 commit 統計
        2. 新開和關閉的 Issues/PR
        3. 各專案進度與 fleet-command 中 spec 的對比
        4. 建議下週優先事項
        
        寫成 fleet-command/agent-log/weekly-{YYYY-WXX}.md
        摘要發送到 Discord #agent-log
      agent: "default"
      channel: "discord"
```

### TechTrend 素材蒐集（高消耗，視需求開啟）

```yaml
    - name: "techtrend-weekly-sources"
      schedule: "0 8 * * 5"  # 每週五 08:00
      task: |
        蒐集本週技術新聞素材：
        1. 瀏覽 Hacker News top stories (過去 7 天)
        2. 瀏覽 r/programming, r/machinelearning
        3. 檢查 GitHub Trending
        4. 每則附上：標題、URL、一句話摘要
        5. 寫成 fleet-command/url-techtrend-{YYYY-WXX}.txt
      agent: "default"
      channel: "discord"
```

---

## 額度管理

| 排程 | 頻率 | 預估 token 消耗/次 | 月消耗 |
|------|------|-------------------|--------|
| 每日狀態 | 30次/月 | ~2K tokens | ~60K |
| 每週回顧 | 4次/月 | ~5K tokens | ~20K |
| TechTrend 蒐集 | 4次/月 | ~8K tokens | ~32K |
| **合計** | | | **~112K tokens/月** |

ChatGPT Plus 的 Codex 額度應足夠覆蓋。如果接近上限：
1. 先停 TechTrend 蒐集（手動執行即可）
2. 每日狀態改為工作日才跑（22次/月）
3. 最後才考慮停每週回顧

---

## 開啟 / 關閉排程

```bash
# 查看現有排程
openclaw cron list

# 暫停特定排程
openclaw cron pause daily-project-status

# 恢復
openclaw cron resume daily-project-status

# 手動觸發（測試用）
openclaw cron trigger daily-project-status
```

---

*排程配置存在 OpenClaw config 中，不在 fleet-command repo 內。  
本文件僅作為參考和記錄。*
