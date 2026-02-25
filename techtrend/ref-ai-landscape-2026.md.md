# 🧠 AI 業界完整版圖 — 2026 年 2 月最新

> 依照 Alan 專案需求整理：模型商、AI 開發工具、創意生成工具、自動化平台
> ⚠️ 所有工具若用於商業化專案，需注意授權/版權/API ToS

---

## 一、基礎模型商 (Foundation Model Providers)

### 1.1 閉源 / 商業 API

| 公司 | 旗艦模型 | 特色 | 定價層級 | 與你專案的關聯 |
|------|---------|------|---------|--------------|
| **OpenAI** | GPT-5.2 (400K context), o3/o4-mini (reasoning) | 最大生態系、function calling 成熟、GPT-oss 開源系列 | API pay-per-token / Plus $20/mo / Pro $200/mo | CardSense 可考慮 structured output; 你已有 Plus 訂閱 |
| **Anthropic** | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 | 長文理解、安全對齊、推理透明度、MCP 協議 | API pay-per-token / Pro $20/mo / Code Pro | SEEDCRAFT 主力 (Sonnet coaching); 你已有 Pro 訂閱 |
| **Google DeepMind** | Gemini 3 Pro (1M context), Gemini 3 Flash, Nano Banana (圖像) | 多模態原生、Deep Think 推理、Vertex AI 企業部署 | API via Vertex / AI Studio 免費額度 / Pro $20/mo | Review Trust Analyzer 用 AI Studio 免費額度; 你已有 Pro 訂閱 |
| **Mistral AI** | Mistral Large 3 (675B MoE), Devstral Medium, OCR 3 | 歐洲主力、MoE 高性價比 (GPT-5.2 92%性能 / 15%價格)、強 OCR | API pay-per-token / Le Chat 免費 | CardSense 銀行文件 OCR 備選方案 |
| **DeepSeek** | V3.2-Exp, R1 系列 (推理) | 中國最強開放模型、Fine-Grained Sparse Attention、超低價 ($0.07/M tokens w/ cache) | API 極低價 | 成本敏感場景的備選；需注意中國數據法規 |
| **xAI** | Grok 3 | 即時資訊存取 (X/Twitter 整合)、Colossus 算力叢集 | API / X Premium | 社群輿情分析備選 |
| **Cohere** | Command R+, Embed v4 | 企業 RAG 最佳化、多語言嵌入 | API pay-per-token | Review Trust Analyzer embedding 備選 |
| **AI21 Labs** | Jamba 2 (SSM-Transformer 混合) | 長文處理高效、非 Transformer 架構 | API | 特殊架構研究參考 |

### 1.2 開源 / 可自部署模型

| 模型 | 參數量 | 授權 | 特色 | 適用場景 |
|------|--------|------|------|---------|
| **Meta Llama 4** (Scout / Maverick) | Scout ~17B / Maverick ~400B MoE | Meta Community License | 多模態、邊緣+雲端雙版本 | 可自部署的通用模型 |
| **OpenAI GPT-oss** (120B / 20B) | 120B / 20B | Apache 2.0 | 工具呼叫優化、可跑消費級硬體 | Agent workflow、function calling |
| **Mistral 開源系列** | Mixtral 8x22B, Ministral 3B/8B, Pixtral 12B | Apache 2.0 | MoE 架構、邊緣可用 | 本地推理、邊緣設備 |
| **DeepSeek 開源** | V3 / R1 系列 | MIT | 推理能力強、可商用 | 成本敏感自部署 |
| **Qwen 2.5** (阿里) | 多規格 (0.5B~72B) | Apache 2.0 | 中文能力強、多模態 | 中文/台灣市場專案 |
| **Google Gemma 3** | 多規格 | 開放權重 | 輕量、行動端可用 | 行動端/IoT |

---

## 二、AI 開發工具 (Developer Tools)

### 2.1 AI 程式碼助手 / IDE

| 工具 | 類型 | 模型支援 | 價格 | 特色 |
|------|------|---------|------|------|
| **Cursor** | AI-native IDE (VSCode fork) | 多模型切換 | Free + Pro $20/mo | 多行預測、自然語言→程式碼、Agent 模式 |
| **GitHub Copilot** | IDE 外掛 | GPT-4 系列 + Claude | Free (限制) / Pro $10/mo / Business $19/mo | 最大用戶基數、Copilot Workspace |
| **Claude Code** | CLI Agent | Claude 系列 | 包含在 Claude Pro/Code Pro | 終端機原生、git-aware、完整檔案操作 |
| **Windsurf** (Cognition) | AI-native IDE | 多模型 | Free (BYOK) + Pro plan | Cascade agent 流程、被 Cognition 收購 |
| **Aider** | CLI Agent | 多模型 (BYOK) | Free (開源) + API 費 | Git-native、diff-based、結構化重構強 |
| **Cline** | VSCode 外掛 | 多模型 (BYOK) | Free (開源) | 自主 agent、檔案操作、瀏覽器自動化 |
| **Zed** | 高效能編輯器 | 多模型 | Free (開源) | Rust 寫成、極快、AI 內建 |
| **Replit** | 雲端 IDE | Replit AI | Free + Pro $25/mo | 全端雲端開發、即時部署 |
| **Bolt.new** | 瀏覽器 IDE | 多模型 | Pay-per-use | 零設定 MVP 生成 |
| **Lovable (ex-GPT Engineer)** | App 生成器 | GPT 系列 | 訂閱制 | 自然語言→完整 app |
| **Kiro** (AWS) | IDE | Amazon 模型 | 新推出 | Spec-driven 開發、DevOps 自動化 |
| **Tabnine** | IDE 外掛 | 自有模型 | Free / Pro $12/mo | 可自部署、企業隱私 |
| **Qodo** (ex-CodiumAI) | 程式碼品質 | 多模型 | Free + Enterprise | PR review、測試生成、覆蓋率 |

### 2.2 AI Infra / MLOps / 部署

| 工具 | 用途 | 備註 |
|------|------|------|
| **Hugging Face** | 模型 Hub + Inference API + Spaces | 開源生態中心 |
| **Ollama** | 本地模型運行 | 簡化 GGUF 模型管理、OpenAI 相容 API |
| **LM Studio** | 本地模型 GUI | 下載+運行+測試一站式 |
| **vLLM** | 高效推理引擎 | PagedAttention、生產級部署 |
| **LangChain / LangGraph** | LLM 應用框架 | Agent、RAG、chain 編排 |
| **LlamaIndex** | RAG 框架 | 文件索引+檢索最佳化 |
| **Vercel AI SDK** | 前端 AI 整合 | Streaming、Next.js 深度整合；你已用 Vercel |
| **Modal** | Serverless GPU | 按用量計費 GPU 運算 |
| **Replicate** | 模型 API 市場 | 一行程式碼呼叫任何開源模型 |
| **Together AI** | 開源模型 API | 低延遲推理、fine-tuning |
| **Groq** | 超低延遲推理 | LPU 硬體、毫秒級回應 |
| **Fireworks AI** | 模型推理平台 | 快速推理+fine-tuning |
| **AWS Bedrock** | 託管模型 API | 多模型統一存取 |
| **Azure AI Studio** | 微軟 AI 平台 | OpenAI 模型+企業整合 |
| **Google Vertex AI** | Google 雲端 AI | Gemini+自訂模型+MLOps |

---

## 三、自動化與 Agent 平台

| 工具 | 類型 | 價格 | 與你的關聯 |
|------|------|------|-----------|
| **n8n** | 工作流自動化 (自部署) | Free (開源) / Cloud plan | 你已使用；可搭配 OpenClaw |
| **OpenClaw** | Agent 框架 | — | 你的 agent framework；Discord+Notion cron |
| **Zapier** | No-code 自動化 | Free + $19.99/mo+ | 最大整合生態 |
| **Make (Integromat)** | 視覺化自動化 | Free + €9/mo+ | 複雜邏輯分支 |
| **Dify** | LLM App 建構平台 | Free (開源) / Cloud | Agent+RAG+Workflow 一站式 |
| **Flowise** | LLM 拖拉建構 | Free (開源) | LangChain 視覺化 |
| **CrewAI** | Multi-agent 框架 | Free (開源) | Python、角色式 agent |
| **AutoGen** (Microsoft) | Multi-agent 對話 | Free (開源) | 研究級 agent 編排 |
| **Semantic Kernel** (Microsoft) | AI 編排 SDK | Free (開源) | C#/Python/Java、企業整合 |
| **Manus** | 通用 AI Agent | 訂閱制 | 端到端自主任務執行 |

---

## 四、創意生成工具

### 4.1 圖像生成

| 工具 | 模型/技術 | 特色 | 版權注意 |
|------|----------|------|---------|
| **Midjourney** v7 | 自有模型 | 藝術風格王者、圖層編輯、角色一致性 | 商用需 Pro plan ($30/mo+) |
| **Google Imagen 4 / Nano Banana** | Google 模型 | 照片寫實、文字渲染準確、排版精確 | 透過 AI Studio/Vertex |
| **DALL·E 3** | OpenAI | ChatGPT 內建、提示理解強 | 商用權含在 API/Plus |
| **Stable Diffusion 3.5** | Stability AI | 開源、MMDiT 架構、可自部署 | 開源授權、需注意訓練數據 |
| **Flux** (Black Forest Labs) | Flux 1 Kontext Pro | 高品質開源、快速 | 檢查商用授權 |
| **Adobe Firefly** | Adobe 模型 | 商業安全 (訓練數據有版權保護) | CC 訂閱、IP 賠償保護 |
| **Leonardo.AI** | 多模型 | 遊戲/概念藝術、ControlNet 整合 | 訂閱制 |

### 4.2 影片生成

| 工具 | 特色 | 價格帶 |
|------|------|--------|
| **Google Veo 3.1** | 最佳全能、原生音訊+影片、高度寫實 | Google Flow / Vertex |
| **OpenAI Sora 2** | 物理模擬、同步對話+音效、導演級鏡頭感 | ChatGPT Pro / API |
| **Runway Gen-3** | 創作者工具箱、Multi-Motion Brush、VFX 等級 | $15/mo+ |
| **Kling 2.5** (快手) | 高品質、中國市場領先 | 付費計劃 |
| **Seedance 1 Pro** (ByteDance) | 快速生成、音樂同步 | 新推出 |
| **Pika** | 實驗性特效 (融化、擠壓等)、Pikaffects | Free + Pro |
| **HeyGen** | AI 數位人、多語翻譯 (140+語言)、企業溝通 | 訂閱制 |
| **Synthesia** | 企業級 AI 數位人影片 | 企業定價 |
| **LTX Studio** (Lightricks) | 全流程影片製作、多場景、腳本板 | $15/mo+ |
| **Descript** | 影片/Podcast 編輯、文字即影片、多機位 | Free + Pro $24/mo |

### 4.3 音樂 / 音訊生成

| 工具 | 特色 | 版權模式 |
|------|------|---------|
| **Suno** v4 | 文字→完整歌曲 (含人聲)、最受歡迎 | ⚠️ 商用需 Pro；版權爭議中 |
| **Udio** | 高品質音樂生成、風格多元 | ⚠️ 同上，版權爭議 |
| **AIVA** | 古典/配樂、Pro 版移轉完整版權 | Pro 版可完全商用 ✅ |
| **Soundraw** | 自訂音樂、可編輯段落 | 商用授權含在訂閱 |
| **Mubert** | 即時生成背景音樂、API | 商用 API 可用 |
| **Beatoven.ai** | 情境配樂、影片配樂最佳化 | 商用授權含在付費 |
| **ElevenLabs** | 語音合成、語音克隆、多語言 TTS、音效 | 商用需 Scale plan+ |
| **Riffusion** | 音樂生成 | 開源、可自部署 |
| **Stable Audio** | Stability AI 音訊模型 | 檢查授權 |

### 4.4 3D / 空間

| 工具 | 特色 |
|------|------|
| **Meshy** | 文字/圖片→3D 模型 (PBR 材質)、<1分鐘 |
| **Tripo** | 高品質 3D 生成 |
| **Luma AI (Genie)** | 3D 場景/物件生成 |
| **Spline AI** | 互動式 3D 設計 |

---

## 五、生產力 / 知識工具

| 工具 | 類型 | 特色 |
|------|------|------|
| **Microsoft Copilot** | 辦公套件 AI | Excel Python、Teams 摘要、SharePoint agents |
| **Google Gemini** (Workspace) | 辦公套件 AI | Docs/Sheets/Gmail/Drive 跨產品整合 |
| **Notion AI** | 知識管理 | Q&A、寫作、資料庫查詢 |
| **NotebookLM** (Google) | 文件分析 | Audio Overviews (Podcast 式摘要) |
| **Perplexity** | AI 搜尋 | 即時引用、深度研究模式 |
| **Granola** | 會議筆記 | AI 自動摘要 |
| **Otter.ai** | 會議轉錄 | 即時字幕、摘要 |
| **Gamma** | AI 簡報 | 文字→簡報、單頁式設計 |

---

## 六、安全與程式碼品質

| 工具 | 用途 |
|------|------|
| **Snyk** | 依賴/容器/IaC 漏洞掃描 |
| **SonarQube** | 程式碼品質+安全分析 |
| **Semgrep** | 靜態分析、自訂規則 |

---

## 七、與你專案的對照矩陣

| 專案 | 當前使用 | 建議補強/備選 |
|------|---------|-------------|
| **CardSense** | 規則式系統、PostgreSQL | Mistral OCR 3 (銀行文件解析)、Groq (低延遲推薦回應) |
| **Review Trust Analyzer** | Google AI Studio (Gemini Flash) | Cohere Embed v4 (評論向量化)、DeepSeek R1 (推理評分) |
| **SEEDCRAFT** | Claude Sonnet (教練)、Gemini Flash (內容) | ElevenLabs (語音互動)、Imagen 4 (原創教材圖片) |
| **OpenClaw** | n8n + Discord/Notion | CrewAI (multi-agent 進階)、Dify (視覺化 agent 管理) |
| **Japan Trip OS** | 計畫中 | Google Veo (旅遊影片)、Midjourney (行程視覺化) |
| **Smart Menu Decision** | 計畫整合 CardSense | GPT-5 Vision (菜單 OCR)、Imagen 4 (菜品圖生成) |
| **TechTrend Briefing** | 探索中 | Perplexity API (即時資訊)、NotebookLM (報告生成) |

---

## 八、關鍵版權/IP 注意事項

| 風險類別 | 說明 | 建議措施 |
|---------|------|---------|
| **模型輸出版權** | 各平台 ToS 不同；部分不授予輸出版權 | 逐一檢查 ToS；優先選 Adobe Firefly / AIVA Pro 等明確授權者 |
| **訓練數據爭議** | Suno/Udio 面臨版權訴訟、SD 訓練數據爭議 | 商業產品避免直接依賴有訴訟風險的工具生成內容 |
| **API ToS 限制** | 部分 API 禁止用於特定用途 (如金融建議) | CardSense 規則式架構正確——避免 LLM 直接產生金融建議 |
| **開源授權合規** | Apache 2.0 / MIT 商用友善；Meta Community License 有限制 | 確認每個使用的開源模型授權條款 |
| **用戶生成內容** | 用戶上傳的資料可能包含版權內容 | 建立 ToS + 內容過濾機制 |

---

*最後更新：2026/02/24 | 基於公開資料整理，價格與功能可能隨時變動*
