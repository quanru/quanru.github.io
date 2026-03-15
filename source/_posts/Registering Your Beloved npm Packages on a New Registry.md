---
title: "Registering Your Beloved npm Packages on a New Registry"
toc: true
date: 2020-09-27 12:45:00
categories: Engineering
tags:
- CLI Tools
- Node.js
- JavaScript
---

A guide to batch-migrating npm packages from one npm registry to another.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2020/09/27/%E7%BB%99%E4%BD%A0%E5%BF%83%E7%88%B1%E7%9A%84%20npm%20%E5%8C%85%E4%B8%8A%E4%B8%AA%E5%8C%97%E4%BA%AC%E6%88%B7%E5%8F%A3/">简体中文</a>.
</div>
</article>

## Background

It all started with the fact that our company had two npm registries — one called the Hangzhou registry and another called the Beijing registry. They coexisted peacefully until one day we needed to depend on packages from the other registry, and neither could pull packages from the other. The Hangzhou registry had implemented a workaround: when a requested package wasn't found locally, it would attempt to fetch it from the Beijing registry, seemingly solving the problem. However, this only addressed our dependency on Beijing registry packages. We had a large number of packages that needed to be shared with other departments, so we decided to switch to the Beijing registry, which had more users. Our team was in the process of collectively migrating to the Beijing registry, but we frequently encountered the following issues:

1. After cloning a project and running `npm install`, some packages would be reported as missing. You'd then check the current registry, switch to the other one, and run `npm install` again.

2. Legacy projects used the Hangzhou registry but depended on Beijing registry packages. Although the Hangzhou registry would attempt to fetch from the Beijing registry when a package wasn't found, this mechanism was unreliable and sometimes blocked service builds. The dependency issue had to be resolved before the project could be rebuilt.

3. New projects used the Beijing registry but depended on Hangzhou registry packages. This scenario was particularly tricky — the Beijing registry had no mechanism to fetch from the Hangzhou registry. The Hangzhou packages had to be republished on the Beijing registry. Manual publishing would be tedious and error-prone for packages with many versions; publishing only some versions would cause inconsistencies between registries, making unpublished versions unavailable.

4. When publishing a package to only the Hangzhou registry, projects using the Beijing registry might not get the new version, and vice versa.

**What to do?**


## Solution Approach

To accelerate the end of this transition period, we needed to fully switch to the Beijing registry. Two problems needed to be solved:

1. All versions of our team's Hangzhou registry packages needed to be republished on the Beijing registry, along with syncing dist-tags.

2. Team members needed to be notified to switch their projects to the Beijing registry and stop using the Hangzhou registry. Any packages missing from the Beijing registry should be reported for syncing.

So how many packages did our team have? There were 49 known packages under the @kd scope, and even more under the @dd scope — about 50 collected so far. Assuming an average of 10 versions per package, we had roughly a thousand versions to republish. Manual work was out of the question — we needed an automated batch sync solution.

Let's see how it was done!

## Implementation

As a frontend developer, Node.js was the natural choice for writing scripts or CLI tools to handle this kind of repetitive work. Let's first review how to publish an npm package: simply navigate to the package's root directory and run `npm publish`. So all we needed was a way to obtain the code for every version of every package. Is there such a way?

Yes, there is! Recall what happens when you inspect an npm package using `npm view`:

![](/post-img/npm-sync1.jpg)

You'll notice `.tarball: https://registry.npmjs.org/koa/-/koa-2.13.0.tgz` — this tarball contains the latest version 2.13.0 of the koa package. After downloading and extracting it, we find exactly what we need — just enter the directory and run `npm publish`:

![](/post-img/npm-sync2.jpg)

Can we get the tarball for a specific version? Of course — use `npm view koa@1.0.0` to view a specific version. But wait, how do we know which versions exist? Don't worry — try `npm view koa --json`, and the answer is in the `versions` field:

![](/post-img/npm-sync3.jpg)

Additionally, the `dist-tags` field also needs to be synced (*tags are not synced by default, as the source registry's tags might overwrite the target registry's tags, and the source's tags might not be the most up-to-date*).

With everything in place, all that's left is a programmer! The core logic is: given a package name, download all version tarballs, extract them, enter each directory, and run `npm publish`:

```js
// Get all versions of the package
let result
try {
  result = await execa.command(`npm view ${npmPacakgeName} --json --registry=${from}`)
} catch (error) {
  // Write failure logs to file for tracking
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
      // Write failure logs to file for tracking
      console.log(chalk.red(`tag 添加失败：${npmPacakgeName}@${json['dist-tags']}`))

      const content = await fs.readFile(errorLogFile)

      await fs.writeFile(errorLogFile, `${content}\ntag 添加失败：${npmPacakgeName}@${json['dist-tags']}: ${error.stack}`)
    }
  }
})

const publishTaskList = json.versions && json.versions.map(npmPacakgeVersion => {
  // Processing logic for each version of the package
  return async () => {
    try {
      // If the version already exists on ${to}, skip it
      // FIXME: Handle the case where the package doesn't exist on ${to}
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

      // Remove @scope prefix from the string
      const packagePath = path.join(__dirname, npmPacakgeName, `${npmPacakgeName.replace(/@.*\//, '')}-${npmPacakgeVersion}`)
      const tgzPath = `${packagePath}.tgz`

      // Download the package
      await download(
        `${from}/${npmPacakgeName}/download/${npmPacakgeName}-${npmPacakgeVersion}.tgz`,
        npmPacakgeName
      )
      // Extract the package
      await compressing.tgz.uncompress(
        tgzPath,
        packagePath
      )
      // Delete the tarball
      await execa.command(`rm ${tgzPath}`)
      // Publish
      await execa.command(`npm publish --tag=sync --registry=${to}`, {
        cwd: path.join(packagePath, 'package')
      })
      console.log(chalk.green(`${npmPacakgeName}@${npmPacakgeVersion} 成功同步 ${to}！`))
    } catch (error) {
      // Write failure logs to file for tracking
      console.log(chalk.red(`version 发布失败：${npmPacakgeName}@${npmPacakgeVersion}`))

      const content = await fs.readFile(errorLogFile)

      await fs.writeFile(errorLogFile, `${content}\nversion 发布失败：${npmPacakgeName}@${npmPacakgeVersion}: ${error.stack}`)
    }
  }
})
// Limit concurrency to 5 to avoid npm registry errors
await Promise.all(publishTaskList.map(pLimit(5)))
// Fix all tags — parallel execution may fail, so we run sequentially here
// Tags are not synced by default, as ${from}'s tags might overwrite ${to}'s tags, and ${from}'s tags might not be the most up-to-date
if (options.syncTag) {
  await Promise.all(tagTaskList.map(pLimit(1)))
}
```

Be mindful of concurrency — too many parallel requests will cause errors from the npm registry (likely getting rate-limited).

## How to Use

Originally only a script, I've since turned it into a CLI tool for everyone's convenience (so people stop asking me to sync packages). Here's how to use it:
> This is an internal tool and not publicly available, but you can implement your own.

### Install the CLI

`npm i @dd/npm-sync -g`

### Sync Versions

`npm-sync packageName`

### Sync Versions and Tags

`npm-sync packageName --syncTag=true`

### More Usage Options

`npm-sync --help`

## TODOs

> Contributions welcome!

- Support packages that require a pre-publish build step
- Add login pre-validation



