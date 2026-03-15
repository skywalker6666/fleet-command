# ref-agent-workflow — Agent 工作流程參考

> 說明各 AI 工具如何與 fleet-command 及各 code repo 互動。  
> 供主人參考，也供 agent 理解自己在生態系中的定位。

---

## 1. fleet-command 在生態系中的角色

```
fleet-command = 指揮中心
├── 定義「做什麼」（spec-*.md）
├── 定義「怎麼做」（arch-*.md）
├── 定義「agent 能做什麼」（AGENTS.md）
├── 提供「任務指令」（prompt-agent-*.md）
├── 記錄「做了什麼」（agent-log/）
└── 同步到 Claude Project Knowledge

各 code repo = 執行單位
├── 包含實際程式碼
├── 有自己的 CLAUDE.md（Claude Code 讀）
├── 有自己的 AGENTS.md（精簡版，指向 fleet-command）
└── 透過 Git 與所有工具同步
```

## 2. 各工具的讀寫關係

| 工具 | 讀 fleet-command | 寫 fleet-command | 讀 code repo | 寫 code repo |
|------|-----------------|-----------------|-------------|-------------|
| OpenClaw | ✅ spec, AGENTS.md | ✅ agent-log/ | ✅ 全部 | ✅ feature branch + PR |
| Claude Code CLI | ✅ spec, CLAUDE.md | ✅ docs/ (手動) | ✅ 全部 | ✅ 直接 commit (你在操作) |
| Claude Desktop | ✅ 全部 (MCP) | ✅ 透過你操作 | ✅ MCP | ❌ 不直接寫 |
| 網頁版 Claude | ✅ Project Knowledge | ❌ | ❌ | ❌ |
| Copilot | ❌ (公司電腦) | ❌ | ✅ clone 後 | ✅ 直接 commit (你在操作) |
| Antigravity | ✅ 開目錄時讀 | ❌ | ✅ 全部 | ✅ 直接 commit (你在操作) |

## 3. 典型工作日流程

### 早上（在家，出門前）

```
1. OpenClaw 自動 cron → 每日狀態彙報 → Discord #agent-log
2. 你看一眼 Discord，了解昨晚 agent 做了什麼（如有排程任務）
3. 如果有 PR 等你 review → 快速處理或標記稍後
```

### 白天（在公司）

```
4. 用 Copilot Premium / Antigravity 推 code（你的個人帳號）
5. 有想到要 agent 做的事 → Discord 下指令給 OpenClaw
6. OpenClaw 在家裡執行 → 結果回報 Discord
7. 需要深度思考的問題 → 網頁版 Claude（如本對話）
```

### 晚上（在家）

```
8. git pull 最新 code（包含白天自己和 agent 的變更）
9. 用 Claude Code CLI 做深度開發
10. Review agent 的 PR → merge 或要求修改
11. 如果產出了新的架構決策 → 寫 ADR 到 fleet-command/docs/decisions/
12. 更新 spec（如果方向有調整）→ commit to fleet-command
```

### 週末

```
13. OpenClaw 自動產生週報 → fleet-command/agent-log/
14. 回顧一週進度，調整開發優先序
15. 如果 Antigravity 適合 → 用 Manager View 平行跑幾個獨立任務
```

## 4. 跨專案整合的 Agent 協作

fleet-command README 定義的五條整合路徑，agent 可以協助驗證：

```
SmartChoice → CardSense    : agent 檢查 API 契約是否對齊
SmartChoice → RTA          : agent 檢查評論 API 的輸入輸出格式
FridgeManager → SmartChoice : agent 驗證食材 → 推薦的資料流
FridgeManager → CardSense   : agent 驗證採購 → 最優卡的介面
SEEDCRAFT → RTA            : agent 驗證補習班 → 評論的串接
```

每條路徑的驗證結果記錄在 `agent-log/` 中。

## 5. Claude Project Knowledge 同步流程

目前（手動）：
```
1. 更新 fleet-command 中的 spec
2. 手動上傳到 Claude Project Knowledge
```

未來（自動化，待實作）：
```
1. 更新 fleet-command 中的 spec
2. git push 觸發 GitHub Action
3. Action 呼叫 Claude API 更新 Project Knowledge
```

## 6. 新專案加入流程

當你要加入第七個、第八個 side project 時：

```
1. 在 fleet-command 建立 spec-{new-project}.md
2. 建立 code repo: skywalker6666/{new-project}
3. 在 code repo 中放入 CLAUDE.md 和 AGENTS.md（從模板複製）
4. 在 fleet-command README 的專案總覽表中新增一行
5. 評估跨專案整合路徑，更新整合段落
6. 在 Agent GitHub PAT 中加入新 repo 的存取權
7. 更新 egress proxy 白名單（如果新 repo 需要新的外部 API）
8. 通知 agent（Discord 或更新 AGENTS.md 的操作範圍表）
```

---

*與 arch-agent-blueprint.md 配合閱讀。*
