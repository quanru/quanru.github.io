---
title: 论如何科学地治理老项目的 eslint
date: 2020-09-28 12:50:11
categories: 前端
tags:
- JavaScript
- 项目治理
---

**行之有效，可行性高的治理方式**

<!-- more -->

## 背景

总有那么些老项目，当老板叫你上去开发需求时，你会有一种不祥的预感，生怕改完一发布，线上就崩了。但是你还是慌兮兮的介入开发，想着开发完马上抽身。这些除了一些贴药膏式的业务逻辑外，让你十分缺乏安全感的就是项目没有接入 eslint，一不小心就是一个低级语法造成 crash；更可怕的是接入了大家都不遵守，想象下编辑器满屏红色错误，黄色警告的画面，此时的你，已经对报错不敏感，以致同流合污。有一个犯罪心理学上的理论可以套用在软件工程中，即『破窗效应』：

> 此理论认为环境中的不良现象如果被放任存在，会诱使人们仿效，甚至变本加厉。以一幢有少许破窗的建筑为例，如果那些窗不被修理好，可能将会有破坏者破坏更多的窗户。最终他们甚至会闯入建筑内，如果发现无人居住，也许就在那里定居或者纵火。一面墙，如果出现一些涂鸦没有被清洗掉，很快的，墙上就布满了乱七八糟、不堪入目的东西；一条人行道有些许纸屑，不久后就会有更多垃圾，最终人们会视若理所当然地将垃圾顺手丢弃在地上。

因此，随着时间的推移，此类项目会变得愈发难以维护。当然，这种难以维护不仅仅是 [eslint](https://www.npmjs.com/package/eslint) 的问题，会有一系列约定和规范的问题，约定和规范制定很简单，但是如何保证这些约定和规范执行才是关键。本文聚焦 [eslint](https://www.npmjs.com/package/eslint) 治理，将以一个仍然在持续维护的项目为例，阐述如何治理这种老项目。



## 现状描述

当前存在的 [eslint](https://www.npmjs.com/package/eslint) 错误数和告警数：

![](/post-img/eslint1.png)

其中 5697 个错误和 65 个警告可被自动修复，修复后仍剩余 6468 个。经发现，原有项目使用 Airbnb 等规则集，由于该规则十分严格，且本身没有可靠手段阻止不符合规范的代码入库，使得开发更不愿意遵守，错误数有越来越多的趋势，即使自动修复，也仍有 6000+ 的错误。因此选择和制定一个大家都能良好遵守的规则集就很重要，切忌进入『越严格越牛逼』的误区，时刻记住我们的目的是保证代码符合一定的规范，从而避免低级错误。



## 解决方式

最后经过调研和讨论，我们采用如下的规则集：

```js
extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier',
    'prettier/@typescript-eslint',
  ]
```



此处我们接入了 [prettier](https://www.npmjs.com/package/prettier) 和 [lint-staged](https://www.npmjs.com/package/lint-staged)，前者用于保证同一份代码仅输出一个确定的格式；后者用于保证不会有新的 [eslint](https://www.npmjs.com/package/eslint) 错误引入，并对修改过的文件强制校验，从而逐步减少错误数。



## 结果

eslint 默认的结果仅支持文件维度的统计，这在错误数非常多的项目是不适合的，几乎所有文件都有相当数量的错误。此处使用工具 [eslint-formatter-stats](https://www.npmjs.com/package/eslint-formatter-stats)，使得我们可以从错误类型的维度进行分析。运行结果如下：

### 接入后未修复的 eslint 结果

![](/post-img/eslint2.png)

10959 个错误和警告

### 接入并修复的 eslint 结果

![](/post-img/eslint3.jpg)

837 个错误和警告



## 分析

### 错误数

接入并修复之后，错误数仅有 800+，老板说对，放低点要求，我们 eslint 做得还挺好。

### 排查
错误数量排名靠前的大部分是一些不影响程序功能的，而且为了保证线上代码的稳定性，除了自动修复以外，本次治理尽量不去更改其它错误。因此决定重点看看几个造成影响或可能造成影响的高危错误：


1. `no-undef`，即使用了未定义的变量，这种错误极有可能造成 crash，目前有 13 处
2. `import-no-unresolved`，即导入了不存在的模块，目前有 6 处
3. `react-no-key`，即数组元素未使用 key，可能造成卡顿，目前有 4 处
4. `react-native-no-unused-styles`，即存在未使用的样式，造成应用体积变大，目前有 45 处
5. `no-dupe-keys` 和 `no-duplicate-case`，即重复定义的对象 key 或者 switch case，增加了不确定性，目前有 7 处
6. `react/no-direct-muttion-state`，即直接修改 this.state，有可能导致状态更新不生效，目前有 21 处

此外，诸如变量驼峰，双等号这种错误如果数量巨大，建议改成 warn 级别或者直接关闭，毕竟无关痛痒。经过上述修复之后，剩余的就交给 [lint-staged](https://www.npmjs.com/package/lint-staged) 即可。