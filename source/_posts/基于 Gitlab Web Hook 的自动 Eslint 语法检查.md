---
title: 基于 Gitlab Web Hook 的自动 Eslint 语法检查
date: 2016-10-02 15:11:33
categories: Node.js 服务端
tags:
- JavaScript
- Node.js
- Git
- Hook

---

**[Eslint](http://eslint.org/), 一个插件化的 Javascript 语法检查工具, 如何将其结合 Gitlab 并应用于开发呢?**

<!-- more -->

# Gitlab Web Hook

[Gitlab Web Hook](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/web_hooks/web_hooks.md) 提供如下事件的 Hook:

1. Push events
2. Tag push events
3. Comments
4. Issues events
5. Merge Request events
...

当对应事件发生时, 将触发预设的 URL (即 Web Hook), 并向其发送一个包含该事件详细信息的 POST 请求, 正是通过该 POST 请求从而对各个事件进行处理的.

例如 Merge Requests events:

```js
//Request body:
{
  "object_kind": "merge_request",
  "user": {
    "name": "Administrator",
    "username": "root",
    "avatar_url": "http://www.gravatar.com/avatar/e64c7d89f26bd1972efa854d13d7dd61?s=40\u0026d=identicon"
  },
  "object_attributes": {
    "id": 99,
    "target_branch": "master",
    "source_branch": "ms-viewport",
    "source_project_id": 14,
    "author_id": 51,
    "assignee_id": 6,
    "title": "MS-Viewport",
    "created_at": "2013-12-03T17:23:34Z",
    "updated_at": "2013-12-03T17:23:34Z",
    "st_commits": null,
    "st_diffs": null,
    "milestone_id": null,
    "state": "opened",
    "merge_status": "unchecked",
    "target_project_id": 14,
    "iid": 1,
    "description": "",
    "source":{
      "name":"Awesome Project",
      "description":"Aut reprehenderit ut est.",
      "web_url":"http://example.com/awesome_space/awesome_project",
      "avatar_url":null,
      "git_ssh_url":"git@example.com:awesome_space/awesome_project.git",
      "git_http_url":"http://example.com/awesome_space/awesome_project.git",
      "namespace":"Awesome Space",
      "visibility_level":20,
      "path_with_namespace":"awesome_space/awesome_project",
      "default_branch":"master",
      "homepage":"http://example.com/awesome_space/awesome_project",
      "url":"http://example.com/awesome_space/awesome_project.git",
      "ssh_url":"git@example.com:awesome_space/awesome_project.git",
      "http_url":"http://example.com/awesome_space/awesome_project.git"
    },
    "target": {
      "name":"Awesome Project",
      "description":"Aut reprehenderit ut est.",
      "web_url":"http://example.com/awesome_space/awesome_project",
      "avatar_url":null,
      "git_ssh_url":"git@example.com:awesome_space/awesome_project.git",
      "git_http_url":"http://example.com/awesome_space/awesome_project.git",
      "namespace":"Awesome Space",
      "visibility_level":20,
      "path_with_namespace":"awesome_space/awesome_project",
      "default_branch":"master",
      "homepage":"http://example.com/awesome_space/awesome_project",
      "url":"http://example.com/awesome_space/awesome_project.git",
      "ssh_url":"git@example.com:awesome_space/awesome_project.git",
      "http_url":"http://example.com/awesome_space/awesome_project.git"
    },
    "last_commit": {
      "id": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "message": "fixed readme",
      "timestamp": "2012-01-03T23:36:29+02:00",
      "url": "http://example.com/awesome_space/awesome_project/commits/da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "author": {
        "name": "GitLab dev user",
        "email": "gitlabdev@dv6700.(none)"
      }
    },
    "work_in_progress": false,
    "url": "http://example.com/diaspora/merge_requests/1",
    "action": "open",
    "assignee": {
      "name": "User1",
      "username": "user1",
      "avatar_url": "http://www.gravatar.com/avatar/e64c7d89f26bd1972efa854d13d7dd61?s=40\u0026d=identicon"
    }
  }
}

```

从这个请求体中可知该 Merge Request 的创建者, 分支, 源分支信息, 目标分支信息, 最近一次 Commit, 分配给哪个用户, 对应的状态等信息.

# Eslint

作为插件化的 lint 方案, 逐渐打败了原有的 JSLint 和 JSHint, 并'吞并'了 JSCS, 其最大的优势就是标榜的可插件化, 并且有各种插件可以扩展, 使得开发人员能够灵活的配置规则, 如果这还不满足你的需求, 你还能方便的开发针对自己需求的插件, 此外它还支持 Es6, Jsx 语法, 前端程序员真是一群追求'时尚'的猿, 你不能阻止一个前端使用新工具 ......

## 编写自己的 config/plugin npm package

两种方式:

1. 第一种是类似于 [eslint-google-config](https://github.com/google/eslint-config-google/blob/master/index.js) 的方式, 通过编写配置文件 npm package, 具体详见[官方教程](http://eslint.org/docs/developer-guide/shareable-configs.html);
2. 第二种以插件形式, 类似于[eslint-plugin-react-native](https://github.com/Intellicode/eslint-plugin-react-native/blob/master/index.js), 通过编写独立的 Eslint 插件;

本文采用第二种方式, 不仅方便配置现有的 rules, 也方便未来添加自己的 rules:

```js
import ReactEslint from 'eslint-plugin-react';
import ReactNativeEslint from 'eslint-plugin-react-native';

const reactRules = ReactEslint.rules;
const reactNativeRules = ReactNativeEslint.rules;

const ReactNativeDemo = {
  rules: {
    'split-platform-components': reactNativeRules['split-platform-components'],
    'no-inline-styles': reactNativeRules['no-inline-styles'],
    'no-did-mount-set-state': reactRules['no-did-mount-set-state'],
    'no-did-update-set-state': reactRules['no-did-update-set-state']
  },
  configs: {
    recommended: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      rules: {
        'react-native-demo/split-platform-components': 2,
        'react-native-demo/no-inline-styles': 2,
        'react-native-demo/no-did-mount-set-state': 2,
        'react-native-demo/no-did-update-set-state': 2
      }
    }
  }
};

export default MyEslinPlugin;
```

假设你的插件叫做: eslint-react-demo, 那么通过安装该插件(前提是你 npm publish了这个插件):

```
npm install eslint-react-demo babel-eslint eslint --save-dev
```

并在项目根目录配置如下 .eslintrc 文件即可:

```
{
  "parser": "babel-eslint",
  "plugins": [
    "react-demo",
  ],
  "extends": ["plugin:react-demo/recommended"]
}
```

# 使用 Node 编写 Gitlab Web Hook 接口

现在插件有了, 还是聊聊怎么实现自动化 Eslint 检查吧, 由于目前采用 Issue 方式开发, 当猿们最终写完功能, 需要合并到 master 分支时, 必须提一个 Merge Request, 此时通过监听拦截 Merge Request 事件, 对应的 Web Hook 需要完成以下任务:

1. 判断 Merge Request 事件的触发动作, 若为 open 或者 reopen, 则执行 Eslint 检查
2. 通过 POST 请求体获取对应事件的 git 地址, 分支等信息, 将对应仓库拉到本地
3. 执行 Eslint 检查
4. 如果通过 Eslint 检查, 则什么都不做, 否则将 Eslint 检查结果作为评论回复在该 Merge Request 页面, 并关闭该 Merge Request(当然, 你也可以发邮件给对应的开发人员);

关键代码如下:

```js
  check(mr) {
    return new Promise((resolve, reject) => {
        // TODO fs.chmodSync(shellFilePath, 755);
        return execFile(shellFilePath, [mr.author, mr.project_path, mr.source_branch, mr.repo], { cwd: rootPath }, (err, stdout, stderr) => {
          // 此处不处理 err, 因为 eslint 不通过也算一种 err......
          resolve(stdout);
        });
      })
      .then(async(ret) => {
        const projectService = new ProjectService();
        if(ret) {
          await projectService.createMrNotes(mr, `\`\`\`\n ${ret} \`\`\`\n`);
          await projectService.updateMr(mr, 'close');
          return Promise.resolve(false);
        } else {
          return Promise.resolve(true);
        }
      })
  }
```

其中用到的 shell 脚本内容如下:

```shell
#!/bin/bash
if [ ! -d eslint ]; then
mkdir eslint
fi

cd eslint

if [ ! -d $1 ]; then
mkdir $1
fi

cd $1

if [ ! -d $2 ]; then
git clone -b $3 $4 > /dev/null
cd $2
else
cd $2
git checkout $3 > /dev/null
git pull > /dev/null
fi

../../.././node_modules/eslint/bin/eslint.js .
```

# 剧终
