# 自维护 OpenClaw Fork / Integration 策略

这份文档总结了我们对未来 `analysis runner` 演进方向的判断：

- `analysis-runner-kit` 保持为独立业务 / starter kit 仓库
- 如果后续要做真正的 runtime-native 承接，就单独维护一个我们的 OpenClaw integration / fork
- 目标不是做一个长期重度魔改的 OpenClaw 分叉，而是维护一层尽量薄的宿主集成层

## 1. 为什么要这样分

我们已经确认两件事：

1. `analysis runner` 的核心价值，不是 OpenClaw 本身，而是：
   - repo ingest
   - repo analysis
   - reviewer challenge
   - delivery shaping
   - task / artifact / event 的业务组织方式

2. 真正 runtime-native 的自动承接能力，天然会更靠近 OpenClaw 运行时：
   - workflow continuation
   - agent handoff
   - plugin / hook 扩展点
   - session / channel glue

所以最合理的做法不是把所有东西都塞进 OpenClaw fork，而是分层。

## 2. 目标架构

推荐长期保持三层结构：

### A. analysis core / starter kit 层

仓库：

- `analysis-runner-kit`

职责：

- workflow 原型
- repo ingest
- repo analysis
- reviewer challenge
- delivery renderer
- task schema 的大部分业务语义
- 文档、示例、starter kit 体验

这层目标是：

- 尽量保持 runtime-agnostic
- 尽量避免直接依赖 OpenClaw 内部对象模型
- 未来即使替换宿主，核心分析能力仍尽可能可迁移

### B. OpenClaw integration / adapter 层

仓库：

- `our-openclaw`（未来可建）

职责：

- runtime-native workflow continuation
- analyst / reviewer / finalize 的宿主层 handoff
- plugin / hook / event adapter
- Discord / session / thread 的宿主集成 glue
- 针对 OpenClaw 版本变化的兼容层

这层允许耦合 OpenClaw，但要尽量把耦合收敛在边界层。

### C. 官方 upstream 层

仓库：

- 官方 `openclaw/openclaw`

职责：

- 基础 runtime
- 官方 plugin / gateway / channel 能力
- 官方升级与修复来源

## 3. 为什么不建议一开始就做重度 fork

因为重度 fork 有几个明显问题：

- 每次升级都容易遇到大量 rebase / merge 冲突
- 很难判断问题来自官方升级还是我们自己的改动
- 业务逻辑、宿主逻辑、交付逻辑容易缠在一起
- 想继续抽离 `analysis runner` 核心时会越来越痛

一句话：

> 重度 fork 能做，但会把“宿主升级问题”和“业务演进问题”混成一锅。

## 4. 我们真正要维护的是什么

不是“一个完全不同版本的 OpenClaw”，而是：

- 一个**跟随官方 upstream 的宿主集成层**

它的目标应该是：

- 尽量少改官方核心文件
- 尽量多用新增文件、adapter、plugin、hook 扩展实现
- 尽量把 analysis runner 专属逻辑放在官方主干之外

## 5. 推荐的 Git 策略

推荐这样维护：

### 官方 upstream

保留官方远端，例如：

- `upstream = openclaw/openclaw`

### 我们自己的远端

自己的 fork / 仓库，例如：

- `origin = our-openclaw`

### 分支策略

建议至少有：

- `main`：跟随我们当前稳定版本
- `upstream-sync/*`：用于接官方版本同步
- `feature/analysis-runner-native-*`：用于 runtime-native 功能实验

### 升级方式

未来升级时：

1. `fetch upstream`
2. 把官方新版本同步到本地
3. 把我们的 integration commits rebase / replay 上去
4. 验证 analysis runner adapter 是否仍兼容

重点不是“永不冲突”，而是：

- 让冲突尽量只发生在 integration 层

## 6. 哪些东西应该长期留在 kit / core

这些能力最好不要塞进 OpenClaw fork 深处：

- `repo-ingest.ts`
- `repo-analysis.ts`
- `reviewer-challenge.ts`
- `delivery.ts`
- 一部分 task / artifact / event schema
- 中文结论与 Discord 分层表达逻辑

原因很简单：

- 这些是 analysis runner 的产品能力
- 不是 OpenClaw 作为宿主平台的基础职责

如果把这些也深埋进 OpenClaw fork，以后：

- 很难独立分享
- 很难复用
- 很难在非 OpenClaw 宿主上实验

## 7. 哪些东西可以放进 OpenClaw integration 层

这些能力可以接受更强的宿主耦合：

- workflow continuation
- runtime-native stage handoff
- analyst / reviewer 自动承接
- session / event 回流
- failure / retry / recovery 的宿主级编排
- channel / thread / mention 级别的交付 glue

因为这些东西本来就和宿主运行时高度相关。

## 8. 我们真正想控制的，不是“有没有耦合”

而是：

- **把耦合限制在 adapter / integration 层**
- 不要让 core analysis 逻辑也一起被绑死

换句话说：

- runtime-native 可以耦合 OpenClaw
- 但 analysis core 不该跟着一起深耦合

## 9. 这种分层对升级有什么好处

如果未来 OpenClaw 升级，变化通常会出现在：

- runtime 接口
- plugin / hook 行为
- workflow 语义
- session / event continuation 结构
- channel integration 细节

如果我们边界清楚，那么升级时主要处理的是：

- `our-openclaw` 里的 adapter / glue code

而不是：

- 整个 analysis runner 产品逻辑

这会把升级成本从“整体重构风险”，压缩成“边界维护成本”。

## 10. 当前阶段为什么还不急着立刻建 fork

因为我们现在还处在：

- bridge workflow 已跑通
- starter kit 已可分享
- task / event / delivery 骨架已定型
- runtime-native 还没真正进入大规模落地阶段

在这个阶段，最合理的做法是：

- 先把 `analysis-runner-kit` 继续打磨
- 先明确 future integration layer 需要承担什么
- 等 runtime-native 需求真正清晰后，再起 `our-openclaw`

也就是说，fork 不是现在的炫技动作，而是未来的集成工程动作。

## 11. 推荐执行顺序

建议后续按这个顺序推进：

1. 继续保持 `analysis-runner-kit` 独立演进
2. 把 runtime-native 所需接口整理成 checklist
3. 确认哪些点必须改 OpenClaw，哪些点可以继续走外层 adapter
4. 只有当宿主改动边界已经明确时，再建立 `our-openclaw`
5. 建 fork 后，坚持“尽量少改官方核心、多做边界 adapter”原则

## 12. 一句话总结

我们的策略不是：

- “把 analysis runner 整体塞进一个重度魔改的 OpenClaw 分叉”

而是：

- **让 `analysis-runner-kit` 继续作为独立核心演进**
- **未来只在必要时维护一个尽量薄的 OpenClaw integration / fork**
- **官方 upstream 负责宿主基础能力，我们只维护 analysis runner 需要的那层宿主适配**

这样才能兼顾：

- 分享能力
- 升级能力
- 演进速度
- 长期维护成本
