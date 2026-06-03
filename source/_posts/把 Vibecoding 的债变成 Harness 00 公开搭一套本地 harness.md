---
title: 把 Vibecoding 的债变成 Harness（00）：我准备用一个真实仓库公开搭一套 harness
toc: true
date: 2026-06-03 20:00:00
categories: 工程化
tags:
  - Harness
  - Vibecoding
  - AI Agent
  - Monorepo
  - Build in Public
---

如果你也在用 AI 写真实产品代码，应该会熟悉这种感觉：一个功能很快做出来了，但过几天改另一个地方，前面的东西又悄悄坏了。

每次发布前都需要 human in the loop——人肉判断该跑哪个测试、看哪段日志、哪些失败能忽略、哪些失败必须修。心里完全没底。

我现在要做 harness，不是因为工程洁癖，而是这些痛点已经反复出现太多次。所以我决定公开一组 Build in Public，主题就是：在一个真实 monorepo 里搭 harness。

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2026/06/03/Turning-Vibecoding-Debt-into-a-Harness-00-Baseline-Audit/">English</a>.
</div>
</article>

测试不是没有。但总感觉这次改动可能又碰坏了什么。

第一篇先做 baseline audit：把现实彻底量出来。不是讲概念，也不是拿干净 demo 演示。

我会持续更新：

1. 从第一天把所有失败摊开
2. 到后面一步步把它变成能在本地一键跑的检查流程
3. 能生成报告
4. 能支撑发布
5. 能让 AI Agent 在开发后进入固定的自检 loop

## 重要背景

这个仓库目前完全没有接 GitHub Actions。我所有的构建、测试、发布，都是在一台 Mac mini 上纯本地跑完的。

所以这次 harness 的目标不是先上云端 CI，而是先做一套完全本地化的 harness：

1. 能在这台机器上稳定复现
2. 给发布前一个清楚的结果
3. 把可以公开的部分整理出来
4. 把不能公开的日志留在本地
5. 让 AI Agent 后续能读到验证记录

这不是 CI 最佳实践，也不是测试框架教程。它更像一个现场实验：AI 写代码之后，本地开发验证怎么不再全靠人肉兜底。

最近看完一篇 Agent Harness 综述后，我更确定一件事：很多时候不是模型不够强，而是模型外面的环境、工具、上下文、日志、验证和权限没搭起来。这次连载想补的，就是这层东西。

## 这组连载主要覆盖两件事

**第一件事：本地开发验证 Loop。**

AI Agent 每改完一轮代码，不能只停在"我改好了"，而是要能自己把功能跑起来、看结果、留下记录，再把不确定的地方交给人判断。

难点在于验证对象不是单平台：

1. Expo / React Native 移动端
2. Electron 桌面端
3. Rspress 站点
4. Obsidian 插件
5. Chrome 扩展
6. server
7. daemon
8. CLI

这些东西的启动方式、测试夹具、观察结果的方式都不一样。所以 harness 不能只是"跑一下测试命令"，而是要逐步沉淀成一组本地自检动作：

1. 怎么准备环境
2. 怎么启动目标
3. 怎么操作功能
4. 怎么观察日志、截图、stdout、文件或网络响应
5. 怎么判断这轮功能是不是真的对

**第二件事：本地发布前 Gate。**

真正准备发版时，不再靠"感觉应该没坏"，而是有一份清楚的本地验证记录。

最终想解决的是几个具体问题：

1. 怎么减少反复回退
2. 怎么少一点人肉盯测试
3. 怎么让 AI 写完代码后进入固定的自检 loop
4. 怎么让发布前从"感觉没坏"变成"我知道刚才检查了什么"

## 为什么选这个仓库？

我没有选干净 demo，也没有选维护得很好的项目。那样容易写，截图也好看，但说服力有限。

这次选的是我自己的一个个人私有仓库。它足够真实，也足够麻烦。

这个仓库几乎是跟 Vibecoding 一起长大的。早期为了快，很多功能先跑起来；为了验证想法，很多边界没有认真命名；为了让 AI 接着写，脚本、测试、mock、fixture 和临时约定一层一层叠上去。

更关键的是：我现在也不靠读完里面所有代码来维护它了。很多地方我已经不记得当初为什么这么写，有些模块我只记得它应该能工作，不记得里面到底怎么工作。

这反而很适合做 harness。因为 harness 的价值就在这里：

**不是靠作者记忆解释仓库，而是让仓库自己把现实暴露出来。**

![为什么选这个仓库](/post-img/harness-00-why-this-repo.png)

## 它也不是单一 App

按 lifeos.vip/about 里的产品介绍看，排除 Midscene，这个仓库里对应的是 Aino、Vibelet、LifeOS、DeepAsk、Calendar Pro。

这些产品线都在这个 monorepo 里：

- Aino 是原生笔记和 AI 工作区。
- Vibelet 是手机上的 Claude / Codex 遥控器。
- LifeOS 是 Obsidian PKM 系统。
- DeepAsk 横跨 Obsidian 和 Chrome。
- Calendar Pro 是 Obsidian 里的日历和任务规划层。

![lifeos.vip/about 产品区域](/post-img/harness-00-about-products.png)

我按 apps 下面的 package.json 重新数了一遍：

1. apps 目录下有 18 个一级目录
2. 其中 16 个是带 package.json 的 app package
3. 还有 31 个共享 packages

这 16 个 app package 不是同一种东西：

1. 3 个移动端 app：Aino Mobile、Vibelet App、Remosidian Mobile
2. 1 个桌面端 app：Aino Desktop
3. 4 个 Web / 文档站：Aino Site、LifeOS Site、Remosidian Site、Vibelet Site
4. 1 个 Obsidian 插件
5. 1 个 Chrome 扩展
6. 2 个服务端入口
7. 2 个 CLI
8. 1 个 daemon
9. 1 个视频 / 内容构建 app

![技术栈分布图](/post-img/harness-00-stack-inventory.png)

这也不是那种"周末随便玩一下"的个人项目。这些产品里有已经上线的移动端 app，有 Obsidian 插件，有 Chrome 扩展，也有付费产品。

以 LifeOS 这条线为例，about 页里公开写着：1k 开源 stars、46k downloads、1000+ 付费用户。

所以这个仓库背后是有真实用户、真实收入和真实维护压力的。这次 harness 面对的不是一个页面、一个服务、一个包，而是一组已经长成产品的东西。

## 仓库规模：第 0 天审计

1. pnpm + Nx monorepo
2. 16 个 app package
3. 31 个共享 package
4. 874 个源码侧测试文件
5. 静态识别到 8066 个测试用例

这里的 8066 不是运行时精确计数。我排除了 node_modules、dist、build、out、.tmp 后，在测试源码里统计直接 test(...) / it(...) 调用，会漏掉动态生成和参数化用例，但已经足够说明体量。

测试分布亮点：

1. apps/aino-desktop：300 个测试文件，1737 个用例
2. apps/vibelet-app：130 个测试文件，1397 个用例
3. apps/vibelet-daemon：75 个测试文件，1152 个用例
4. apps/obsidian-plugin：83 个测试文件，869 个用例

![Baseline audit 数据图](/post-img/harness-00-baseline-map.png)

## 这里有一个很现实的矛盾

不可能每次发布都无脑跑全量测试。不是因为全量测试不重要，而是 AI 时代的开发和发布频率变了。

以前一个人可能几天才攒出一批改动。现在 AI Agent 可以在一天里改完多个功能、多个 package，甚至同时碰到移动端、桌面端、插件、扩展和服务端。

发布变得更频繁之后，8066 个静态用例、各种 build、e2e、fixture 检查、运行现场日志，如果每次都完整跑一遍，本地流程很快就会慢到没人愿意用。

但另一边也不能因为太慢就不跑。这个仓库有真实用户和付费用户，发布前如果只靠"感觉这次应该没问题"，迟早会把已经修好的东西重新改坏。

**所以 harness 要解决的不是"少跑测试"。**

它真正要做的是把发布前验证分层：

1. 哪些是每次都要跑的 smoke
2. 哪些要根据两次发版之间的改动影响面来选
3. 哪些情况必须升级到全量回归

这样本地发布才既不靠玄学，也不被全量测试拖死。

## 第 0 天实际跑出来什么

仓库里同时存在 Vitest、Node test、tsx --test、Jest、Playwright Electron。

根目录看起来有统一入口 `pnpm run test:unit`，但我实际跑了一下，结果没通过。

我跑了现有入口，发现几个典型失败：

1. caldav-core：mock 边界错位
2. vibelet-cli：fixture 不稳定
3. Aino Desktop Electron e2e：React alias 路径假设不成立

但也有不少能通过的检查：

1. scripts-unit 能通过
2. workspace exports 能通过
3. dependency version 能通过
4. Aino Desktop 已经有 Playwright fixture、临时 vault、临时 userDataDir

## 第 0 天结论

**这个仓库不缺测试。缺的是一层能把这些测试资产组织起来的 harness。**

我接下来不会先追覆盖率，而是先把初始失败变得：

1. 可复现
2. 可分类
3. 可报告
4. 能持续进入本地检查流程

我先做了一个最小 Smoke Harness。目前 6 个 suite 全部通过，在 Mac mini 上耗时 27.3 秒，带 summary + artifacts。这还只是起点。

## 最后想说

真正值得追问的是：为什么这些问题之前没有稳定暴露出来？

答案是：我过去的工作流太碎片化，没有一个固定的场合让所有检查一起出现。

第一版 smoke 的意义不在于覆盖多少，而在于它开始改变问题的形态——从"我不知道该跑什么、哪些失败重要"，变成"这 6 个 suite 是当前第一道门"。

这组连载的本质是验证：一个被 Vibecoding 推着长大的真实仓库，能不能靠本地 harness 重新变得可控。

Vibecoding 带来的债，不一定要靠人重新读完所有代码来还。也许可以先从 harness 开始，让仓库自己学会暴露问题。

如果你也在用 AI 维护真实产品，欢迎关注这个系列，一起交流。

下一篇我会写那三个失败是怎么被处理的。但重点不是 AI 如何修 bug，而是如何把一次性修复，变成以后每次都能被看见的本地检查。
