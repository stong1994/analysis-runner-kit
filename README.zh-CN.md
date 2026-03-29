# Analysis Runner Kit

一个基于 OpenClaw + Lobster 的 `analysis runner` 可分享 starter kit。

## 这是什么

这个仓库把当前的分析工作流整理成一个更容易分享给其他开发者使用的形态。

当前结构：

- workflow 文件：`workflows/analysis-runner.lobster`
- 核心实现：`src/core/*`
- CLI 入口：`src/cli/*`
- 运行时依赖：OpenClaw + Lobster 插件 + Lobster CLI

它现在已经是一个**可以实际运行的 starter kit**，但还不是一个完全产品化的独立 plugin。

## 现在能做什么

- 创建 analysis task
- 通过 Lobster 跑 analysis workflow
- ingest GitHub 仓库
- 识别项目 archetype / 类型
- 采样关键 entrypoints
- 生成结构化 first-pass analysis
- 追加 reviewer challenge / 审查意见
- 输出适合 Discord 的分层交付文本

## 运行依赖

1. 已安装并运行 OpenClaw
2. 已启用 OpenClaw 的 Lobster 插件
3. 已安装 Lobster CLI
4. Node.js 20+
5. 可用的 npm

## 启用 Lobster 插件

检查配置并启用：

- `plugins.entries.lobster.enabled = true`

## 安装 Lobster CLI

```bash
npm install -g @clawdbot/lobster
```

验证：

```bash
lobster --help
```

## 安装这个 starter kit

在仓库目录中执行：

```bash
npm install
```

## 运行 workflow

在 `analysis-runner-kit` 目录执行：

```bash
lobster run workflows/analysis-runner.lobster --args-json '{"request":"分析这个项目 https://github.com/owner/repo"}'
```

## 读取结果

列出 task：

```bash
node --import tsx src/cli/cli.ts list
```

渲染某个 task 的 delivery：

```bash
node --import tsx src/cli/delivery-cli.ts <taskId>
```

## 当前抽离边界

已经抽到这个 starter kit 里的部分：

- `workflows/analysis-runner.lobster`
- `src/core/store.ts`
- `src/core/analysis-pipeline.ts`
- `src/core/finalize.ts`
- `src/core/repo-ingest.ts`
- `src/core/repo-analysis.ts`
- `src/core/reviewer-challenge.ts`
- `src/core/delivery.ts`
- `src/cli/*` 下的最小 CLI 入口
- `.analysis-runner-kit-data/` 下的本地 task 数据存储

还没有完全抽干净 / 在产品边界上仍不完整的部分：

- 超出当前 bridge workflow 形态的 runtime-native 多步编排
- 面向生产使用的更完整 failure / retry / recovery 加固
- 更强的 reviewer 证据 challenge 与更深层代码阅读能力
- 如果要做成独立 npm package 或 OpenClaw plugin，还需要更多 packaging 工作
- 对 OpenClaw + Lobster 运行时依赖模型的完全解耦

## 当前限制

- 目前仍然是 bridge workflow，不是完全 native 的多步 subagent workflow
- 当前分析深度仍然是 first-pass / code-aware first-pass，不是深度代码审查
- 结果渲染目前优先针对 Discord 文本交付，还没有做交互式组件
- task 存储当前落在本地 `.analysis-runner-kit-data/`

## 建议的下一步打包方向

可以把可复用逻辑继续往更清晰的独立包边界移动，例如：

- `packages/analysis-runner-core`
- 或继续把这个仓库演进成真正独立的公开 starter kit

然后把“与运行时无关的分析逻辑”和“OpenClaw / Lobster 特定的 workflow wiring”进一步拆开。
