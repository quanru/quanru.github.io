---
title: Midscene 的动作集合，为什么要做成一份"协议"？
toc: true
date: 2026-05-27 20:00:00
categories: 工程化
tags:
  - Midscene
  - UI Agent
  - AI 自动化
  - 工程化
---

给 Midscene 加一个新动作，要改多少地方？

这是我衡量一个框架设计好不好的土办法。如果加一个"下拉刷新"手势，得改定位逻辑、改规划提示词、改执行分发，再顺手补一堆 if-else，那这个框架迟早会被自己的动作集合压垮。

Midscene 的答案是：加一处就好。这篇讲它是怎么做到的，以及它没做到的那部分。

![动作集合作为一份 Zod 协议](/post-img/action-space-protocol.svg)

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2026/05/27/Action-Space-as-a-Protocol/">English</a>.
</div>
</article>

## 一个动作是什么

在 Midscene 里，一个动作不是一个写死的函数，而是一份声明。每个动作（`DeviceAction`）带几样东西：一个名字、一句给模型看的描述、一份用 Zod 写的参数 schema，还有真正执行它的 `call`。

每个平台返回自己的一套动作。Web 有 Tap、Input、Scroll、DragAndDrop、Navigate 这些；Android 在通用手势之外，还有返回键、Home 键、最近任务、下拉手势；iOS 有自己的 Home、应用切换。它们都从各自的 `actionSpace()` 里吐出来。

到这里都还普通。真正有意思的是那份 schema。

## 谁是"要在屏幕上找的"字段

一个动作的参数里，有些是要在画面上定位的，有些不是。Tap 要定位它点的那个元素；Input 要定位输入框，还要带上输入的文字；DragAndDrop 更特殊，它要定位两个点——从哪拖、拖到哪；而像 Android 返回键这种，根本没有要定位的东西。

框架得知道每个动作的哪些参数需要先去定位，才能在执行前把这些位置一个个找出来。

最直白的写法是按动作名判断：如果是 Tap 就找 locate，如果是 DragAndDrop 就找 from 和 to……但这样每加一个动作，你都得回来改这段分支。动作越多，这段 if-else 越长，也越容易漏。

Midscene 没这么做。它把"这个字段要定位"这件事，写进了 schema 本身。需要定位的字段，用 `getMidsceneLocationSchema()` 标出来。比如拖拽：

```typescript
export const actionDragAndDropParamSchema = z.object({
  from: getMidsceneLocationSchema().describe('The position to be dragged'),
  to: getMidsceneLocationSchema().describe('The position to be dropped'),
});
```

然后有个函数 `findAllMidsceneLocatorField`，它不关心这个动作叫什么，只把 schema 的字段挨个扫一遍，谁带着这个标记，谁就是定位字段。Tap 扫出来是 `[locate]`，拖拽扫出来是 `[from, to]`，返回键扫出来是空。TaskBuilder 执行时就按这个结果，在动手之前把该定位的位置都准备好。

加一个新动作，这一步什么都不用改——你只要在新动作的 schema 里，把要定位的字段标上，它自己就会被扫到。

## 同一份 schema，还顺手干了两件事

这份 schema 不只是用来挑定位字段。

它本来就是 Zod schema，所以参数校验是免费的——模型返回的参数对不对、类型合不合法，Zod 直接管了。

更省事的是第三件：模型怎么知道当前有哪些动作能用？规划提示词里那份"可用动作清单"，不是手写死的，而是把当前平台的 `actionSpace` 拿过来，每个动作按它的 schema 现场翻译成一段描述（`descriptionForAction`），再拼进提示词。

所以你换个平台，或者给某个平台加个动作，模型看到的动作清单会自动跟着变。Android 上模型知道有返回键可按，Web 上它知道能 Navigate，你都不用去维护两份清单。

## 于是，加一个动作是什么体验

拿 Android 的下拉手势举例。你在 Android 的 `actionSpace()` 里加一段动作声明：

```typescript
defineAction({
  name: 'PullGesture',
  description: 'Pull down or pull up from a position',
  paramSchema: z.object({
    direction: z.enum(['up', 'down']),
    distance: z.number().optional(),
    locate: getMidsceneLocationSchema().optional()
      .describe('The element to start the pull from'),
  }),
  call: async (param) => {
    // 按 direction 调用真正的 pullUp / pullDown
  },
});
```

写完就结束了。定位字段的识别不用改（`locate` 自己会被扫到），规划提示词不用改（这个动作会自动出现在清单里），执行链路不用改（轮到它时，框架会调它的 `call`）。TaskBuilder、planning、执行这些核心，一行都不用动。

## 它不是"零配置"，是"只配一处"

说句公道话，这不是魔法。你还是得显式写这个动作、给它起个名字——TaskBuilder 真正执行时，是拿模型返回的动作名，去 `actionSpace` 里按名字找到它的。这一步绕不开。

schema 帮你省掉的，是那些本来要散落在各处、各自维护、最容易忘记同步的事：定位字段的识别、参数的校验、给模型的动作描述。这三件事过去可能分布在三个文件的三段逻辑里，加一个动作要三处都对上；现在它们都从同一份 schema 派生出来。schema 是这个动作唯一的事实源。

所以与其说"扩展性内化在类型系统里"，不如说得朴实点：一个动作该有的所有信息，都写在它自己的 schema 里，框架其它部分去读它，而不是另存一份。

## 

把动作集合当成一份协议，好处不在哪一处特别聪明，而在它们都指向同一份声明：动作怎么定义、参数怎么校验、模型怎么知道、位置怎么抽取——全从一处长出来。

加一个动作，于是不再是"改一圈"，而是"加一处"。对一个要长期维护、还要跨好几个平台的项目来说，这点区别，时间越久越值钱。
