---
title: Summary and Reflections on the 11th D2 Conference
toc: true
date: 2016-12-24 23:32:43
categories: Frontend Learning
tags: Conference
---

My first time attending such a tech conference, seeing various frontend celebrities in person—the influencers from Zhihu and Weibo suddenly felt within reach. Here are my reflections and summary.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/12/24/%E7%AC%AC%E5%8D%81%E4%B8%80%E5%B1%8A%20D2%20%E4%BC%9A%E8%AE%AE%E6%80%BB%E7%BB%93/">简体中文</a>.
</div>
</article>

# Weex at Scale in Double 11 Shopping Festival

> Guidao, Taobao

1. Compared to last year's Double 11, Weex was used in almost all main venue pages this year

2. DOM nesting shouldn't be too deep, or it causes performance issues

3. Long list scrolling - performance issues. H5 lazy load has poor UX; native is better than Weex

4. Frame rate: Weex performs consistently on Android and iOS, while H5 performs poorly on low-end devices (especially Android)

5. Opening multiple Weex pages on iOS causes excessive memory usage leading to crashes

   Solution:

   > 1. Single instance for main venue
   > 2. Set upper limit for pushed pages (5 during Double 11)

6. H5 fallback plan, though rarely activated

7. iOS JSCore memory: analyzing JS Heap revealed JS reference holding preventing memory release (curious why Android didn't have this issue—is Android memory large enough that it doesn't matter?)

8. Improving page instant-load rate through preloading:

   a. Pre-download JS on app startup

   b. Push through persistent connection channels

   c. Local IO

   d. Automated platform integration

9. Framework & bundle separation: shared logic front-loaded + async execution

![](http://s1.wacdn.com/wis/49/1efde03d5681f627_832x378.jpg)

10. Node & Tree rendering combined

11. Node: minimum granularity rendering

    > 1. Display immediately after DOM parsing
    > 2. Won't block main thread for long
    > 3. May cause redundant layouts

12. Tree: block-level rendering

    > Only needs one layout pass
    >
    > May block main thread

13. Weex's shortcomings

    > 1. No grayscale release
    > 2. Missing compatibility and performance validation
    > 3. Production monitoring not reaching individuals
    > 4. Component ecosystem far behind RN
    > 5. Rich interaction capabilities lacking
    > 6. Common APIs missing

    Future plans: enrich the component marketplace, add development support (items 1-3 above)

# XCore — Mogujie's Mobile Dynamic Cross-Platform Development Framework

> Mogujie, Wang Xingnan

1. A dynamic cross-platform framework customized for mobile business scenarios, currently not open-source
2. XCore wraps the underlying layer, claiming to have reinvented the wheel without changing existing framework coding patterns (Vue.js, React, DOM)—the car doesn't need to change

![](http://s1.wacdn.com/wis/52/446bb612636b7d26_1280x1096.jpg)

3. Differences from Weex/React Native: three trees—DOM tree, Shadow tree, Native tree
4. Rapidly develop and deploy code that runs on three platforms (H5, Android, iOS) using web technologies
5. Implemented a standard Web subset
   ![](http://s1.wacdn.com/wis/49/e587103798a31b38_2002x1122.jpg)

6. Compared to RN, Weex:

a. Different positioning: solves problems for specific business scenarios, not a general-purpose open-source solution

b. Different goals: uses a browser architecture, not tied to a fixed frontend framework

> As long as you use the DOM layer or template layer within XCore's template scope, it works.

# Cloud-Based Real Device Wireless Debugging Solution

> Taobao, Xiao Yan

1. Real devices placed in data centers, remotely requested for debugging. Only available within Alibaba Group; external access is planned.
2. This kind of core competitive advantage probably won't be externally available.

# Ant Fortune's BFF Practice

> Ant Financial, Tang Yao

BFF: Backends for Frontends—an inevitable product of complex environments

**Core Idea**

Insert a Node layer between frontend pages and backend Java. Node directly calls Java jar packages (hessian). The Node layer handles multi-platform API access, trimming, formatting, and aggregation orchestration, controlling API count, standardizing data formats, outputting only user-relevant data to the interface, and also facilitating data mocking.

**Business Status**

1. Service layer API is relatively stable
2. Experience layer API changes frequently

**Scenarios**

Multi-app adaptation:
1. Unified error code management
2. Data consistency
3. Authentication
4. Business logging
...

**Aggregation**

1. Simplify client logic, reduce network overhead (after all, frontend may only need part of the backend API data)
2. Filter sensitive information

# Node.js Best Practices in YunOS

> YunOS, Yi Zhen

Integrating Node.js into YunOS's infrastructure

1. Optimization of the IO-priority Looper mechanism

   > 1. Node.js message loop is entirely driven by IO events
   > 2. Terminal devices need timely response for UI rendering and non-IO tasks

   Solution: merge system tasks with Node.js IO tasks, with roughly equal priority (system tasks slightly higher); system tasks integrate into Node.js queue via async events

2. Performance optimization

   > 1. Merge system-level JS module loading to reduce IO
   > 2. Code cache: pre-compile JavaScript to cache files, skip compilation at runtime
   > 3. Lazy loading for require: don't actually load modules until first access, reducing startup pressure

3. Proposed module unloading concept—but would top-level required modules always be available? Since you can't know if a module was unloaded somewhere

# NW.js: Programming with Integrated DOM and Node.js

> Intel, Wang Wenrui

NW.js (formerly node-webkit) integrates Chromium and Node.js. Felt dry, poorly presented, and insincere when answering questions.

1. Call Node.js directly from DOM
2. Introduced NW's main features and latest developments

Personally, I'm more optimistic about Electron—more mature applications (Atom, VSCode) and better community support.

# From React to ClojureScript

> Eleme, Ye Ti

1. Mainly introduced some functional programming concepts
2. JavaScript kind of self-mutilates to achieve functional programming
3. More introductory, surface-level

# Frontend Optimization in Practice with Big Data

> UC, Pang Jingui

1. Leveraging big data from UC Browser's massive user base for scenario-specific optimizations (very scenario-specific, somewhat hacky)
2. Data analysis through instrumentation in the browser kernel (hoping our own client WebView will implement similar instrumentation in the future)
