---
title: 给你心爱的 npm 包上个『北京户口』
date: 2020-09-27 12:45:00
categories: 前端
tags:
- Node.js
- JavaScript
---

** 记录解决如何批量将 npm 包从一个 npm 源迁移到另一个源 **

<!-- more -->

## 背景

一切从我司有两个 npm 源说起，一个叫杭州源，另一个叫北京源。本来各用各的相安无事，直到有一天我们想依赖另一个源的 npm 包时，就相互拉取不到对方的源了。杭州源这边也有做过兼容，当拉取的源不存在时，就尝试去北京源拉取，看似解决了这个问题。但是这只解决了我们依赖北京源的 npm 包的问题，而我们有大量的包需要推广到其它部门，因此我们决定切换到使用人数更多的北京源，目前团队正处于集体转向使用北京源的阶段，不过经常会遇到如下问题：

1. 项目拉取下来，执行 npm install，提示某些包不存在，然后查看当前源，切换到另一种源，继续 npm install；

2. 老项目使用杭州源，但是依赖了北京源的 npm 包，虽然杭州源会在拉取不到包时主动向北京源拉取，但是这个机制经常出问题，有时会阻塞服务的构建，得解决这个依赖问题才能重新构建项目；

3. 新项目使用北京源，但是依赖了杭州源的 npm 包，这个场景比较棘手，北京源没有向杭州源拉取包的机制，因此需要将杭州源的包重新在北京源上发布，如果采用手动发布，版本多的包会很繁琐还容易出错；如果只发布部分包，会导致两边不一致，导致无法拉取到未发布的包；

4. 发布一个包，只向杭州源发布，那使用北京源的项目很可能更新不到你的新版本，反之亦然；

**咋整？**


## 解决思路

为了加快结束这个过渡期，需要我们全面切换到北京源，有两个问题需要解决：

1. 团队内的杭州源 npm 包的各个版本需要在北京源重新发布一次，除了版本外，dist-tag 也要同步到北京源；

2. 通知团队成员将项目切换到杭州源，并不再使用杭州源，如有遗漏未同步到北京源的 npm 包告知我将其同步；

那么，我们团队有多少个包呢？已知的 @kd scope 下的包有 49 个，而更多的包都在 @dd scope 下，目前收集到的有 50 个。假设平均一个包有 10 个版本，那么粗略估计有上千个版本需要重新发布，所以手动是不可能手动的，得想法子通过自动化的方式批量同步。

来看看到底咋整吧！

## 实现方式

作为一个前端开发，当然选择 Node.js 来编写脚本或命令行工具解决这种重复劳动了！先来回顾下如何发布一个 npm 包：只要进入 npm 包的根目录，执行 `npm publish` 即可。所以我们只要找到一个方式能获取到每个包的每个版本的所有代码即可！那有这种方式吗？

有的，有的！回忆下你使用 `npm view` 查询一个 npm 包时的情形：

![](/images/npm-sync1.jpg)

聪明的你肯定发现 `.tarball: https://registry.npmjs.org/koa/-/koa-2.13.0.tgz`，这个包正是当前最新版本 2.13.0 的 koa 包。下载解压后发现这正是我们要的，只要进入该目录执行 npm publish 即可：

![](/images/npm-sync2.jpg)

那我们能获取指定版本的 tgz 包吗？当然，使用 `npm view koa@1.0.0` 即可查看指定版本。等等，我没法知道当前 koa 包有哪些版本诶？别慌，试试这个命令 `npm view koa --json`，答案就藏在 `versions` 字段里：

![](/images/npm-sync3.jpg)

此外 `dist-tags` 字段也需要同步（ *默认不同步 tag，这有可能导致杭州源的 tag 覆盖了北京源的 tag，而杭州源的 tag 可能不是最新的*）。

目前万事俱备，离搞定只差一个程序猿了！核心逻辑即是根据包名拉取所有版本的 tgz 压缩包，同时解压所有 tgz 压缩包，进入对应目录执行 npm publish：

```js
// 获取该包的所有版本
let result
try {
  result = await execa.command(`npm view ${npmPacakgeName} --json --registry=${from}`)
} catch (error) {
  // 查询失败的日志写入文件，方便追踪
  console.log(chalk.red(`获取列表失败：${npmPacakgeName}`))

  const content = await fs.readFile(errorLogFile)

  await fs.writeFile(errorLogFile, `${content}\n获取列表失败：${npmPacakgeName}: ${error.stack}`)
  return
}

const json = result.stdout ? eval(`temp = ${result.stdout}`) : {}

const tagTaskList = Object.keys(json['dist-tags']).map(npmPackageTag => {
  return async () => {
    try {
      await execa.command(`npm dist-tag add ${npmPacakgeName}@${json['dist-tags'][npmPackageTag]} ${npmPackageTag} --registry=${to}`)
      console.log(chalk.green(`成功同步 tag：${npmPacakgeName}@${npmPackageTag}`))
    } catch (error) {
      // 发布失败的日志写入文件，方便追踪
      console.log(chalk.red(`tag 添加失败：${npmPacakgeName}@${json['dist-tags']}`))

      const content = await fs.readFile(errorLogFile)

      await fs.writeFile(errorLogFile, `${content}\ntag 添加失败：${npmPacakgeName}@${json['dist-tags']}: ${error.stack}`)
    }
  }
})

const publishTaskList = json.versions && json.versions.map(npmPacakgeVersion => {
  // 该包每个版本的处理逻辑
  return async () => {
    try {
      // 如果 ${to}已经存在该版本，则不处理
      // FIXME: 处理 ${to}不存在该包的情况
      let result

      try {
        result = await execa.command(`npm view ${npmPacakgeName}@${npmPacakgeVersion} --registry=${to}`)

        if (result.stdout) {
          console.log(chalk.green(`已存在于 ${to}，无需同步：${npmPacakgeName}@${npmPacakgeVersion}`))

          return
        }
      } catch (error) {
        if (!error.message.includes('npm ERR! code E404')) {
          throw error
        }
      }

      // 去除形如 @scope 的字符串
      const packagePath = path.join(__dirname, npmPacakgeName, `${npmPacakgeName.replace(/@.*\//, '')}-${npmPacakgeVersion}`)
      const tgzPath = `${packagePath}.tgz`

      // 下载包
      await download(
        `${from}/${npmPacakgeName}/download/${npmPacakgeName}-${npmPacakgeVersion}.tgz`,
        npmPacakgeName
      )
      // 解压包
      await compressing.tgz.uncompress(
        tgzPath,
        packagePath
      )
      // 删除压缩包
      await execa.command(`rm ${tgzPath}`)
      // 发布
      await execa.command(`npm publish --tag=sync --registry=${to}`, {
        cwd: path.join(packagePath, 'package')
      })
      console.log(chalk.green(`${npmPacakgeName}@${npmPacakgeVersion} 成功同步 ${to}！`))
    } catch (error) {
      // 发布失败的日志写入文件，方便追踪
      console.log(chalk.red(`version 发布失败：${npmPacakgeName}@${npmPacakgeVersion}`))

      const content = await fs.readFile(errorLogFile)

      await fs.writeFile(errorLogFile, `${content}\nversion 发布失败：${npmPacakgeName}@${npmPacakgeVersion}: ${error.stack}`)
    }
  }
})
// 限制并行数为 5，防止 npm 网站报错
await Promise.all(publishTaskList.map(pLimit(5)))
// 修复所有 tag，并行会导致不成功，此处改为串行
// 默认不同步 tag，有可能导致${from}的 tag 覆盖了 ${to}的 tag，而${from}的 tag 可能不是最新的
if (options.syncTag) {
  await Promise.all(tagTaskList.map(pLimit(1)))
}
```

请留意并行问题，并发量太大 npm 网站会报错（估计被拦截了）。

## 如何使用

本来仅提供脚本执行方式，为了让大家也能方便使用（不要再叫我同步了）。贴心的我已把这个脚本实现为一个命令行工具，使用方式如下：
> 内部工具，此处不提供，大伙可自行实现

### 安装命令行

`npm i @dd/npm-sync -g`

### 执行版本同步

`npm-sync packageName`

### 执行版本和tag同步

`npm-sync packageName --syncTag=true`

### 更多使用方式

`npm-sync --help`

## TODOS

> 欢迎提交代码

- 支持『发布前有编译钩子』的包
- 登录前置校验



