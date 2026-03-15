---
title: "A Memorable Frontend-Backend Separation"
toc: true
date: 2017-12-15 21:34:11
categories: Work Journal
tags:
- JavaScript
- Node.js
- Refactoring
- Frontend-Backend Separation
---

Refactoring the company's legacy JSP project by introducing a Node.js layer.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2017/12/15/%E8%AE%B0%E4%B8%80%E6%AC%A1%E9%9A%BE%E5%BF%98%E7%9A%84%E5%89%8D%E5%90%8E%E7%AB%AF%E5%88%86%E7%A6%BB/">简体中文</a>.
</div>
</article>

![image](/post-img/用户中心重构.png)


## Maintainability

### Code Standards

Adopted and integrated ESLint.

> I once worked on a project that had errors all over the screen.

> It had ESLint configured but wasn't following the configuration during development. In cases like that, it would actually be better not to have ESLint at all.



### ES6 Modules

> Combined with webpack2, this enables tree shaking.



### Comments and Variable Naming

> Only comment when necessary: counterintuitive code, code with significant background context, or step-by-step processes.



```js
// 1
const getNextPageUrlAfterCheckPhone = () => ()
const nextPageUrl = getNextPageUrlAfterCheckPhone()

// 2
const getUrl = () => () //  验证手机后，返回下一步的页面地址
const url = getUrl() // 获取接下来需要跳转的页面地址
```



> Code may pass through many hands. Everyone makes changes, and the logic evolves, but comments often stay the same. Eventually, outdated comments end up misleading the reader.



## On Regrets

### Documentation

#### 1. External Project Documentation

* Maintained through an online API documentation center for easy access.
* After all, documentation is meant for others to read.


### 2. Backend Integration Documentation

* Also maintained through an online API documentation center for easy access.
* Changes to API documentation trigger notifications for easy synchronization.
* Mock data can be synced locally.

### Utils Boundaries

* Once you start using a component named `utils`, no matter how clean it is initially, it inevitably becomes bloated over time.
* Use more specific names instead, such as `formValidationUtils` for form validation utilities, or `URLUtils` for URL manipulation utilities.




### Style Changes

* Unified style naming to lowercase with `-` as the separator instead of camelCase.
* The original project's mobile styles were fairly maintainable — most were split by page level.
* Although the PC version had its independent styles extracted after refactoring, the shared styles were massive and had short class names, making it difficult to refactor using batch find-and-replace.




### The Outdated jQuery

* We took a step backward historically by converting some Vue pages back to jQuery.
* Many components directly depended on jQuery, making migration extremely difficult.
* For example, the project's Vue version supported mixed use with jQuery, but the latest version of Vue directly manipulates DOM nodes, causing some jQuery DOM methods to break.
