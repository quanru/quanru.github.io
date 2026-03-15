---
title: A Scientific Approach to ESLint Governance in Legacy Projects
toc: true
date: 2020-09-28 12:50:11
categories: Work Journal
tags:
- JavaScript
- Engineering Governance
---

An effective and practical approach to ESLint governance.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2020/09/28/%E8%AE%BA%E5%A6%82%E4%BD%95%E7%A7%91%E5%AD%A6%E5%9C%B0%E6%B2%BB%E7%90%86%E8%80%81%E9%A1%B9%E7%9B%AE%E7%9A%84%20eslint/">简体中文</a>.
</div>
</article>

## Background

There are always those legacy projects where, when the boss asks you to jump in and develop a feature, you get a sinking feeling — afraid that once you push your changes to production, everything will crash. Yet you nervously start developing, hoping to get in and out as quickly as possible. Beyond the band-aid style business logic, what truly undermines your confidence is the lack of ESLint in the project. One careless mistake becomes a low-level syntax error causing a crash. Even worse is when ESLint is configured but nobody follows it. Imagine an editor screen full of red errors and yellow warnings — at that point, you've become desensitized to the errors and end up going with the flow. There's a criminology theory that applies perfectly to software engineering: the "Broken Windows Theory":

> This theory suggests that if signs of disorder in an environment are left unaddressed, they encourage people to imitate and even escalate the behavior. Take a building with a few broken windows: if those windows aren't repaired, vandals may break more windows. Eventually they may even break into the building, and if they find it unoccupied, they might squat there or set it on fire. A wall with some graffiti that isn't cleaned will quickly become covered with messy, unsightly marks. A sidewalk with a few pieces of litter will soon accumulate more trash, and eventually people will see it as perfectly normal to toss their garbage on the ground.

As time passes, such projects become increasingly difficult to maintain. Of course, this difficulty isn't solely an [eslint](https://www.npmjs.com/package/eslint) issue — it involves a whole range of conventions and standards. Defining conventions and standards is easy; the challenge is ensuring they're actually followed. This article focuses on [eslint](https://www.npmjs.com/package/eslint) governance, using a project that's still actively maintained as an example to illustrate how to govern such legacy projects.



## Current State

The existing [eslint](https://www.npmjs.com/package/eslint) error and warning counts:

![](/post-img/eslint1.png)

Of these, 5,697 errors and 65 warnings could be auto-fixed, leaving 6,468 remaining after auto-fix. Investigation revealed that the project was using strict rule sets like Airbnb. Because the rules were so strict and there was no reliable mechanism to prevent non-compliant code from being committed, developers were even less willing to comply, and the error count kept growing. Even after auto-fixing, there were still 6,000+ errors. Therefore, choosing and defining a rule set that everyone can actually follow is crucial. Avoid falling into the trap of "stricter is better" — always remember that the goal is to ensure code meets a reasonable standard to prevent low-level errors.



## Solution

After research and discussion, we adopted the following rule set:

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



We integrated [prettier](https://www.npmjs.com/package/prettier) and [lint-staged](https://www.npmjs.com/package/lint-staged). The former ensures that any given piece of code produces exactly one deterministic format. The latter prevents new [eslint](https://www.npmjs.com/package/eslint) errors from being introduced by enforcing validation on modified files, gradually reducing the error count over time.



## Results

ESLint's default output only supports file-level statistics, which is unsuitable for projects with massive error counts where nearly every file has a significant number of errors. Here we use the tool [eslint-formatter-stats](https://www.npmjs.com/package/eslint-formatter-stats) to analyze errors by rule type. The results are as follows:

### ESLint Results After Integration (Before Fixes)

![](/post-img/eslint2.png)

10,959 errors and warnings

### ESLint Results After Integration and Fixes

![](/post-img/eslint3.jpg)

837 errors and warnings



## Analysis

### Error Count

After integration and fixes, the error count was only 800+. The boss said, well, if we lower our standards a bit, our ESLint situation is actually pretty good.

### Investigation
Most of the top-ranking errors by count don't affect program functionality, and to ensure production stability, this round of governance avoided changing anything beyond auto-fixes. Therefore, we decided to focus on several high-risk errors that do or could cause real impact:


1. `no-undef` — using undefined variables. This type of error is very likely to cause a crash. Currently 13 instances.
2. `import-no-unresolved` — importing non-existent modules. Currently 6 instances.
3. `react-no-key` — array elements without a `key` prop. This can cause performance issues. Currently 4 instances.
4. `react-native-no-unused-styles` — unused styles that increase app bundle size. Currently 45 instances.
5. `no-dupe-keys` and `no-duplicate-case` — duplicate object keys or switch cases that introduce uncertainty. Currently 7 instances.
6. `react/no-direct-mutation-state` — directly modifying `this.state`, which may cause state updates to not take effect. Currently 21 instances.

Additionally, errors like non-camelCase variable names and loose equality checks (`==`), if present in large numbers, should be downgraded to warnings or turned off entirely — they're ultimately harmless. After the above fixes, the remaining cleanup can be left to [lint-staged](https://www.npmjs.com/package/lint-staged).
