# arch-agent-blueprint — Computer Agent 安全架構藍圖 v1.0

> **用途**: 個人 Side Project 開發輔助（六專案共用基礎設施）  
> **環境**: Windows + WSL（家用主機）｜公司 Windows（僅人工/coding agent 推 code）  
> **核心原則**: 安全隔離 → 資訊整合 → 自主執行 → 快速疊代  
> **月成本**: ChatGPT Plus $20 + Claude Pro $20 + Copilot Premium（公司出）= ~$40 個人支出  

---

## 1. 系統架構

```
┌──────────────────────────────────────────────────────────────┐
│                  家用主機 (Windows + WSL)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │             Docker 隔離層（安全邊界）                     │  │
│  │                                                        │  │
│  │  OpenClaw Gateway ── Sandbox Browser ── Egress Proxy   │  │
│  │  (ChatGPT Codex)    (獨立 Chromium)    (域名白名單)     │  │
│  │                                                        │  │
│  │  Agent Credential Store（加密，與個人 token 隔離）       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Claude Code CLI ── Claude Desktop ── 個人機敏區（隔離）      │
│  (Claude Pro)        (MCP 整合)       ~/.ssh/ 等不可觸及     │
└──────────────────────┬───────────────────────────────────────┘
                       │ Discord 指令通道
┌──────────────────────┴───────────────────────────────────────┐
│  公司電腦: Discord + Copilot Premium + Antigravity            │
│  ❌ 不裝 agent  ❌ 不存 token  ❌ 不碰公司程式碼               │
└──────────────────────────────────────────────────────────────┘
```

## 2. 工具鏈分工

| 工具 | 場景 | LLM 來源 | 主要用途 |
|------|------|---------|---------|
| OpenClaw | 家裡 WSL Docker | ChatGPT Plus / Codex | 瀏覽器操作、自動化、agent 帳號管理 |
| Claude Code CLI | 家裡 WSL | Claude Pro | 深度開發、debug、重構、Git 操作 |
| Claude Desktop | 家裡 | Claude Pro | MCP 整合、諮詢規劃、文件產出 |
| 網頁版 Claude | 任何地方 | Claude Pro | 即時諮詢、架構討論 |
| Copilot Premium | 公司電腦 | 公司 (300點/月) | 在公司推 side project code |
| Antigravity | 兩邊都可 | Gemini 3 (免費) | Manager View 平行 agent、快速 prototype |
| 網頁版 GPT | 任何地方 | ChatGPT Plus | 備用諮詢 |

## 3. 安全沙箱配置

### 3.1 機敏資訊保護

| 類別 | 風險 | 策略 |
|------|------|------|
| SSH keys / 個人 GitHub PAT / API tokens | 🔴 極高 | 永不掛載進 agent 容器 |
| 身分證號、信用卡、銀行帳密 | 🔴 極高 | 不在 WSL 環境存放 |
| 公司程式碼、內部文件 | 🔴 極高 | 只存在公司電腦，agent 不碰 |
| 瀏覽器 cookies / passwords | 🟠 高 | Agent 用 Docker 內獨立 Chromium |
| Agent 自身的 token | 🟡 中 | 加密存放，僅注入 Docker env |

### 3.2 OpenClaw Docker 配置

```yaml
agents:
  defaults:
    sandbox:
      mode: "all"
      docker:
        image: "openclaw-sandbox:bookworm-slim"
        network: "none"           # 預設無外網
        readOnlyRoot: true
        workspaceAccess: "rw"
        binds: []                 # 不掛載主機路徑
      browser:
        autoStart: true
        docker:
          network: "openclaw-sandbox-browser"
```

### 3.3 Egress Proxy 白名單

```
✅ .github.com, .githubusercontent.com
✅ .googleapis.com, accounts.google.com
✅ api.openai.com, auth.openai.com
✅ .reddit.com, .leetcode.com
✅ registry.npmjs.org
❌ 其餘全部阻擋
```

### 3.4 絕對禁止掛載

```
❌ ~/.ssh/          ❌ ~/.gitconfig      ❌ ~/.config/
❌ /mnt/c/Users/    ❌ ~/.gnupg/         ❌ ~/.aws/
❌ /var/run/docker.sock （容器逃逸風險）
```

## 4. Agent 身份

| 平台 | 帳號 | 用途 | 權限 |
|------|------|------|------|
| Gmail | `{name}.agent@gmail.com` | 註冊信箱 | — |
| GitHub | `{name}-agent` | Push / PR / Issues | Fine-grained PAT, 僅限指定 repo, Write 權限 |
| Reddit | `{name}_agent` | 搜尋技術資料 | 以唯讀為主 |
| LeetCode | `{name}-agent` | 刷題 | 獨立帳號 |

**GitHub Agent PAT 權限（最小化）：**
- ✅ Contents: Read/Write
- ✅ Pull requests: Read/Write
- ✅ Issues: Read/Write
- ✅ Metadata: Read
- ❌ Administration, Secrets, Webhooks, Actions: 不給

**Token 輪換：每 90 天**

## 5. 資訊整合策略

### fleet-command 作為中央真相來源

```
fleet-command (規格書庫)
├── spec-*.md          ← 各專案規格
├── arch-*.md          ← 架構文件（含本藍圖）
├── prompt-agent-*.md  ← Agent 指令模板
├── AGENTS.md          ← Agent 操作規則（全域）
├── agent-log/         ← Agent 操作日誌
└── ref-*.md           ← 參考資料

各 Code Repo
├── CLAUDE.md          ← Claude Code 專案指引（指向 fleet-command spec）
├── AGENTS.md          ← Agent 操作規則（repo 專屬）
└── 程式碼...
```

### 資訊同步流程

1. 改 spec → commit to fleet-command → 各工具下次讀 repo 時自動取得
2. Agent 完成任務 → 寫 agent-log → 開 PR（如有 code changes）
3. 你在公司推 code → 回家後 Claude Code / OpenClaw 讀最新狀態接續
4. Claude Project Knowledge 同步自 fleet-command（手動或未來 GitHub Action）

## 6. 遠端操作

### Discord → OpenClaw

- 建立私人 Discord server，專用頻道（#general, #agent-log, #approvals）
- Bot 只允許你的 Discord ID 下指令
- 群組需 @mention 才回應
- 關鍵操作走 exec approval（頻道中顯示核准按鈕）

### 公司電腦

- ✅ Discord（下指令給家裡 OpenClaw）
- ✅ Copilot Premium / Antigravity（推 code，用你個人 GitHub）
- ❌ 不裝 agent、不存 token

## 7. 人機協作模式

| 複雜度 | 模式 | 範例 |
|--------|------|------|
| 🟢 低 | Agent 自主，事後 review | 更新 README、整理 Issues |
| 🟡 中 | Agent 提案，你核准 | 開 PR、修改架構、裝 dependency |
| 🔴 高 | 你主導，Agent 輔助 | 架構設計、重構核心、安全變更 |

## 8. Computer Agent 操作 Code Agent

**短期：不做。** 兩層 agent 疊加的成本和不穩定性 > 收益。  
**中期：** OpenClaw 開 Issue → 你決定 → Claude Code 處理。間接協作。  
**長期：** 觀察 OpenClaw skill 生態和 Claude Code MCP 整合發展。

## 9. 緊急處置

```
Agent credentials 疑似洩漏：
  1. 立即 revoke agent GitHub 所有 token
  2. 停止 OpenClaw gateway
  3. 檢查 agent 操作日誌
  4. 產生新 token → 重啟

Agent 行為異常：
  1. Discord 發 /stop
  2. docker stop $(docker ps -q --filter name=openclaw)
  3. 檢查 agent-log/ 和 session 記錄
```

---

*v1.0 | 2026-03-16 | 下次 review: 2026-04-16*
