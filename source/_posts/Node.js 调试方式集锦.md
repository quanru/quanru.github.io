---
title: Node.js 调试方式集锦
toc: true
date: 2017-08-15 21:17:11
categories: 开发工具
tags:
- JavaScript

---

本文讨论了几个流行的 Node.js 调试方式，包括 Chrome，VSCODE，ATOM，WebStorm

<!-- more -->

#### Chrome：

**优势**

  1. 不依赖编辑器；
  2. 不依赖配置；
  3. Node.js 默认已经集成，官方推荐；
  4. 与前端代码调试工具一致；
  5. dev-tools  工具强大

**劣势**
  1. 无法在源文件上进行断点

---

#### VSCODE：

**优势**
  1. 可在源文件上进行断点

**劣势**
  1. 需要一定的配置

---

#### WebStorm：

**优势**

  1. 可在源文件上进行断点

**劣势**

  1. 需要一定的配置

---

#### ATOM：

**优势**
  1. 可在源文件上进行断点

**劣势**
  1. 功能比较弱，不如 VSCODE

---

> 个人建议：如果本身就使用 VSCODE，WebStorm 的话，建议继续使用对应的 Node.js 调试方式；如果使用 ATOM，Sublime 调试不便的编辑器，推荐使用 Chrome 进行调试。


## CHROME 调试配置

#### 步骤一：安装 nodemon，监听文件变化以重启 node 服务

   `$> npm install nodemon -g`



#### 步骤二：以 —inspect 参数启动调试

   `$> NODE_ENV=development nodemon --inspect -w config -w server -x node server/server.js`

   注：

* NODE_ENV=development // 传入环境变量
* —inspect // 配合 Chrome 进行调试，当同时调试多个 node 服务时，可设置端口以避免冲突：—inspect=9291   
* -w config -w server // 监听 config 与 server  目录，当上述两个目录内文件发生变化时，自动重启服务
* -x node // 默认为 node，可不配置，必要时可配置为 babel-node：-x babel-node
* server/server.js // node 项目入口文件

#### 步骤三：启动前端调试服务(如果有的话)

   ![image](/post-img/启动调试服务.png)



#### 步骤四：建议将上述命令配置为 scripts 脚本（此时可在项目内单独安装 nodemon）：

   ```json
   "scripts": {
       "start": "npm run server & npm run dev",
       "server": "NODE_ENV=development nodemon -w config -w server server/server.js",
       "start-debug": "npm run server-debug & npm run dev",
       "server-debug": "NODE_ENV=development nodemon --inspect -w config -w server server/server.js",
       "dev": "nodemon -w config -w scripts scripts/server.js"
     }
   ```



#### 步骤五：打开 Chrome，并打开 dev tool，当你的 Chrome 足够新（60 以上），可点击如下 node.js 图标，进入调试

   ![image](/post-img/打开调试.png)

   ![image](/post-img/打断点.png)



#### 步骤六：如果当前 Chrome 不支持，请更新，或者使用插件 [NIM](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)

---

## VSCODE 调试配置

#### 步骤一：打开项目目录



#### 步骤二：切换到 debug tab：

   ![image](/post-img/vscode-debug.png)



#### 步骤三：打开 launch.json  文件

   ![image](/post-img/编辑-vscode-配置.png)



#### 步骤四：配置 launch.json

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node2", // 新增类型，方便调试 await/async 语法
            "request": "launch",
            "name": "启动程序",
            "verboseDiagnosticLogging": false,
            "program": "${workspaceRoot}/server/server.js", // 此为 node 工程的入口文件
            "cwd": "${workspaceRoot}",
            "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/babel-node", // 若未使用 babel-node，例如使用 node8 以上版本，请移除本行
            "env": {
                "NODE_ENV": "development"
            },
            "sourceMaps": true
        }
    ]
}

```



#### 步骤五：启动前端调试服务(如果有的话)

   ![image](/post-img/启动调试服务.png)



#### 步骤六：使用 VSCode 打开源码文件，点击行号左侧以添加断点

   ![image](/post-img/源码断点.png)



#### 步骤七：切回 debug tab，启动 node.js  服务，即可调试

   ![image](/post-img/调试.png)

---

## WebStorm

#### 步骤一：打开项目目录，展开 `Run` 菜单，选择 `Edit Configurations`

   ![image](/post-img/WebStorm.png)



#### 步骤二：新建 Node.js 调试配置

   ![image](/post-img/WebStorm-配置.png)



#### 步骤三：配置参考

   ![image](/post-img/WebStorm-配置参考.png)



注：

* Node interpreter：node 可执行文件路径，若使用 babel-node  则需要添加 babel-node  路径；
* Working directory：工作目录；
* JavaScript file：项目入口文件；
* Environment variables：环境变量；



#### 步骤四：启动前端调试服务(如果有的话)

   ![image](/post-img/启动调试服务.png)



#### 步骤五：使用 WebStorm 打开源码文件，点击行号左侧以添加断点

   ![image](/post-img/WebStorm-源码调试.png)



#### 步骤六：点击启动调试服务

   ![image](/post-img/WebStorm-启动调试.png)

---

## ATOM 调试配置

#### 步骤一：安装插件：a.  [xatom-debug](https://github.com/willyelm/xatom-debug) b. [xatom-debug-nodejs](https://github.com/willyelm/xatom-debug)

   ![image](/post-img/atom-安装插件.png)



#### 步骤二：打开 node  项目入口文件，并在箭头处切换需要调试的项目目录，之后点击箭头右侧的 Node.js  按钮进入配置

   ![image](/post-img/atom-切换调试目录.png)



#### 步骤三：配置调试

   ![image](/post-img/atom-配置调试.png)



#### 步骤四：启动前端调试服务(如果有的话)

   ![image](/post-img/启动调试服务.png)



#### 步骤五：使用 ATOM 打开源码文件，点击行号左侧以添加断点

   ![image](/post-img/atom-源码调试.png)



#### 步骤六：点击启动调试服务

   ![image](/post-img/atom-启动调试服务.png)
