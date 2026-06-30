# Agent Driven Archive

[English README](./README.md)

`Agent Driven Archive` 是一个可复用的 online archive 搭建与维护 workflow，通过研究者与 AI Agents 的深度协作，实现低成本，低技术门槛的数字人文平台搭建。

它覆盖从 primary sources 到公开 online archive 的完整工作流和基础架构，适合作为可复刻、可扩展、可公开发布的基础仓库，让你的项目不必从零开始。

本仓库是柏林自由大学26年夏季学期课程 [Digital Humanities and Data Sustainability](https://14141-dh-sustainability.github.io/) 的最终成果。基于此仓库构建的数字人文项目 Stylus Nexus (Beta vO.1.1) 已经上线，可供访问。

## 设计初衷

设计本项目的初衷，是希望借由与 AI Agents 深度协作，让个人线上数字人文项目的搭建与维护成本更低、技术门槛更低，且更可持续。

应用这套项目管线的预期是：

- 面向人文社科研究者、策展人和小规模项目维护者的低技术门槛
- 除去 server 成本和 AI token/订阅 成本之外，整体 workflow 基本接近零成本，server 成本通常可以通过学生优惠、教育额度或低成本 hosting 尽量压低，乃至免费
- 通过与 AI Agents 协作，可以实现单人搭建+维护全流程handle，且 Agents 行为可自定义，大幅减少人力和沟通成本。

## 项目目的

这个仓库主要服务于以下流程：

1. 收集和整理 primary sources
2. 通过与 Agent 协作，利用Skill和脚本等工具将扫描件或原始文件转换为可编辑的 Markdown，清洗、规范化并结构化内容记录
4. 将输出组织为可复用的内容模块，例如 source records、interpretive writing、event or place materials 和 relationship data
5. 生成 manifest、search index 和 SQLite-ready data
6. 构建并发布可公开访问的 archive
7. 在后续维护中接入 AI-assisted workflow

重点覆盖完整 pipeline，包括内容处理、结构化、导出与展示。

## 适用对象

- 人文社科研究者（主要）
- 策展人
- 档案管理者
- 围绕单一主题语料搭建知识站点的个人维护者

## 仓库包含内容

- `workspace/` 下的可复用工作区骨架
- 面向 source records、文章、时空材料和关系数据的 Markdown 模板
- 用于校验、导出 manifest、构建 search index 的 starter scripts
- 可复用的本地 OCR 与 PDF translation workflow skill 示例
- 零依赖的 demo site 生成器和本地预览服务
- 基于 SQLite 的 contribution-agent starter
- 位于 `docs/` 下的 workflow、architecture、RAG、发布准备与工具文档

## 主要技术栈

### 基础工作管线层

- Node.js 22+
- Python 3.11+
- Obsidian
- Markdown + YAML frontmatter
- JSON
- SQLite

### Agents Workflow 层

经实际操作，可通过最低 2.5 个Agents实现

- 一个 building-side coding agent，例如：`Claude Code`、`Codex`、`Cursor`
- 一个 server-side assistant agent，例如：`OpenClaw`、`Hermes`
- 一个产品内部的 semi-agent，类chatbot，可接入API/代理，可调用自定义Prompt，Skill和Tool，在这个 workflow 中就是：`AI Sidebar`

### 公共站点模式

- Next.js
- React
- TypeScript
- Tailwind CSS

### 可选扩展

- Dataview Plugin + Templater Plugin
- 基于本地/云端 OCR model 的 OCR workflow
- 基于本地/云端 translation model 的 data translation workflow
- 基于本地/云端 embedding model 的 LightRAG 架构 或其他 retrieval layer 的 RAG workflow
- Leaflet 等 map/timeline 模组

这个仓库不绑定某一种部署方式。reverse proxy、scheduler、process manager 和 hosting provider 都可以替换。

## 仓库结构

```text
docs/                    项目文档、工作流说明、架构与路线图
templates/               可复用内容模板
workspace/               起步内容工作区
scripts/                 校验、导出、demo、OCR 与工具脚本
skills/                  本地 workflow skill 示例
server/                  contribution-agent starter
generated/               生成产物
runtime/                 本地运行时产物
```

## 快速开始

### 1. 安装前置环境

- Node.js 22 或更新版本
- Python 3.11 或更新版本
- 一个 coding agent，推荐 `Codex`，Desktop APP 开箱即用，可在VSCode和其他终端中调用 CLI/插件
- 如果你计划部署自动维护工作流，还需要一个 server-side assistant agent，推荐 `Hermes`，较为轻量，可以通过微信管理。

### 2. 启动 demo

```bash
npm run demo:start
```

这条命令会依次执行：

1. 校验 workspace 结构
2. 生成 source manifest
3. 构建 starter search index
4. 渲染静态 demo site
5. 在本地启动预览服务

### 3. 替换示例内容

用你自己的语料替换 `workspace/` 下的示例内容。

工作区结构可以按项目需要调整；调整后请同步更新 `archive.config.json` 或 `archive.config.example.json` 中的 `workspaceValidation.requiredPaths`，让 `npm run check:workspace` 校验的是你的实际结构。如果你也调整 `routeBase`，请保持它是类似 `/archive/viewer` 这样的根路径子路径，并且不要带尾斜杠；starter demo 首页已经占用了 `/`。常见内容包括：

- source records 与 cleaned texts
- essays、notes 或 interpretive writing
- event or place materials
- relationship 或 graph data
- source inventory 与 metadata

### 4. 内容更新后重新构建

```bash
npm run build:all
npm run demo:render
```

## 主要命令

```bash
npm run check:workspace
npm run export:manifest
npm run build:search
npm run build:all
npm run demo:render
npm run demo:serve
npm run demo:start
npm run contrib:init-db
npm run contrib:serve
npm run contrib:review
npm run contrib:mail
```

## 使用手册

### 搭建一个新的 archive topic

1. 明确主题、范围与 source types
2. 将 primary sources 放入你自己的 intake 流程
3. 将原始材料转成 Markdown 记录
4. 清洗文本并规范化 metadata
5. 准备项目所需的内容模块，例如 essays、event-place materials 或 relationship records
6. 导出 manifest 和 search data
7. 本地预览 archive
8. 用你自己的技术栈部署 public app

### 接入 AI-assisted workflow

这个 starter 已经为下列方向预留了结构：

- 2.5 Agents workflow 结构
- OCR cleanup
- translation support
- citation-aware sidebar 交互
- contribution intake and review
- 基于本地 embedding 的 retrieval 规划
- retrieval-oriented extension

对于不想写太多自定义代码的项目文档管理，`Obsidian APP + Dataview & Templater Plugins` 也是推荐的 workflow layer，低代码且操作更为直观，且Agent可以直接接入，形成实时闭环。

对应文档见：

- [docs/WORKFLOW.md](./docs/WORKFLOW.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/RAG_STRATEGY.md](./docs/RAG_STRATEGY.md)
- [docs/CONTRIBUTION_AGENT_MODULE.md](./docs/CONTRIBUTION_AGENT_MODULE.md)

## 文档导航

- [docs/WORKFLOW.md](./docs/WORKFLOW.md)：端到端工作流
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)：推荐模块边界
- [docs/DEPENDENCY_MATRIX.md](./docs/DEPENDENCY_MATRIX.md)：必需与可选依赖
- [docs/SCRIPTS_CATALOG.md](./docs/SCRIPTS_CATALOG.md)：脚本目录
- [docs/SANITIZATION.md](./docs/SANITIZATION.md)：开源发布准备规则
- [docs/TOOLS_AND_REFERENCES.md](./docs/TOOLS_AND_REFERENCES.md)：工具与参考栈
- [docs/RAG_STRATEGY.md](./docs/RAG_STRATEGY.md)：retrieval / RAG 方向
- [docs/AI_SIDEBAR_NOTES.md](./docs/AI_SIDEBAR_NOTES.md)：sidebar 交互模型
- [docs/ROADMAP.md](./docs/ROADMAP.md)：后续路线图
