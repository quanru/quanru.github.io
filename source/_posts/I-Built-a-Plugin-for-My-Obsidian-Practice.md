---
title: "I Built a Plugin for My Obsidian Practice"
date: 2023-07-16 13:40:09
categories: Second Brain
tags:
- LifeOS
- PKM
- Periodic Notes
---

Building an Obsidian plugin for [A Practical Approach to Building My Second Brain with Obsidian](https://quanru.github.io/2023/06/18/%E4%B8%80%E7%A7%8D%E5%AE%9E%E7%94%A8%E6%96%B0%E5%9E%8B%20Obsidian%20%E5%AE%9E%E8%B7%B5%E4%B9%8B%E6%9E%84%E5%BB%BA%E6%88%91%E7%9A%84%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91%20%F0%9F%A7%A0/)!

The content of this article is out of date. Please refer to the official website [LifeOS](https://lifeos.vip) for more information.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2023/07/16/%E6%88%91%E7%BB%99%E6%88%91%E7%9A%84%20Obsidian%20%E5%AE%9E%E8%B7%B5%E5%86%99%E4%BA%86%E4%B8%80%E4%B8%AA%E6%8F%92%E4%BB%B6/">简体中文</a>.
</div>
</article>

## Background

After recently sharing my Obsidian practice ([A Practical Approach to Building My Second Brain with Obsidian](https://quanru.github.io/2023/06/18/%E4%B8%80%E7%A7%8D%E5%AE%9E%E7%94%A8%E6%96%B0%E5%9E%8B%20Obsidian%20%E5%AE%9E%E8%B7%B5%E4%B9%8B%E6%9E%84%E5%BB%BA%E6%88%91%E7%9A%84%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91%20%F0%9F%A7%A0/)), it has helped several people:
1. A colleague I didn't know said after trying it, "It's like discovering a new continent," and sent me a red envelope to buy coffee
2. An internet stranger said after trying it, "It fulfills all my needs for personal knowledge management," and even wrote an onboarding document for it

Beyond strangers, I also recommended it to many familiar colleagues and friends and received lots of feedback, such as high onboarding costs, difficulty keeping up with updates, and the inability to distinguish projects in the graph view (everything shows as README.md).

## Goals

Considering the above issues, I decided to build a plugin with the following main goals:

1. Lower the onboarding cost, especially for non-programmers
2. Deliver updates promptly, whether new features or bug fixes
3. Increase the user base to get feedback and collaboratively improve the workflow

> At the end of this article, I also introduce a gradual approach to using this plugin!

## The Old Way

In the example template without the plugin, there were several types of "program code":

1. Script types
	- Date parsing [date](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Scripts/date.js)
		- Parse dates from periodic note filenames
		- Get date ranges from parsed dates
		- Get file lists from parsed dates
	- Task queries [task](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Scripts/task.js)
		- Get task lists based on date ranges
	- Project queries [project](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Scripts/project.js)
		- Get current project list snapshot
		- Get project list within date range
		- Calculate time spent and proportion on projects within date range
	- Area queries [area](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Scripts/area.js)
		- Get current area list snapshot
		- Get area list within date range
2. View types
	- Task completion view [taskDoneList](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Templates/PeriodicNotes/views/taskDoneList.js)
		- Placed in periodic notes, gets completed tasks within the current date range
	- Task record view [taskRecordList](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Templates/PeriodicNotes/views/taskRecordList.js)
		- Placed in periodic notes, gets collected tasks within the current date range
	- Project list view [projectList](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Templates/PeriodicNotes/views/projectList.js)
		- Placed in periodic notes, gets project time proportion within the current date range
	- Area list view [areaList](https://github.com/quanru/obsidian-example-LifeOS/blob/1.0.1/Templates/PeriodicNotes/views/areaList.js)
		- Placed in periodic notes, gets area list within the current date range

Distributing code directly with the example template greatly increased onboarding costs, and users couldn't update these scripts.

## The New Way

Therefore, I decided to build a plugin to encapsulate both types of "program code" above, providing "views" through "markdown code blocks." This way, users only need to know Markdown to read and use them. So what views does my plugin implement?

In the [previous article](https://quanru.github.io/2023/06/18/%E4%B8%80%E7%A7%8D%E5%AE%9E%E7%94%A8%E6%96%B0%E5%9E%8B%20Obsidian%20%E5%AE%9E%E8%B7%B5%E4%B9%8B%E6%9E%84%E5%BB%BA%E6%88%91%E7%9A%84%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91%20%F0%9F%A7%A0/), I mentioned that my practice has two contexts that keep me focused:
- One is time-based (Periodic Notes)—when I reach a certain time point, I work based on the corresponding periodic note, which contains sufficient context
- Another is topic-based (PARA)—when I want to investigate a certain topic, I work based on the corresponding topic's index (README.md), which has already collected considerable context

Therefore, the views the plugin needs to implement are also based on these two contexts. For example, a monthly note (2023-07) should contain the context of all diary and weekly note tasks within July; for a PARA project (Share-2023-WOT Conference), its context should include all tasks and records tagged with `#WOT`.

The plugin currently provides three main categories of views:

### Query by Time Context

The same code block below, placed in different periodic notes (monthly, weekly, daily), will parse and retrieve "Completed Task List (TaskDoneListByTime)", "Recorded Task List (TaskRecordListByTime)", "Involved Project List (ProjectListByTime)", and "Involved Area List (AreaListByTime)" for the corresponding time range.

~~~markdown
```PeriodicPARA
TaskDoneListByTime
```
~~~


~~~markdown
```PeriodicPARA
TaskRecordListByTime
```
~~~


~~~markdown
```PeriodicPARA
ProjectListByTime
```
~~~

~~~markdown
```PeriodicPARA
AreaListByTime
```
~~~


### Query by PARA Context

The same code block below, placed in README.md files in different PARA directories (e.g., 1. Projects/Share-2023-WOT Conference/README.md), will query the [Metadata](https://help.obsidian.md/Editing+and+formatting/Metadata) tags field declared in README.md and retrieve "Task List tagged with those tags (TaskListByTag)" and "Bullet List tagged with those tags (BulletListByTag)".

~~~markdown
```PeriodicPARA
TaskListByTag
```
~~~

~~~markdown
```PeriodicPARA
BulletListByTag
```
~~~

### Query by Directory

For an overview of current PARA, there's also a directory-based view category, such as querying "All projects in the current project directory (ProjectListByFolder)", "All areas (AreaListByFolder)", "All resources (ResourceListByFolder)", and "All archives (ArchiveListByFolder)".

~~~markdown
```PeriodicPARA
ProjectListByFolder
```
~~~

~~~markdown
```PeriodicPARA
AreaListByFolder
```
~~~

~~~markdown
```PeriodicPARA
ResourceListByFolder
```
~~~

~~~markdown
```PeriodicPARA
ArchiveListByFolder
```
~~~


Besides the above views, the plugin also provides helper functions for use in periodic note templates. Currently there's only one: generating a list of README.md files under a specified directory. For example:

This template statement:
~~~markdown
<% PeriodicPARA.Project.snapshot() %>
~~~

Will be replaced with:

~~~markdown
1. [[1. Projects/x-project/README|x-project]]
2. [[1. Projects/y-project/README|y-project]]
~~~

This way, the project list is frozen as a snapshot when the daily note is created, serving several purposes:
- Record which days each project went through, with manual daily project time tracking
- In the future, weekly and monthly notes can aggregate which projects existed and track weekly/monthly project time

## How to Gradually Adopt This System?

In the [previous article](https://quanru.github.io/2023/06/18/%E4%B8%80%E7%A7%8D%E5%AE%9E%E7%94%A8%E6%96%B0%E5%9E%8B%20Obsidian%20%E5%AE%9E%E8%B7%B5%E4%B9%8B%E6%9E%84%E5%BB%BA%E6%88%91%E7%9A%84%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91%20%F0%9F%A7%A0/), I mentioned that my practice consists of two systems: Periodic Notes and PARA. I later realized that practicing both simultaneously has a steep learning curve, especially for users who have never used Obsidian and don't understand PARA. My advice for such users is: feel free to start with just Periodic Notes, removing everything PARA-related from the templates. You'll still benefit from "DailyLog" and "time-based context"—just record your daily diary, and leave the rest to weekly, monthly, quarterly, and yearly reviews. Once you've practiced this and formed your own views and feelings, you can consider top-down task planning in weekly and monthly notes, and goal setting in quarterly and yearly notes!


## What's Next?

After using this workflow myself, I've truly gained a lot—which is why I can follow this practice day after day! I hope more users will try this system and co-create together, making it iterate faster, benefiting not just me but everyone!

Below is the small work I've done based on feedback received after publishing the [previous article](https://quanru.github.io/2023/06/18/%E4%B8%80%E7%A7%8D%E5%AE%9E%E7%94%A8%E6%96%B0%E5%9E%8B%20Obsidian%20%E5%AE%9E%E8%B7%B5%E4%B9%8B%E6%9E%84%E5%BB%BA%E6%88%91%E7%9A%84%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91%20%F0%9F%A7%A0/):
1. Developed a plugin to lower the barrier, providing query views for periodic notes and PARA, hiding all complex query statements
2. Graph view optimization: supporting XXX.README.md as index files in PARA directories, otherwise all nodes would be README
3. Single source of truth: users only need to set metadata, and the plugin handles reading it

![](/post-img/w28-1.png)
![](/post-img/w28-2.png)
![](/post-img/w28-3.png)
![](/post-img/w28-4.png)
