---
title: Wrapping Bash Scripts into CLI Tools with Node.js
toc: true
date: 2020-10-02 00:19:13
categories: Engineering
tags:
- Node.js
- JavaScript
- CLI Tools
---

How to integrate a commonly used bash script into the npm ecosystem, demonstrated with a recent CR (Code Review) submission script.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2020/10/02/%E4%BD%BF%E7%94%A8%20Node.js%20%E5%B0%86%E7%8F%8D%E8%97%8F%E7%9A%84%20bash%20%E8%84%9A%E6%9C%AC%E5%B0%81%E8%A3%85%E6%88%90%E5%91%BD%E4%BB%A4%E8%A1%8C%E5%B7%A5%E5%85%B7/">简体中文</a>.
</div>
</article>

## Background

As programmers, most of us have used GitHub's merge request feature. Of course, besides this type of Code Review approach, many companies have their own Code Review platforms—our company is no exception. We use a tool similar to [Gerrit](https://www.gerritcodereview.com/), which we'll refer to as Gerrit here. Recently, while managing engineering governance, we needed to fully switch to using Gerrit for CR submissions. I found that the Gerrit submission command isn't easy to remember—I'd often need to run git push first, get blocked by an error, then copy the suggested command from the error message and run it again to successfully submit. As an engineer, this was quite unbearable!!!

## Requirements

### 1. Is there a standalone command that lets me submit to Gerrit directly?
### 2. Is there a CLI tool I can just install and use?
### 3. Can git push be intercepted by a git hook and conditionally submit to Gerrit?

## Solutions

### 1. Is there a standalone command that lets me submit to Gerrit directly?

> Answer: Yes. Once, a colleague saw me struggling with Gerrit submissions and forwarded me a bash script: "Copy it to the /usr/local/bin directory and you can execute it directly with gerrit." The treasured script (gerrit):

  ```bash
  branch=$(git symbolic-ref --short -q HEAD)
  git push origin HEAD:refs/for/${branch}
  ```

### 2. Is there a CLI tool I can just install and use?

> Answer: Yes. Since we already have the script, as a frontend developer, it's a must to wrap it into a CLI tool with our beloved Node.js. Just two steps: first run `npm i @dd/gerrit-cli -g`, then execute `gerrit` in the project directory.

### 3. Can git push be intercepted by a git hook and conditionally submit to Gerrit?

> Answer: Yes. If you still think installing a global CLI is too much trouble, or worry about newcomers being confused, you can use git hooks for interception. Users just need to "mindlessly" run git push. Of course, for frontend, there's a ready-made git hook tool—the beloved [Husky](https://www.npmjs.com/package/husky). For other language ecosystems, there should be similar tools available.

**Let's see how to wrap the above script!**

## Implementation

### 1. Configure Commands
How can others execute a command in the terminal after installing your npm package? Simply add a bin field to your package.json:

```json
{
  "name": "your-first-cli-package",
  "version": "1.0.0",
  "description": "Your first CLI tool",
  "main": "index.js",
  "bin": {
    "yourCommand": "index.js"
  },
}
```

After someone installs it globally with `npm i -g your-first-cli-package`, they can execute `yourCommand` in the terminal to invoke your index.js logic. For local installation (`npm i your-first-cli-package`), the command is installed to `node_modules/.bin/yourCommand`, containing the same index.js content, and can be called via npm scripts.

### 2. Execution Declaration
Since we're using Node.js, the entry JS file (index.js here) needs to declare that the file should be executed with node:

```js
#!/usr/bin/env node
// Write yourCommand logic here
```

### 3. Write the Logic
The implementation is rough for now—there's currently just one command, so no [args](https://www.npmjs.com/package/args) package is needed.

```js
#!/usr/bin/env node

const execa = require('execa')
const chalk = require('chalk')

const run = async () => {
  let branch = ''
  let result = ''

  try {
    console.log(chalk.gray(`Getting current branch...`))
    const { stdout } = await execa.command('git symbolic-ref --short -q HEAD')

    branch = stdout
    console.log(chalk.gray(`Current branch: ${branch}`))
  } catch (error) {
    console.log(chalk.red(`Failed to get branch: ${error.message}`))
    process.exit(1) // Exit with failure code for git hooks to detect
  }

  try {
    console.log(chalk.gray(`Checking if current branch has been pushed to remote...`))
    await execa.command(`git rev-parse --abbrev-ref ${branch}@{upstream}`)
    console.log(chalk.gray(`Current branch exists in ${branch} remote repository...`))
  } catch (error) {
    console.log(
      chalk.yellow(`Current branch ${branch} hasn't been pushed to remote ${error.message}`),
    )

    try {
      console.log(chalk.green(`Attempting to push branch ${branch} to remote`))
      const { stderr } = await execa.command(
        `git push --set-upstream origin ${branch} --no-verify`,
      )

      result = stderr
    } catch (error) {
      console.log(chalk.red(`Failed to submit gerrit: ${error.message}`))
      process.exit(1)
    }
  }

  try {
    console.log(chalk.gray(`Submitting gerrit for branch ${branch}...`))
    const { stderr } = await execa.command(
      `git push origin HEAD:refs/for/${branch} --no-verify`,
    )

    result = stderr
  } catch (error) {
    console.log(chalk.red(`Failed to submit gerrit: ${error.message}`))
    process.exit(1)
  }

  console.log(chalk.green(`${branch} gerrit submission successful, details:\n${result}`))

  process.exit(0) // Exit with success code for git hooks to detect
}

run()
```

## Usage

### Global Usage (Recommended for non-frontend projects)
#### Install
`npm i @dd/gerrit-cli -g`

#### Execute
> Make sure you're in a git project directory

`gerrit`

#### Example

![](/post-img/gerrit1.jpg)


### Local Usage in JavaScript Projects (Recommended for frontend projects)
#### Install
`npm i @dd/gerrit-cli --save-dev`

#### Add gerrit script to package.json
```json
"scripts": {
    ...
    "cr": "gerrit"
    ...
  },
```

#### Execute
> Make sure you're in a git project directory

`npm run cr`

#### Example

![](/post-img/gerrit2.jpg)


### Using with [husky](https://www.npmjs.com/package/husky)

#### Add gerrit script to package.json
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

#### Execute
> Make sure you're in a git project directory

`git push`

#### Example
![](/post-img/gerrit3.jpg)

## TODO
- Add sub-command to generate gerrit configuration file
- Print CR convention documentation links so newcomers won't be confused
- Wrap as SDK for other tools to use

## Summary

We all encounter similar scenarios from time to time. Looking at them from an engineering perspective and wrapping them up lets originally npm-ecosystem-external bash scripts integrate seamlessly!
