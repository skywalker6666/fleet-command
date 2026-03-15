# CLAUDE.md — Claude Code 專案指引

> 本檔案供 Claude Code CLI 讀取，幫助 Claude 理解專案 context。  
> 放在各 code repo 的根目錄。  
> 請根據各專案實際情況填入 {變數} 區塊。

---

## 專案概述

**名稱**: {專案名稱}  
**定位**: {一句話描述}  
**完整 Spec**: 見 [fleet-command/spec-{project}.md](https://github.com/skywalker6666/fleet-command)  

## 技術棧

- **語言**: {語言}
- **框架**: {框架}
- **資料庫**: {DB}
- **部署**: {部署方式}
- **其他**: {其他重要工具}

## 專案結構

```
{project}/
├── src/          # {說明}
├── tests/        # {說明}
├── docs/         # {說明}
├── CLAUDE.md     # 本檔案
├── AGENTS.md     # Agent 操作規則
└── README.md
```

## 開發規範

- **Commit message**: `{type}: {description}`（type: feat/fix/docs/refactor/test/chore）
- **Branch 命名**: `feature/{description}` 或 `fix/{description}`
- **Agent branch**: `agent/{description}`（見 AGENTS.md）
- **測試**: {測試框架和覆蓋率要求}
- **程式碼風格**: {linter/formatter}

## 重要的架構決策

參見 fleet-command 中的：
- `spec-{project}.md` — 完整規格書
- `arch-*.md` — 相關架構文件
- 本 repo 的 `docs/decisions/`（如有 ADR）

## 目前狀態

**進度**: {Sprint X / 規劃中 / V1 完成}  
**最新里程碑**: {描述}  
**待辦**: 見 GitHub Issues  

## 跨專案整合

{列出與其他專案的整合關係，參考 fleet-command README 的跨專案整合段落}

## 注意事項

- {任何 Claude Code 操作時需要特別注意的事}
- {例：某些檔案不要動、某些 API key 在 .env 中需要手動設定}
- {例：測試需要先啟動本地 DB}

---

*配合 fleet-command/spec-{project}.md 閱讀。有疑問時優先參考 spec。*
