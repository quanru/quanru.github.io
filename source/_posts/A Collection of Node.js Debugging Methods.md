---
title: "A Collection of Node.js Debugging Methods"
toc: true
date: 2017-08-15 21:17:11
categories: Development Tools
tags:
- JavaScript

---

This article discusses several popular Node.js debugging methods, including Chrome, VS Code, Atom, and WebStorm.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2017/08/15/Node.js%20%E8%B0%83%E8%AF%95%E6%96%B9%E5%BC%8F%E9%9B%86%E9%94%A6/">简体中文</a>.
</div>
</article>

#### Chrome:

**Advantages**

  1. No dependency on a specific editor;
  2. No configuration required;
  3. Integrated into Node.js by default, officially recommended;
  4. Consistent with frontend code debugging tools;
  5. Powerful DevTools

**Disadvantages**
  1. Cannot set breakpoints directly in source files

---

#### VS Code:

**Advantages**
  1. Can set breakpoints directly in source files

**Disadvantages**
  1. Requires some configuration

---

#### WebStorm:

**Advantages**

  1. Can set breakpoints directly in source files

**Disadvantages**

  1. Requires some configuration

---

#### Atom:

**Advantages**
  1. Can set breakpoints directly in source files

**Disadvantages**
  1. Less capable than VS Code

---

> Personal recommendation: If you already use VS Code or WebStorm, I suggest continuing to use their respective Node.js debugging features. If you use Atom, Sublime, or other editors that are less convenient for debugging, I recommend using Chrome for debugging.


## Chrome Debugging Configuration

#### Step 1: Install nodemon to watch for file changes and restart the Node service

   `$> npm install nodemon -g`



#### Step 2: Start debugging with the --inspect flag

   `$> NODE_ENV=development nodemon --inspect -w config -w server -x node server/server.js`

   Notes:

* NODE_ENV=development // Pass environment variables
* --inspect // Debug with Chrome. When debugging multiple Node services simultaneously, you can set a port to avoid conflicts: --inspect=9291
* -w config -w server // Watch the config and server directories. When files in these directories change, the service automatically restarts
* -x node // Defaults to node, can be omitted. When necessary, can be configured as babel-node: -x babel-node
* server/server.js // Node project entry file

#### Step 3: Start the frontend dev server (if applicable)

   ![image](/post-img/启动调试服务.png)



#### Step 4: It's recommended to configure the above commands as npm scripts (in which case you can install nodemon locally in the project):

   ```json
   "scripts": {
       "start": "npm run server & npm run dev",
       "server": "NODE_ENV=development nodemon -w config -w server server/server.js",
       "start-debug": "npm run server-debug & npm run dev",
       "server-debug": "NODE_ENV=development nodemon --inspect -w config -w server server/server.js",
       "dev": "nodemon -w config -w scripts scripts/server.js"
     }
   ```



#### Step 5: Open Chrome and open DevTools. If your Chrome is new enough (version 60+), you can click the Node.js icon shown below to enter the debugger

   ![image](/post-img/打开调试.png)

   ![image](/post-img/打断点.png)



#### Step 6: If your current Chrome version doesn't support this, please update it, or use the plugin [NIM](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)

---

## VS Code Debugging Configuration

#### Step 1: Open the project directory



#### Step 2: Switch to the Debug tab:

   ![image](/post-img/vscode-debug.png)



#### Step 3: Open the launch.json file

   ![image](/post-img/编辑-vscode-配置.png)



#### Step 4: Configure launch.json

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node2", // New type for easier debugging of await/async syntax
            "request": "launch",
            "name": "Launch Program",
            "verboseDiagnosticLogging": false,
            "program": "${workspaceRoot}/server/server.js", // Node project entry file
            "cwd": "${workspaceRoot}",
            "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/babel-node", // If not using babel-node (e.g., using Node 8+), remove this line
            "env": {
                "NODE_ENV": "development"
            },
            "sourceMaps": true
        }
    ]
}

```



#### Step 5: Start the frontend dev server (if applicable)

   ![image](/post-img/启动调试服务.png)



#### Step 6: Open a source file in VS Code and click to the left of the line number to add a breakpoint

   ![image](/post-img/源码断点.png)



#### Step 7: Switch back to the Debug tab and start the Node.js service to begin debugging

   ![image](/post-img/调试.png)

---

## WebStorm

#### Step 1: Open the project directory, expand the `Run` menu, and select `Edit Configurations`

   ![image](/post-img/WebStorm.png)



#### Step 2: Create a new Node.js debug configuration

   ![image](/post-img/WebStorm-配置.png)



#### Step 3: Configuration reference

   ![image](/post-img/WebStorm-配置参考.png)



Notes:

* Node interpreter: Path to the Node executable. If using babel-node, you need to add the babel-node path;
* Working directory: The working directory;
* JavaScript file: The project entry file;
* Environment variables: Environment variables;



#### Step 4: Start the frontend dev server (if applicable)

   ![image](/post-img/启动调试服务.png)



#### Step 5: Open a source file in WebStorm and click to the left of the line number to add a breakpoint

   ![image](/post-img/WebStorm-源码调试.png)



#### Step 6: Click to start the debug service

   ![image](/post-img/WebStorm-启动调试.png)

---

## Atom Debugging Configuration

#### Step 1: Install plugins: a. [xatom-debug](https://github.com/willyelm/xatom-debug) b. [xatom-debug-nodejs](https://github.com/willyelm/xatom-debug)

   ![image](/post-img/atom-安装插件.png)



#### Step 2: Open the Node project entry file. Use the arrow to switch the project directory to debug, then click the Node.js button to the right of the arrow to enter configuration

   ![image](/post-img/atom-切换调试目录.png)



#### Step 3: Configure debugging

   ![image](/post-img/atom-配置调试.png)



#### Step 4: Start the frontend dev server (if applicable)

   ![image](/post-img/启动调试服务.png)



#### Step 5: Open a source file in Atom and click to the left of the line number to add a breakpoint

   ![image](/post-img/atom-源码调试.png)



#### Step 6: Click to start the debug service

   ![image](/post-img/atom-启动调试服务.png)
