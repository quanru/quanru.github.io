---
title: "Automated ESLint Checking with Gitlab Web Hooks"
toc: true
date: 2016-10-02 15:11:33
categories: Node.js Server-Side
tags:
- JavaScript
- Node.js
- Git

---

**[ESLint](http://eslint.org/), a pluggable JavaScript linting tool — how can we integrate it with Gitlab and apply it to development?**

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/10/02/%E5%9F%BA%E4%BA%8E%20Gitlab%20Web%20Hook%20%E7%9A%84%E8%87%AA%E5%8A%A8%20Eslint%20%E8%AF%AD%E6%B3%95%E6%A3%80%E6%9F%A5/">简体中文</a>.
</div>
</article>

# Gitlab Web Hook

[Gitlab Web Hook](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/web_hooks/web_hooks.md) provides hooks for the following events:

1. Push events
2. Tag push events
3. Comments
4. Issues events
5. Merge Request events
...

When a corresponding event occurs, it triggers a preset URL (the Web Hook) and sends a POST request containing detailed information about the event. It is through this POST request that we process each event.

For example, Merge Requests events:

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

From this request body, we can learn the Merge Request's creator, branch, source branch information, target branch information, the most recent commit, the assigned user, the corresponding status, and other details.

# ESLint

As a pluggable linting solution, ESLint gradually overtook the original JSLint and JSHint, and "absorbed" JSCS. Its greatest advantage is its pluggable architecture, with various plugins available for extension, enabling developers to flexibly configure rules. If that still doesn't meet your needs, you can easily develop plugins tailored to your own requirements. Additionally, it supports ES6 and JSX syntax. Frontend developers are truly a fashionable bunch — you can't stop a frontend developer from using new tools...

## Writing Your Own Config/Plugin npm Package

Two approaches:

1. The first is similar to [eslint-google-config](https://github.com/google/eslint-config-google/blob/master/index.js), by writing a configuration file npm package. See the [official tutorial](http://eslint.org/docs/developer-guide/shareable-configs.html) for details.
2. The second is in plugin form, similar to [eslint-plugin-react-native](https://github.com/Intellicode/eslint-plugin-react-native/blob/master/index.js), by writing a standalone ESLint plugin.

This article uses the second approach, which not only makes it easy to configure existing rules but also to add custom rules in the future:

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

Assuming your plugin is called eslint-react-demo, install the plugin (provided you've published it via npm):

```
npm install eslint-react-demo babel-eslint eslint --save-dev
```

Then configure the following .eslintrc file in the project root:

```
{
  "parser": "babel-eslint",
  "plugins": [
    "react-demo",
  ],
  "extends": ["plugin:react-demo/recommended"]
}
```

# Implementing the Gitlab Web Hook with Node

Now that we have the plugin, let's talk about how to implement automated ESLint checking. Since we currently use an Issue-based development workflow, when developers finish a feature and need to merge into the master branch, they must submit a Merge Request. By listening to and intercepting the Merge Request event, the corresponding Web Hook needs to accomplish the following tasks:

1. Determine the Merge Request event's trigger action — if it's open or reopen, execute the ESLint check
2. Extract the git URL, branch, and other information from the POST request body, then clone the corresponding repository locally
3. Execute the ESLint check
4. If the ESLint check passes, do nothing; otherwise, post the ESLint results as a comment on the Merge Request page and close the Merge Request (alternatively, you could email the developer)

Key code:

```js
  check(mr) {
    return new Promise((resolve, reject) => {
        // TODO fs.chmodSync(shellFilePath, 755);
        return execFile(shellFilePath, [mr.author, mr.project_path, mr.source_branch, mr.repo], { cwd: rootPath }, (err, stdout, stderr) => {
          // Not handling err here, since ESLint failure is also considered an err...
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

The shell script used:

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

# The End
