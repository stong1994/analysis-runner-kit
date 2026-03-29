# OpenClaw 自定义 Workflow 与事件通知架构总结

这份文档总结了 `analysis-runner-kit` 当前是如何在 OpenClaw + Lobster 运行时上实现自定义 workflow，以及整个 task / event / delivery 通知链路是如何组织的。

## 1. 目标

我们要解决的不是“写一个脚本跑完分析”，而是把分析能力挂到 OpenClaw 的 workflow 运行时上，让它具备下面这些特性：

- 能以 workflow 的方式被触发
- 能把一次分析请求落成一个可追踪的 task
- 能把分析过程拆成 analyst / reviewer / finalize / delivery 这样的阶段
- 能记录状态、进度、artifact、event
- 能输出适合 Discord 的结果
- 后续可以逐步从 bridge 版演进到 runtime-native 版

当前 `analysis-runner-kit` 走的是：

- **OpenClaw 作为宿主运行时**
- **Lobster 作为 workflow 引擎**
- **本地 TypeScript CLI 作为 step 执行入口**
- **本地 task/event store 作为状态与通知总线的最小实现**

## 2. 总体架构

可以把当前实现理解成 4 层：

1. **入口层**：OpenClaw / Lobster workflow
2. **执行层**：`src/cli/*` 提供 step 命令入口
3. **业务层**：`src/core/*` 实现 analysis pipeline、repo ingest、reviewer challenge、delivery
4. **状态层**：`.analysis-runner-kit-data/` 中的 task / artifact / event 文件

简化后的结构如下：

```text
Discord / 用户请求
        |
        v
OpenClaw
        |
        v
Lobster workflow (`workflows/analysis-runner.lobster`)
        |
        v
CLI steps (`src/cli/*`)
        |
        v
Core pipeline (`src/core/*`)
        |
        +--> task store / events / artifacts (`.analysis-runner-kit-data/`)
        |
        +--> delivery text
```

## 3. 自定义 Workflow 是怎么接进去的

当前 workflow 文件是：

- `workflows/analysis-runner.lobster`

它定义了一条很清晰的串行链路：

1. `task-create`
2. `task-id`
3. `task-show-created`
4. `analysis-fallback`
5. `task-show-after-analysis`
6. `delivery`
7. `output`

对应命令大致是：

- 用 `src/cli/cli.ts create` 创建 task
- 从 JSON 输出中提取 `taskId`
- 用 `src/cli/analysis-pipeline-cli.ts` 执行分析主链
- 用 `src/cli/delivery-cli.ts` 生成最终交付文本

### 关键点 1：workflow 只负责编排，不直接承载业务逻辑

我们没有把复杂逻辑直接写在 `.lobster` 文件里，而是让 workflow 只做：

- step 排序
- step 之间的数据传递
- stdout 结果消费

真正的分析逻辑都落在 `src/core/*`。

这样做的好处是：

- workflow 结构清楚
- 业务逻辑可测试、可迁移
- 后续替换成更 native 的 runtime orchestration 时，核心代码不用全推翻

### 关键点 2：显式传递 `taskId`

当前实现已经不再依赖“取下一个 pending task”的隐式方式，而是让 workflow 明确提取并传递 `taskId`。

这意味着：

- step 之间的上下文更稳定
- 不容易串任务
- 更适合以后并发或多来源触发

## 4. 执行层：为什么要有 `src/cli/*`

`src/cli/*` 的作用，不是重复业务代码，而是给 workflow 一个稳定的命令行边界。

当前最小入口包括：

- `src/cli/cli.ts`
- `src/cli/analysis-pipeline-cli.ts`
- `src/cli/finalize-cli.ts`
- `src/cli/delivery-cli.ts`

它们做的事很简单：

- 接收参数
- 调用 `src/core/*` 中的函数
- 把结果输出成 workflow 可以继续消费的 stdout / JSON

这层非常重要，因为 Lobster workflow 天然最擅长调用命令，而不是直接调用 TypeScript 模块。

## 5. 业务层：analysis pipeline 怎么跑

主链核心在：

- `src/core/analysis-pipeline.ts`

当前 pipeline 的逻辑是：

1. 读取 task
2. 校验 task 类型
3. 更新状态到 `queued`
4. dispatch 给 analyst（当前是 bridge / simulated 方式）
5. 更新状态到 `running`
6. 生成 draft / analysis summary
7. 更新状态到 `review`
8. dispatch 给 reviewer（当前也是 bridge / simulated 方式）
9. 更新状态到 `approved`
10. 调用 `finalizeAnalysisTask(...)`
11. 最终进入 `delivered`

这条链当前仍然是 **bridge workflow**，不是完全 runtime-native 的多 agent 自动承接。

也就是说：

- analyst / reviewer 这两个阶段在逻辑上已经明确存在
- 但底层 dispatch 目前还是先用最小可运行桥接层模拟/承接
- 目标是先跑通主链，再逐步替换成真正的 runtime-native orchestration

## 6. 事件通知架构：最小实现是怎么落地的

当前的“事件通知架构”并不是一个额外的 MQ 系统，而是建立在 task record 的事件流之上。

核心文件：

- `src/core/store.ts`
- `src/core/types.ts`

每个 task 记录里都包含：

- `status`
- `progress`
- `artifacts`
- `events`
- `createdAt`
- `updatedAt`

其中 `events[]` 是最关键的通知骨架。

### 当前 event 类型的作用

每当发生下面这些动作时，都会追加 event：

- task created
- assigned
- status changed
- progress updated
- artifact added

也就是说，当前系统里“通知”的最小语义单元不是一条 Discord 消息，而是：

- **task 内部追加的 event 记录**

然后再由 delivery 层决定：

- 哪些内容要显示给用户
- 显示成什么格式
- 在什么阶段发出去

### 为什么这种设计重要

因为这样可以把：

- **内部状态变化**
- **对外可见通知**

分开。

内部可以细粒度记录很多 event，外部不一定每条都发消息；否则 Discord 会被刷屏。

## 7. Delivery：事件如何变成用户可见输出

最终给 Discord 的不是原始 event 列表，而是经过 delivery renderer 处理后的分层文本。

核心文件：

- `src/core/delivery.ts`

当前输出结构是：

- `分析完成`
- `可复制结论`
- `详细证据`
- `审查意见`

这层承担了两个职责：

1. **对用户友好**
   - 可直接阅读
   - 可直接复制
   - 不把内部实现细节直接甩到聊天里

2. **对 workflow 友好**
   - 依然是纯文本输出
   - 可以继续作为 CLI / workflow 的标准输出结果

### 为什么要分层

因为 Discord 里最容易出问题的是：

- 一整段太长，不好看
- 结论不好复制
- 证据和结论混在一起

所以当前专门拆成：

- 上层给结论
- 下层给证据
- reviewer 单独给 challenge / caveat

## 8. 当前事件通知模型的本质

如果一句话概括现在这套“事件通知架构”，可以这么说：

> **用本地 task store 作为状态与事件总线，用 Lobster workflow 做阶段编排，用 delivery renderer 把内部事件与 artifact 收口成 Discord 可消费的最终通知。**

这不是最终形态，但它已经具备了完整闭环：

- 请求进入
- task 创建
- 状态推进
- event 记录
- artifact 写入
- delivery 输出

## 9. 为什么先做 bridge，再做 runtime-native

这是整个方案里一个很关键的产品/工程决策。

我们没有一开始就强行做“完全 runtime-native 的 analyst -> reviewer -> finalize -> delivery 自动承接”，因为那样一上来就会同时卡在：

- runtime 接口边界
- allowlist / agent dispatch
- workflow 编排
- 事件传递
- Discord 交付格式

所以当前采用的是：

- **先 bridge / fallback 跑通**
- **先把 task、event、delivery 骨架做对**
- **再逐步替换成 runtime-native**

这样做的价值是：

- 能先验证产品链路是不是对的
- 能先沉淀 task schema / delivery schema
- 能先把 Discord 文本交付调顺
- 后面替换调度实现时，不用连用户可见层一起重做

## 10. 当前已经完成的部分

截至目前，这套方案里已经具备：

- OpenClaw + Lobster 上的自定义 workflow
- 显式 `taskId` 传递
- 本地 task / event / artifact store
- repo ingest
- archetype / key files / entrypoints first-pass analysis
- reviewer challenge
- 中文 delivery 输出
- Discord 友好的分层结果
- 可独立运行的 starter kit 形态

## 11. 当前还没有完全完成的部分

仍未完全产品化的部分包括：

- 真正 runtime-native 的多 agent 自动承接
- 更强的 failure / retry / recovery 机制
- 更深层代码阅读与 richer reviewer challenge
- 更彻底的 OpenClaw 运行时解耦
- 更成熟的事件订阅 / 实时推送策略

也就是说，当前已经有：

- **完整闭环的最小实现**

但还没有：

- **完全产品化的最终架构**

## 12. 推荐的后续演进方向

比较自然的下一步是：

1. 把 dispatch 从 simulated bridge 替换成真正 runtime-native agent handoff
2. 给 event 增加更清晰的阶段语义和失败分类
3. 让 delivery 支持更丰富的 chunking / formatting 策略
4. 把 runtime-agnostic core 再进一步抽成独立 package
5. 再决定是否做成独立 npm package 或 OpenClaw plugin

## 13. 一句话总结

当前 `analysis-runner-kit` 的实现路线可以概括为：

> **在 OpenClaw 宿主中，用 Lobster 自定义 workflow 做编排，用 CLI + core 模块承接业务逻辑，用本地 task/event/artifact store 作为最小通知总线，再把结果收口成适合 Discord 的分层交付文本。**

这条路线的重点不是“一步到位做完所有 runtime-native 特性”，而是先把分析工作流、状态推进、事件记录、用户通知这条主链稳定跑通。
