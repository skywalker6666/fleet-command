# AGENTS.md — Agent 操作規則（全域）

> 本文件定義所有 AI agent 操作 fleet-command 及其子專案時的規則。  
> 適用於：OpenClaw、Claude Code CLI、Copilot、Antigravity 及任何未來的 agent。

---

## Agent 身份

- **Agent GitHub 帳號**: `{owner}-agent`（非主人帳號）
- **所有 agent 產生的 commit 必須使用 agent 帳號**，不可冒用主人帳號
- Agent 的 commit message 格式：`[agent] {type}: {description}`
  - 例：`[agent] feat: 更新 CardSense API spec 中的 endpoint 定義`
  - 例：`[agent] docs: 整理 RTA v1 架構決策記錄`

---

## 權限邊界

### ✅ 允許

- Push 到 feature branches（命名：`agent/{task-description}`）
- 開 Pull Request，附上變更摘要
- 建立、更新、關閉 Issues
- 更新 README.md、docs/ 目錄下的文件
- 寫入 agent-log/ 目錄
- 讀取所有 spec-*.md、arch-*.md、ref-*.md

### ❌ 禁止

- Push 到 `main` branch（必須走 PR → 主人 review → merge）
- Merge 任何 PR（僅主人可 merge）
- 刪除 branch、tag、release
- 修改 GitHub Actions / CI/CD 設定
- 修改 repo Settings（collaborators, branch protection 等）
- 修改本文件（AGENTS.md）或安全相關設定
- 存取、複製、引用公司程式碼或內部文件
- 接觸主人的個人 credentials（SSH keys, 個人 PAT 等）

---

## 各專案操作範圍

| Repo | Agent 可做的事 | Agent 不可做的事 |
|------|---------------|-----------------|
| fleet-command | 更新 agent-log/、建議 spec 修改（走 PR） | 直接修改 spec-*.md 的 main branch |
| cardsense-* | Feature branch 開發、寫測試、更新文件 | 修改 DB migration、CI config |
| review-trust-analyzer | 同上 | 修改 model training config |
| seedcraft | 同上 | 修改 LINE channel 設定 |
| techtrend | 同上 | 修改 Stripe 付款設定 |
| smartchoice | 同上 | 修改 Google Maps API key 設定 |
| fridgemanager | 同上 | 修改 push notification 設定 |

---

## 工作流程

### 標準任務流程

```
1. 讀取 fleet-command 中的相關 spec-*.md，了解專案全貌
2. 讀取目標 repo 的 CLAUDE.md，了解技術棧和開發規範
3. 建立 feature branch: agent/{任務描述}
4. 執行任務（寫 code / 更新文件 / 其他）
5. 寫入操作日誌到 fleet-command/agent-log/YYYY-MM-DD.md
6. 開 PR，附上：
   - 變更摘要（做了什麼、為什麼）
   - 影響範圍（哪些檔案、哪些功能）
   - 待主人確認的事項（如果有）
7. 等待主人 review → merge 或要求修改
```

### 跨專案任務

涉及多個 repo 的任務（例如跨專案整合）：

```
1. 先在 fleet-command 開 Issue 描述任務全貌
2. 各 repo 分別開 feature branch
3. 各 repo 分別開 PR，互相引用
4. 主人統一 review 後依序 merge
```

---

## 日誌規範

每次 agent 操作結束後，寫入 `agent-log/YYYY-MM-DD.md`：

```markdown
## HH:MM — {任務標題}

- **Agent**: OpenClaw / Claude Code / Copilot
- **Repo**: {目標 repo 名稱}
- **任務**: {簡述做了什麼}
- **結果**: {成功/部分完成/失敗}
- **PR**: #{PR 編號}（如有）
- **備註**: {遇到的問題或需要主人注意的事}
```

---

## 安全規則

1. **絕不在 commit 中包含任何 credentials**（token, password, API key）
2. **絕不修改 .gitignore 來取消忽略敏感檔案**
3. **發現疑似安全問題時，立即停止操作並在 Discord 回報**
4. **不主動安裝未經主人核准的第三方 dependency**
5. **不執行 `rm -rf`、`DROP TABLE` 等破壞性操作，除非 PR 中明確說明**

---

## 與主人的溝通

- **日常回報**: 透過 agent-log/ 和 PR description
- **需要核准**: 透過 Discord #approvals 頻道
- **緊急問題**: 透過 Discord #general 頻道直接通知
- **不確定的事**: 寧可問，不要猜。開 Issue 或 Discord 詢問。

---

*本文件由主人維護，agent 不可自行修改。*
