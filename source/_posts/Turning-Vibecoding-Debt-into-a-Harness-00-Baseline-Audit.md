---
title: "Turning Vibecoding Debt into a Harness (00): Building a Local Harness in Public, on a Real Repo"
toc: true
date: 2026-06-03 20:00:00
categories: Engineering
tags:
  - Harness
  - Vibecoding
  - AI Agent
  - Monorepo
  - Build in Public
---

If you also write real product code with AI, this feeling will be familiar: a feature ships fast, but a few days later you change something else and the earlier thing quietly breaks.

Every release needs a human in the loop — deciding by hand which tests to run, which logs to read, which failures to ignore, and which ones must be fixed. There's no real confidence underneath it.

I'm building a harness now, not out of engineering perfectionism, but because these pain points have shown up too many times. So I decided to do this in public — a Build in Public series with one theme: **standing up a harness inside a real monorepo.**

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2026/06/03/%E6%8A%8A%20Vibecoding%20%E7%9A%84%E5%80%BA%E5%8F%98%E6%88%90%20Harness%2000%20%E5%85%AC%E5%BC%80%E6%90%AD%E4%B8%80%E5%A5%97%E6%9C%AC%E5%9C%B0%20harness/">简体中文</a>.
</div>
</article>

It's not that there are no tests. It's the nagging sense that this change might have broken something again.

This first post is a baseline audit: measuring reality, completely. Not talking concepts, and not demoing on a clean toy repo.

I'll keep updating it:

1. From day one, lay every failure out in the open
2. Then step by step turn it into a one-command local check
3. that produces a report
4. that can back a release
5. and that lets an AI Agent enter a fixed self-check loop after coding

## Important context

This repo has no GitHub Actions at all. Every build, test, and release runs purely locally on a single Mac mini.

So the goal here is not to put CI in the cloud first. It's to build a fully local harness that:

1. Reproduces reliably on this machine
2. Gives a clear result before a release
3. Surfaces the parts that can be made public
4. Keeps the logs that can't be public local
5. Leaves a verification record an AI Agent can read later

This is not a CI best-practices guide, nor a testing-framework tutorial. It's closer to a live experiment: after AI writes the code, how does local dev verification stop relying entirely on a human backstop?

After finishing a survey on Agent Harnesses recently, I'm more convinced of one thing: a lot of the time the model isn't the bottleneck — it's the environment, tools, context, logs, verification, and permissions *around* the model that were never set up. That outer layer is exactly what this series tries to fill in.

## This series covers two things

**Thing one: the local dev verification loop.**

Every time an AI Agent finishes a round of changes, it can't just stop at "I'm done." It has to run the feature itself, look at the result, leave a record, and hand the uncertain parts back to a human.

The hard part is that the verification targets aren't a single platform:

1. Expo / React Native mobile
2. Electron desktop
3. Rspress sites
4. An Obsidian plugin
5. A Chrome extension
6. server
7. daemon
8. CLI

These all start up differently, have different fixtures, and surface results differently. So a harness can't just be "run the test command." It has to gradually settle into a set of local self-check actions:

1. How to prepare the environment
2. How to launch the target
3. How to operate the feature
4. How to observe logs, screenshots, stdout, files, or network responses
5. How to judge whether this round is actually correct

**Thing two: the local pre-release gate.**

When it's really time to ship, no more "feels like nothing broke" — there's a clear local verification record instead.

What I ultimately want to solve is concrete:

1. How to reduce repeated rollbacks
2. How to spend less time babysitting tests by hand
3. How to make AI enter a fixed self-check loop after writing code
4. How to turn "feels fine" before a release into "I know what I just checked"

## Why this repo?

I didn't pick a clean demo, and I didn't pick a well-maintained project. That would be easy to write up and screenshot nicely, but not very convincing.

This time I picked one of my own private repos. It's real enough, and messy enough.

This repo grew up alongside Vibecoding. Early on, for speed, lots of features just got something running. To validate ideas, lots of boundaries never got named carefully. To let AI keep building, scripts, tests, mocks, fixtures, and ad-hoc conventions piled up layer by layer.

More importantly: I no longer maintain it by reading all of the code. In many places I no longer remember why it was written that way; for some modules I only remember that they should work, not how they actually work.

That actually makes it a great harness target — because this is exactly where a harness earns its keep:

**Not relying on the author's memory to explain the repo, but letting the repo expose its own reality.**

![Why this repo](/post-img/harness-00-why-this-repo-en.png)

## It's not a single app either

Going by the product list on lifeos.vip/about, excluding Midscene, this repo maps to Aino, Vibelet, LifeOS, DeepAsk, and Calendar Pro.

All of these product lines live in this one monorepo:

- Aino is a native-notes and AI workspace.
- Vibelet is a Claude / Codex remote control on your phone.
- LifeOS is an Obsidian PKM system.
- DeepAsk spans Obsidian and Chrome.
- Calendar Pro is the calendar and task-planning layer inside Obsidian.

![lifeos.vip/about products section](/post-img/harness-00-about-products-en.png)

I recounted from the `package.json` files under `apps`:

1. 18 top-level directories under `apps`
2. 16 of them are app packages with a `package.json`
3. plus 31 shared packages

These 16 app packages aren't the same kind of thing:

1. 3 mobile apps: Aino Mobile, Vibelet App, Remosidian Mobile
2. 1 desktop app: Aino Desktop
3. 4 web / docs sites: Aino Site, LifeOS Site, Remosidian Site, Vibelet Site
4. 1 Obsidian plugin
5. 1 Chrome extension
6. 2 server entrypoints
7. 2 CLIs
8. 1 daemon
9. 1 video / content build app

![Stack inventory](/post-img/harness-00-stack-inventory-en.png)

This isn't a "weekend toy" personal project either. Some of these products are shipped mobile apps, an Obsidian plugin, a Chrome extension, and paid products.

Take the LifeOS line as an example — the about page publicly states: 1k open-source stars, 46k downloads, 1000+ paying users.

So behind this repo there are real users, real revenue, and real maintenance pressure. This harness isn't facing one page, one service, one package — it's facing a set of things that have already grown into products.

## Repo scale: a day-0 audit

1. pnpm + Nx monorepo
2. 16 app packages
3. 31 shared packages
4. 874 test files on the source side
5. 8066 test cases identified statically

That 8066 isn't a precise runtime count. After excluding `node_modules`, `dist`, `build`, `out`, and `.tmp`, I counted direct `test(...)` / `it(...)` calls in the test sources. It misses dynamically generated and parameterized cases, but it's already enough to show the scale.

Distribution highlights:

1. apps/aino-desktop: 300 test files, 1737 cases
2. apps/vibelet-app: 130 test files, 1397 cases
3. apps/vibelet-daemon: 75 test files, 1152 cases
4. apps/obsidian-plugin: 83 test files, 869 cases

![Baseline audit data](/post-img/harness-00-baseline-map-en.png)

## There's a very real contradiction here

You can't blindly run the full test suite on every release. Not because the full suite doesn't matter, but because the cadence of development and release has changed in the AI era.

It used to take a person days to accumulate a batch of changes. Now an AI Agent can finish multiple features and multiple packages in a single day, sometimes touching mobile, desktop, plugin, extension, and server all at once.

Once releases get this frequent, running all 8066 static cases plus every build, e2e, and fixture check, plus capturing live run logs, in full every single time — the local flow quickly gets so slow that nobody wants to use it.

But you can't skip it just because it's slow, either. This repo has real users and paying users. If a release rests only on "feels fine this time," sooner or later you re-break something that was already fixed.

**So the problem the harness solves is not "run fewer tests."**

What it really does is layer the pre-release verification:

1. Which checks are the smoke that runs every time
2. Which are selected by the change impact between two releases
3. Which situations must escalate to a full regression

That way a local release is neither superstition nor hostage to the full suite.

## What day 0 actually produced

The repo has Vitest, Node test, `tsx --test`, Jest, and Playwright Electron all at once.

The root looks like it has a unified entrypoint, `pnpm run test:unit` — but when I actually ran it, it didn't pass.

Running the existing entrypoint, I found a few representative failures:

1. caldav-core: misaligned mock boundaries
2. vibelet-cli: unstable fixtures
3. Aino Desktop Electron e2e: a React alias path assumption that doesn't hold

But plenty of checks did pass:

1. scripts-unit passes
2. workspace exports passes
3. dependency version passes
4. Aino Desktop already has Playwright fixtures, a temp vault, and a temp userDataDir

## Day-0 conclusion

**This repo isn't short on tests. What's missing is a harness layer that organizes those test assets.**

Next I'm not going to chase coverage first. I'm going to make the initial failures:

1. Reproducible
2. Classifiable
3. Reportable
4. Continuously feedable into the local check flow

I started with a minimal Smoke Harness. Right now 6 suites all pass, taking 27.3 seconds on the Mac mini, with a summary plus artifacts. And this is only the starting point.

## One last thing

The question really worth asking is: why didn't these problems surface reliably before?

The answer: my past workflow was too fragmented. There was no fixed place where all the checks showed up together.

The point of the first smoke version isn't how much it covers — it's that it starts to change the *shape* of the problem: from "I don't know what to run or which failures matter" to "these 6 suites are the current first gate."

The essence of this series is a test: can a real repo, pushed to grow by Vibecoding, become controllable again through a local harness?

The debt Vibecoding brings doesn't necessarily have to be paid off by a human re-reading all the code. Maybe you can start with a harness, and let the repo learn to expose its own problems.

If you also maintain real products with AI, follow along — let's compare notes.

Next post I'll write about how those three failures were handled. But the point isn't how AI fixes bugs — it's how to turn a one-off fix into a local check that stays visible every time afterward.
