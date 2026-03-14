---
title: "Building a Local API Mock Service for Front-End Applications"
toc: true
date: 2019-07-21 09:15:11
categories: Engineering
tags:
- Node.js
- JavaScript
- CLI Tools
---

Life without a mock service is unbearable.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2019/07/21/%E4%B8%BA%E5%89%8D%E7%AB%AF%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E4%B8%80%E4%B8%AA%E6%9C%AC%E5%9C%B0%E6%8E%A5%E5%8F%A3%20mock%20%E6%9C%8D%E5%8A%A1/">简体中文</a>.
</div>
</article>



## Background

During local development, we currently debug APIs through two approaches: connecting directly to the test environment, or modifying the code. The former is highly dependent on the backend's data state and service stability, making local development susceptible to external factors. The latter -- modifying code -- is error-prone; if multiple code changes are involved, you have to revert all those scattered modifications, creating unnecessary mental overhead. Therefore, neither approach achieves a good separation of front-end and back-end development.

Ideally, the front-end should use an API mock service during the development phase, and only switch to the test environment for joint debugging with the backend once the workflow is validated.



## Are There Existing Tools?

Yes. Currently, the company has an existing mock platform that supports this need. However, because our application uses a gateway approach to call backend methods -- meaning all APIs hit the same endpoint and differentiate between dubbo methods via query parameters -- the mock platform doesn't support this scenario well. You would need to add multiple HTTP methods to the same API endpoint and then set different "expectations" to return different data based on different query parameters. Moreover, the project has no established habit of writing mock interface configurations, and it's impossible to configure and debug over a hundred interfaces one by one. Therefore, integrating mock services can't be done overnight.



## What Can We Do?

Given the situation above, I believe we can solve this by developing **a local API mock service** as follows:

Start a mock service locally. When a corresponding mock JSON file exists locally for an interface, use the mock data first; otherwise, fall back to the test environment. This ensures that the project remains unaffected by external factors during the development and debugging phase, achieving complete front-end/back-end separation (by switching environments to decide whether to connect to mock or test environment APIs), while also enabling gradual mock coverage of hundreds of interfaces.



## Why Use a Local Mock Service Instead of an Online One?

Whether at my previous company or my current one, there are multiple online mock services -- some led by the front-end team, others by the testing team. These services are either used by only a handful of projects or barely used at all. Most of them fail to solve these two problems:

1. How can legacy projects quickly integrate? Each legacy project involves dozens to hundreds of interfaces, making it nearly impossible to proactively onboard these platforms.
2. How can interfaces avoid interfering with each other? In the same codebase, Developer A modifies interface M to return N for testing workflow X, while Developer B needs interface M to return P for testing workflow Y -- creating a conflict. (During the development phase, external interference should be minimized as much as possible. Building a feature shouldn't be blocked by mock interface changes or test environment failures.)

A local mock service can effectively solve Problem 1 by caching test or production environment API data. Problem 2 is solved by caching API data locally -- meaning Developer A's local operations won't affect Developer B's debugging.

That said, I believe local mock and online mock services are not mutually exclusive. They can sync API data with each other, maintaining the convenience of online interface management while isolating the mutual interference caused by editing interface responses online.



## What Else Can We Do With It?

For this pattern of caching test data locally, I thought of an interesting use case. During joint debugging with the backend, you can start the local development server with a specific parameter that forces every interface to sync data from the test environment. Then, by clicking through the pages involved in the debugging workflow, all the interfaces along that path get cached. After restarting the local development server, the same workflow will use the cached interfaces, achieving "workflow replay." This eliminates the dependency on the backend to repeatedly create test data, which is extremely convenient for B-side applications that have many workflows and long step sequences -- where each step often depends on a specific state that changes after every step.
