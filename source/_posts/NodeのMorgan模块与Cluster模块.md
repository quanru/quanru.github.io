title: NodeのMorgan 模块与 Cluster 模块
date: 2016-03-18 20:21:19
categories: 后端
tags:
- Node
- Javascript
---

** 这段时间鼓捣Node.js，跟着《Node.js 开发指南》把 Microblog 给实现了一下，由于该书撰写于 2012 年，Node 版本目前最新已更新至 v5.9.0，且 Express 也发生了相当大的变化，导致很多书中代码已经不符合当前的版本了。关于实现部分，可参考这篇文章：[《nodejs开发指南》微博实例express4.x版](http://www.cnblogs.com/yuanzm/p/3770986.html) 。BTW，目前 express 启动命令改为 npm start，该命令执行 bin 目录下的 www 文件，相当于直接执行 node ./bin/www。此处简要记录下该书第六章提到的关于日志与多核CPU的优化问题，并介绍一款 debug tool。整个 microblog 的代码已放至 github 上：[摸我](https://github.com/quanru/microblog) **

<!-- more -->

# 一、前言

这段时间鼓捣Node.js，跟着《Node.js 开发指南》把 Microblog 给实现了一下，由于该书撰写于 2012 年，Node 版本目前最新已更新至 v5.9.0，且 Express 也发生了相当大的变化，导致很多书中代码已经不符合当前的版本了。关于实现部分，可参考这篇文章：[《nodejs开发指南》微博实例express4.x版](http://www.cnblogs.com/yuanzm/p/3770986.html) 。BTW，目前 express 启动命令改为 npm start，该命令执行 bin 目录下的 www 文件，相当于直接执行 node ./bin/www。

此处简要记录下该书第六章提到的关于日志与多核CPU的优化问题，并介绍一款 debug tool。

整个 microblog 的代码已放至 github 上：[摸我](https://github.com/quanru/microblog) 

![ ](/images/microblog.png  "microblog")


# 二、Morgan 模块の日志生成

1. 安装 morgan 与 file-stream-rotator，后者用于生成 daily log：
> npm i morgan file-stream-rotato --save-dev

2. 编辑 app.js 文件，将其引入，此外还有 node 自带模块 fs：
```javascript
    var FileStreamRotator = require('file-stream-rotator');
    var logger = require('morgan');
    var fs = require('fs');
```

3. daily log 生成：
```javascript
    var logDirectory = __dirname + '/log';//日志文件存放目录
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);//检查目录是否存在，若不存在则新建
    var accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',//日期格式
        filename: logDirectory + '/access-%DATE%.log',//日志文件命名方式
        frequency: 'daily',//生成频率，可以是每两小时:2h，每分钟：1m
        verbose: false//详细与否
    });
    app.use(logger('combined', {stream: accessLogStream}));//其中 combined 为生成格式
```

该插件的具体使用方法参见： [morgan](https://www.npmjs.com/package/morgan) ，包括生成格式与配置选项等，也可自行组合配置生成格式。

# 三、Cluster 模块の生成子进程

该模块为 Node.js 自带的核心模块，用于生成与当前进程相同的子进程，允许父子进程共享端口，可充分利用当代服务器的多核CPU。

1. www 文件中存放服务器创建代码，因此编辑该文件，添加如下代码：
```javascript
    "use strict“;//后面用到了箭头函数，属于es6，因此设定严格模式，否则不支持
    var cluster = require('cluster');//模块引入
    var numCPUs = require('os').cpus().length;//获得当前系统的 cpu 数量
    if(cluster.isMaster) {//若当前进程为主进程，则 fork 新进程，数目为cpu数量
        for(let i = 0; i < numCPUs; i++) {
          cluster.fork();
        }
        cluster.on('exit', (worker, code, signal) => {
          console.log(`worker ${worker.process.pid} died`);
        });
      } else {//否则，创建服务器主进程
        //share TCP connection
        server.listen(port);
        server.on('error', onError);
        server.on('listening', onListening);
      }
```
    此时查看进程管理器，发现有多个 node 进程，而原来的代码则只有两个：
![ ](/images/node.png  "node 进程个数")

# 四、Node.js 除虫工具

我就不搬运了，它基于 electron，模仿 chrome 的 devtool，会用 chrome 的 devtool 就会这个，反正很吊：[devtool](https://segmentfault.com/a/1190000004509016) ，github 地址为：[devtool](https://github.com/Jam3/devtool) 

安装：
> npm install -g devtool

此处启动命令为：
>devtool bin/www --watch 

1. 断点之后，按 ctrl + r，重启服务器即可。

2. 进入断点后，点击 esc 可打开一个执行在当前作用域内的控制台，可以修改一些变量然后继续执行。

当使用 cluster 时，无法进入 get 与 post 请求函数内部，我提了个 issue。

高级使用方法见上述网址咯。

