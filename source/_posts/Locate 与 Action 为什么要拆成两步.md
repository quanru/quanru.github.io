---
title: Midscene 为什么要把 Locate 与 Action 拆成两步？
toc: true
date: 2026-05-26 20:00:00
categories: 工程化
tags:
  - Midscene
  - UI Agent
  - AI 自动化
  - 工程化
---

上一篇《[Midscene 的一次 aiAct 里到底发生了什么？](/2026/05/26/一次-aiAct-里到底发生了什么/)》讲了 `aiAct` 内部的规划-执行循环，但里面有一站刻意没展开——**"找元素"**。

这一站其实是 Midscene 里最有技术辨识度的部分。绝大多数视觉 Agent 在这一步要么直接信任 AI 给的坐标，要么再发一次 AI 请求精确定位。Midscene 走了一条不太一样的路：**把定位拆出来单独做，并且按"成本从低到高"分四级 Fallback 尝试**。

这篇专门讲这件事。

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2026/05/26/Why-Midscene-Splits-Locate-and-Action/">English</a>.
</div>
</article>

## 起点：AI 给的 bbox 为什么不能直接用

回顾一下上一篇里的 AI 响应：

```xml
<action-type>Tap</action-type>
<action-param-json>
{
  "locate": {
    "prompt": "登录按钮",
    "bbox": [1050, 20, 1150, 60]
  }
}
</action-param-json>
```

这个 `bbox` 是 AI 在做规划时**顺手**返回的——模型当时同时在做四件事：理解用户意图、选择动作类型、生成动作参数、估算元素位置。定位只是这四件事中的一个子任务，自然不会很准。

实际表现是：

- 对大按钮（> 80px），bbox 通常够用
- 对中等元素（40-80px），bbox 经常偏 20-50 像素
- 对小按钮（< 40px），bbox 可能完全偏出，直接点会点到隔壁

更糟糕的是：**这种偏差是无法在执行时被发现的**——程序拿到坐标就去点了，点到错的元素也"成功"了，下一轮 AI 看到界面没按预期变化才会意识到出问题。这种延迟感知会让整个循环跑很多无用功。

所以问题不是"让 AI 给更准的 bbox"——这是规划模型的能力天花板，砸再多 token 也只能改善有限。问题是**架构上把"定位"和"执行"解耦**，让定位可以独立优化。

## 架构上的拆分：每个动作变成 Locate + Action 两步

`TaskBuilder` 是负责这件事的模块。它的工作很简单：把每一个 `PlanningAction` 拆成多个 `ExecutionTask`，并把需要定位的字段抽出来变成独立的 `Locate` 任务。

举个例子，AI 返回一个 Input 动作：

```typescript
{
  type: "Input",
  param: {
    locate: { prompt: "搜索输入框", bbox: [300, 20, 700, 60] },
    value: "Midscene",
    mode: "replace"
  }
}
```

`TaskBuilder` 会把它拆成两个任务：

```
Task 1: Locate 任务   { prompt: "搜索输入框", bbox: [...] }
Task 2: Input 任务   { locate: ???, value: "Midscene", mode: "replace" }
```

第 2 个任务的 `locate` 一开始是空的——它要等第 1 个任务执行完，通过一个叫 `onResult` 的回调，把精确坐标回填进来：

```
Locate 执行完 → 得到 { center: [500, 40], text: "Search..." }
                  ↓ onResult 回调
            Input 任务的 param.locate = { center: [500, 40], ... }
                  ↓
            Input 执行时拿到的是精确坐标，不是 bbox 估算
```

这样一来，**Action 任务永远不会直接使用 AI 给的粗糙 bbox**——它拿到的总是 Locate 任务输出的精确结果。

### TaskBuilder 怎么知道哪个字段要定位

这里有个工程问题：不同动作的参数结构差很多。

- `Tap` 只有 `locate`
- `Input` 有 `locate + value + mode`
- `DragAndDrop` 有 `from + to`——**两个**字段都要定位
- `AndroidBackButton` 没有任何参数，根本不需要定位

如果硬编码 `if (type === 'Tap') 抽 locate / else if (type === 'DragAndDrop') 抽 from 和 to`，每新增一个动作就要改 `TaskBuilder`。Midscene 用的是另一种办法：每个动作用 Zod Schema 定义参数结构，需要定位的字段用一个特殊类型 `MidsceneLocator` 标记。`TaskBuilder` 不关心动作叫什么名字，只扫描 Schema：

```typescript
const locateFields = findAllMidsceneLocatorField(action.paramSchema);
// Tap          → ["locate"]
// Input        → ["locate"]
// DragAndDrop  → ["from", "to"]
// AndroidBack  → []
```

新增动作时只需要在它的 Schema 里用 `getMidsceneLocationSchema()` 标记需要定位的字段，`TaskBuilder` 自动识别。这是把扩展性内化在类型系统里，而不是写在分支里。

## 拆完之后：四级 Fallback 链

每个 Locate 任务执行时，内部会按**成本从低到高**依次尝试四种定位方式，命中即停：

![四级 Fallback 定位链](/post-img/midscene-locate-fallback.svg)

下面逐级解释。

### 第 1 级：Plan hit——零成本，信任 AI 估算

直接把 AI 在规划时返回的 `bbox` 转成元素坐标：

```typescript
ifPlanLocateParamIsBbox(param) → matchElementFromPlan(param)
```

本质是格式转换：`bbox [x1, y1, x2, y2]` → `{ center: [x, y] }`。**没有任何 AI 调用，零成本。**

但前面说过 bbox 不够准，那这一级什么时候敢用？答案是：**默认不开**。只有当下面两个条件同时满足，提示词才会要求 AI 在规划时一起返回 bbox，这一级才生效：

1. 没开 deepThink
2. 规划和定位用的是同一个模型（不同模型的坐标系可能对不上）

即 `includeBboxInPlanning = !deepThink && noIndividualLocateModel`。只要用户显式要求"想得更深"（开了 deepThink），这一级就被跳过，直接走下面的层级。注意 deepLocate 并不影响这一步是否启用——它影响的是拿到 bbox 之后怎么用，下面会讲到。

为什么要保留这一级？因为对大按钮、布局简单的页面，AI 给的 bbox 完全够用，省一次 AI 调用就是省一两秒延迟。**这是一个"乐观假设 + 显式退出"的工程权衡**——默认走快路，用户觉得不准就一行配置切到慢但准的路。

### 第 2 级：XPath hit——零 AI 调用，DOM 精确定位

如果 Plan hit 没开或者用户跑过一次后写入了 XPath 缓存，会优先用 XPath 在 DOM 里精确查找元素：

```typescript
interface.rectMatchesCacheFeature({ xpaths: [param.xpath] })
```

精度是像素级的（直接读 DOM 节点的 `getBoundingClientRect()`），成本是零 AI 调用——只有一次 DOM 查询。

但这一级**仅 Web 平台可用**——`rectMatchesCacheFeature` 是 `AbstractInterface` 上的可选方法，只有 Web 适配层（Playwright / Puppeteer / Chrome 扩展）实现了它，Android / iOS 适配层不提供。

XPath 而不是像素坐标本身就是关键设计：哪怕页面布局变了，只要 DOM 节点还在，XPath 一样能定位。这让 iframe、虚拟列表、动态布局这些场景的缓存仍然稳定可用（仓库里 `iframe-aware xpath and node cache` 的多次提交可以佐证）。

### 第 3 级：Cache hit——零 AI 调用，历史定位复用

如果同一个元素在历史上被定位过，`TaskCache` 里会有它的特征（XPath + 周边上下文）。命中时直接复用历史坐标：

```typescript
matchElementFromCache(taskCache, cacheEntry, ...)
```

精度同样像素级，成本同样零 AI 调用。和 XPath hit 的区别是：XPath hit 用的是"当前规划阶段 AI 给出的 XPath 提示"，Cache hit 用的是"过去某次完整跑过的历史记录"。

这一级也只在 Web 可用（内部依赖 XPath 校验）。

缓存策略有四种模式：`read-write`（读写都开）、`read-only`（只读，CI 里用）、`write-only`（只写，第一次跑用）、`false`（完全关）。CI 环境通常用 `read-only`——保证测试用例跑的是"上次审过的路径"，不会因为这次 AI 心血来潮换了个定位结果而通过/失败结果突变。

### 第 4 级：AI locate——最后兜底

前三级都没命中（或者都没启用），就走这一级：**单独发一次 AI 请求，让模型专门做定位**。

```typescript
service.locate(param, { context: uiContext }, modelConfig)
  → AiLocateElement()
```

这一次的提示词只有一个任务——找元素。没有规划负担、没有动作选择、没有参数生成，模型全部注意力集中在"在这张截图里找到搜索按钮"。精度比规划阶段顺手给的 bbox 高一个量级。

代价是 1-3 秒延迟 + 几百到上千 token。但作为最后兜底，它保证了任何场景下都能拿到一个能用的坐标。

### 各平台实际可用的链路

```
Web（Playwright/Puppeteer）:  plan hit → XPath → cache → AI locate  (4 级)
Android / iOS:                plan hit → AI locate                  (2 级)
```

移动端因为没有 DOM，中间两级跳过。但 plan hit 本身在移动端也常常被跳过（小按钮多、bbox 不准的概率更高），所以实际跑下来移动端基本就是"AI locate 兜底为主"。这也意味着移动端的定位延迟通常比 Web 高 1-2 秒——这是平台能力的差异，不是 Midscene 的实现问题。

## 还想要更准：deepThink 与 deepLocate

四级 Fallback 已经是默认行为。如果用户对精度还有更高要求（页面复杂、元素小、有遮挡），可以开两个"加倍模式"。

### deepLocate：把定位拆成两次 AI 调用

deepLocate 的核心想法是：与其让 AI 在一张全屏截图里直接找一个小元素，不如**先框定区域、再精确定位**。

```
第 1 次 AI 调用: AiLocateSection
  输入: 整张截图 + "搜索输入框"
  输出: Rect 区域(比如"顶部导航栏的矩形范围")

第 2 次 AI 调用: AiLocateElement
  输入: 裁剪后的区域截图 + "搜索输入框"
  输出: 元素的精确坐标
```

类比就是"先找街道，再找门牌号"。当搜索区域超过屏幕的 50%，第 2 次调用会把图像裁剪到目标区域——减少 token 的同时也提高了精度（模型不用在无关像素上分注意力）。

代价当然是双倍 AI 调用 + 双倍延迟。所以 deepLocate 不是默认开的，是用户在 `aiAct('xxx', { deepLocate: true })` 里显式要求时才启用。

### deepThink：规划阶段加深

deepThink 影响的是**规划阶段**而不是定位阶段。它做三件事：

1. 把任务分解成子目标列表（subGoals），让 AI 一次想清楚多步
2. 保留最近 2 张截图给 AI 对比"操作前后的变化"（普通模式只保留 1 张）
3. 关闭 plan hit——既然要分子目标，规划阶段就不再顺手给 bbox，强制后续走更准的定位层级

注意：deepThink 本身**不会**触发 `AiLocateSection + AiLocateElement` 的两段定位，两段定位只由 deepLocate 启用。两者可以独立开，也可以叠加：

```typescript
agent.aiAct("...", { deepThink: true, deepLocate: true });
```

叠加之后是"规划阶段拆子目标 + 定位阶段走两段 AI"，但二者机制是正交的。

### 三者的互斥关系

记得前面说的 plan hit 启用条件吗——"没开 deepThink + 同一个模型"。deepThink 会直接关闭 plan hit（因为它要求 AI 拆子目标，不能在规划阶段顺手给 bbox）；deepLocate 不影响 plan hit 是否启用，但它会改变 plan bbox 的用法——开了 deepLocate 之后，plan bbox 只被当作"搜索区域提示"，而不是直接当结果，最终还是会跑到 AiLocateSection + AiLocateElement。

效果上仍然成立：**只要用户表达出"我要更准"的意图（不管是 deepThink 还是 deepLocate），plan bbox 都不会被直接信任**。一个是规划阶段就不给 bbox，一个是给了也不当结果用。

这种"用户选择什么精度，系统自动调整 Fallback 起点"的设计，比硬编码"标准模式 / 高精度模式 / 极致模式"三档要灵活——用户其实在选**起点**，而不是选模式。

## 一张图看完整套定位

```
精度低 ←———————————————————————————————→ 精度高
成本零 ←———————————————————————————————→ 成本高

  plan hit   XPath hit   Cache hit   AI locate   deepLocate
  (估算)     (DOM 查询)  (历史复用)  (单独定位)  (两次 AI 定位)
     │          │           │           │            │
     └──── Web 4 级 Fallback ─────┘          │            │
                                              └── 默认兜底 ┘
                                                        deepThink
                                                     (规划+定位双层)
```

按场景选起点：

| 场景 | 推荐配置 | 实际命中点 |
| --- | --- | --- |
| 大按钮、简单页面 | 默认 | plan hit 居多 |
| 跑过一次、稳定回归 | 默认 + cache | cache hit 居多 |
| 复杂页面、小元素 | `{ deepLocate: true }` | 直接到 AiLocateSection + Element |
| 多步骤复杂任务 | `{ deepThink: true }` | 子目标分解 + 双层定位 |
| 极致精度 | `{ deepThink, deepLocate }` | 所有优化叠加 |

## 总结

视觉 Agent 真正难的不是"点击"，是"找到"。Midscene 在这一点上的工程取舍可以总结成三句话：

1. **拆开**——Locate 和 Action 拆成两步，Action 任务永远只拿精确坐标，不直接用 AI 的 bbox 估算
2. **分层**——四级 Fallback 按"成本从低到高"依次尝试，命中即停，没命中再升级
3. **可调**——用户用一行 `{ deepLocate: true }` 就能跳过低精度层级直接到高精度起点，不需要切换"模式"

对手要么不做 AI 定位（Playwright），要么只做单次视觉定位（Browser-Use、Computer Use）。Midscene 是少数构建了**多层定位体系**的方案，且每一层都可以独立开关、自由组合。

到这里，配合上一篇《[Midscene 的一次 aiAct 里到底发生了什么？](/2026/05/26/一次-aiAct-里到底发生了什么/)》，Midscene 工程化的两根主梁——**规划-执行循环** 和 **分层定位**——就讲完了。剩下还有几块（Zod Schema 作为核心契约、ModelConfigManager 的多模型组合、Bridge 模式跨进程协作）以后有机会再写。
