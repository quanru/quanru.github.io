---
title: 使用 Node.js 将珍藏的 bash 脚本封装成命令行工具
date: 2020-10-02 00:19:13
categories: 前端
tags:
- Node.js
- JavaScript

---

阐述如何将一个常用的 bash 脚本融入 npm 生态之中，此处以最近遇到的一个 CR 提交脚本为例。

<!-- more -->

## 背景

作为程序猿，大家或多或少地都用过 GitHub 上的 merge request 功能。当然，除了这类 Code Review 方式，不少公司都有自己的 Code Review 平台，我司也不例外，我们使用了类似 [Gerrit](https://www.gerritcodereview.com/) 的工具，此处我们暂且以 Gerrit 指代。由于最近在治理工程时，需要全面切（要）到（求）使用 Gerrit 进行 CR 提交。发现 Gerrit 提交命令不是那么好记，经常需要先 git push，接着被拦截报错之后，再根据提示复制命令行，再次执行方可成功提交 Gerrit 。作为攻城狮，这有点难以忍受了！！！

## 诉求

### 一、有没有单独的命令让我直接提交 Gerrit？
### 二、有没有命令行工具，我直接安装就能使用？
### 三、在 git push 后，经由 git hook 拦截后按需提交 Gerrit？

## 解决

### 一、有没有单独的命令让我直接提交 Gerrit？

> 答：有的，有次同事见我提交 Gerrit 不顺畅，转发了一个 bash 脚本给我：你把它复制到 /usr/local/bin 目录下，就能直接使用 gerrit 执行了，珍藏脚本如下（gerrit）：

  ```bash
  branch=$(git symbolic-ref --short -q HEAD)
  git push origin HEAD:refs/for/${branch}
  ```

### 二、有没有命令行工具，我直接安装就能使用？

> 答：有的，既然都有脚本了，作为前端开发，必须用心爱的 Node.js 封装一个命令行工具，只需两步即可使用：首先执行 npm i @dd/gerrit-cli -g ；接着在工程目录下执行 gerrit 即可使用。

### 三、在 git push 后，经由 git hook 拦截后按需提交 Gerrit？

> 答：有的，如果你还觉得全局安装命令行太麻烦，或者害怕新人来了一脸懵逼。那么，还可以借助 git hook 进行拦截，用户只需要『无脑地』执行 git push 即可。当然前端这块有现成的 git hook 神器，它就是人见人爱的[哈士奇](https://www.npmjs.com/package/husky)，至于其它语言生态，大家找找应该有的。

**我们来看看如何封装上述脚本吧！**

## 实现方式

### 1.配置命令
如何能让别人安装你的 npm 包时，就能在终端中执行命令行呢？只需对你的 npm 包的 package.json 添加 bin 字段：

```json
{
  "name": "your-first-cli-package",
  "version": "1.0.0",
  "description": "你的第一个命令行工具",
  "main": "index.js",
  "bin": {
    "yourCommand": "index.js"
  },
}
```

之后别人使用 npm i -g your-first-cli-package 时，即可在终端中执行 yourCommand 调用你的 index.js 的逻辑啦。如果使用局部安装的方式，即 npm i your-first-cli-package，命令行将被安装到 node_modules/.bin/yourCommand 下，其内容正是 index.js 的内容。此时可编辑 npm scripts 调用。

### 2.调用声明
由于我们使用 Node.js 实现，因此命令行对应的入口 js 文件（此处即 index.js）需要声明当前文件使用 node 执行：

```js
#!/usr/bin/env node
// 此处编写 yourCommand 命令的逻辑
```

### 3.编写逻辑
此处实现得比较粗糙，目前就一个命令，因此未引入 [args](https://www.npmjs.com/package/args) 这类包。

```js
#!/usr/bin/env node

const execa = require('execa')
const chalk = require('chalk')

const run = async () => {
  let branch = ''
  let result = ''

  try {
    console.log(chalk.gray(`获取当前分支...`))
    const { stdout } = await execa.command('git symbolic-ref --short -q HEAD')

    branch = stdout
    console.log(chalk.gray(`当前分支为: ${branch}`))
  } catch (error) {
    console.log(chalk.red(`获取分支失败：${error.message}`))
    process.exit(1) // 以失败码退出，用于 git hooks 拦截识别
  }

  try {
    console.log(chalk.gray(`检查当前分支是否推送过远程仓库...`))
    await execa.command(`git rev-parse --abbrev-ref ${branch}@{upstream}`)
    console.log(chalk.gray(`当前分支存在于 ${branch} 远程仓库...`))
  } catch (error) {
    console.log(
      chalk.yellow(`当前分支 ${branch} 未推送远程仓库 ${error.message}`),
    )

    try {
      console.log(chalk.green(`尝试推送分支 ${branch} 至远程仓库`))
      const { stderr } = await execa.command(
        `git push --set-upstream origin ${branch} --no-verify`,
      )

      result = stderr
    } catch (error) {
      console.log(chalk.red(`提交 gerrit 失败：${error.message}`))
      process.exit(1)
    }
  }

  try {
    console.log(chalk.gray(`对分支 ${branch} 提交 gerrit ...`))
    const { stderr } = await execa.command(
      `git push origin HEAD:refs/for/${branch} --no-verify`,
    )

    result = stderr
  } catch (error) {
    console.log(chalk.red(`提交 gerrit 失败：${error.message}`))
    process.exit(1)
  }

  console.log(chalk.green(`${branch} 提交 gerrit 成功，信息如下：\n${result}`))

  process.exit(0) // 以成功码退出，用于 git hooks 通过识别
}

run()
```

## 使用方式

### 全局使用（非前端工程推荐使用）
#### 安装
`npm i @dd/gerrit-cli -g`

#### 执行
> 确保在 git 工程目录下

`gerrit`

#### 示例

![](/post-img/gerrit1.jpg)


### JavaScript 工程局部使用（前端工程推荐使用）
#### 安装
`npm i @dd/gerrit-cli --save-dev`

#### 在 package.json 中新增 gerrit scripts
```json
"scripts": {
    ...
    "cr": "gerrit"
    ...
  },
```

#### 执行
> 确保在 git 工程目录下

`npm run cr`

#### 示例

![](/post-img/gerrit2.jpg)


### 和 [husky](https://www.npmjs.com/package/husky) 配合使用

#### 在 package.json 中新增 gerrit scripts
```json
"scripts": {
  ...
  "cr": "gerrit"
  ...
},
"husky": {
  "hooks": {
    "pre-push": "npm run cr"
  }
},
```

#### 执行
> 确保在 git 工程目录下

`git push`

#### 示例
![](/post-img/gerrit3.jpg)

## TODO
- 新增子命令支持生成 gerrit 的配置文件
- 打印对应的 CR 规范的文档链接，否则新人会懵逼

## 总结

我们多多少少会遇到类似的场景，以工程化的视角去封装它，让原本 npm 生态之外的 bash 脚本也能融于无形！
