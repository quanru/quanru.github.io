---
title: Node.js 开发指南の书摘
toc: true
date: 2016-3-18 16:31:19
categories: 读书笔记
tags:
- JavaScript
- Node.js
---

### 章三
1，单次加载：
>require不会重复加载模块，无论调用多少次require，获得的模块都是同一个；

2，覆盖exports：
>当将一个对象封装到模块中时，exports.Hello = Hello,则需使用require('./singleobject').Hello来获取对象，可简化如下：module.exports = Hello; 此时就可以直接获取这个对象了，var Hello = require('./hello'); hello = new Hello();

3，创建全局链接：
>npm link express；从而在当前目录使用全局安装的express；

4，
>通过使用npm init交互式初始化一个符合标准的package.json；
发布包：npm publish；
更改json文件中的version字段后，重新发布，达到更新版本的目的；
取消发布：npm unpublish；

<!-- more -->

# 章三
1，单次加载：
>require不会重复加载模块，无论调用多少次require，获得的模块都是同一个；

2，覆盖exports：
>当将一个对象封装到模块中时，exports.Hello = Hello,则需使用require('./singleobject').Hello来获取对象，可简化如下：module.exports = Hello; 此时就可以直接获取这个对象了，var Hello = require('./hello'); hello = new Hello();

3，创建全局链接：
>npm link express；从而在当前目录使用全局安装的express；

4，
>通过使用npm init交互式初始化一个符合标准的package.json；
发布包：npm publish；
更改json文件中的version字段后，重新发布，达到更新版本的目的；
取消发布：npm unpublish；

# 章四
1，process：
> process.argv: 命令行参数数组，第一个元素是node，以此类推；
process.nextTick(callback): 为事件循环设置一项任务，Node.js会在下次事件循环响应时调用callback（一般用于拆分事件，从而减少每个事件的执行时间）；

2，console：
> console.trace(): 向标准错误流输出当前的调用栈；

3，util：
>util.inherits(constructor, superConstructor): 仅仅继承superConstructor在其原型中定义的函数，而构造函数内部创造的属性和函数都没有被继承；
util.inspect(object, [showHidden], [depth], [colors]): 将任意对象转换为字符串的方法，通常用于调试和错误输出；

4，events：
```javascript
            events.EventEmitter:
                 var events = require("events");
                 var emitter = new events.EventEmitter();
                  emitter.on("someEvent", function(arg1, arg2) {
                           console.lgo("listener1", arg1, arg2);
                 });
            emitter.emit("someEvent", "byvoid", 1991);
```

result:
>listener1 byvoid 1991            

emitter.emit("error");退出程序并打印调用栈。
只要是支持事件响应的核心模块都是EventEmitter的子类，例如fs、net、http。

5，fs:
>fs.readFile(filename, [encoding], [callback(err, data)];
fs.readFileSync(filename, [encoding]);
与同步I/O函数不同，node.js中异步函数大多没有返回值。

6, HTTP服务器:
>var http = requitr('http');

http.Server是一个基于事件的HTTP服务器,主要有以下几个事件:
>1,request: 当客户端请求到来时触发,提供两个参数req与res,分别是http.ServerRequest和http.ServerResponse的实例.
2,connection: 当TCP连接建立时触发,提供一个参数socket,是net.Socket的实例。该事件粒度大于request。
3,close: 当服务器关闭时触发,而不是用户连接断开时。
>由于最常用的是request，因此http提供了一个捷径：http.createServer([requestListener])，其功能是创建一个HTTP服务器并将requestListener作为request事件的监听函数。

而http.ServerRequest提供了以下三个事件用于控制传输：
>1，data：当请求体到来时触发，并提供一个参数chunk，表示接收到的数据。
2，end：当请求体数据传输完成时，该事件被触发。
3，close：用户当前请求结束时触发。

http.ServerResponse是返回给客户端的信息：
>1，response.WriteHead(statusCode, [headers]): 向客户端发送响应头。
2，response.write(data, [encoding]): 向请求的客户端发送响应内容。
3，response.end([data], [encoding]): 结束响应，告知客户端所有发送已经完成。如果不调用，客户端将永远处于等待状态。

# 章五
1，建立网站基本结构：
>express -t ejs microblog

2，创建应用实例：
>express.createServer()

3，控制权转移：
>express在处理路由规则时，会优先匹配先定义的路由规则，后面的规则将会被屏蔽，可使用next()进行转移。

4，路径匹配：
>app.get('/user/:username', function(req, res) { res.send('user: ' + req.params.username);

5，模板引擎ejs，有如下三种标签：
```html
        <% code %>：JavaScript代码；
        <%= code %>：显示替换过html特殊字符的内容；
        <%- code %>：显示原始html内容。
```

6，关闭layout：
>app.set('view options', { layout: false });
指定layout：
>function(req, res) { res.render('userlist', { title: '后台管理系统', layout: 'admin' }); }; 从而指定admin.ejs作为页面布局。

7，片段视图：
>partials。

8，视图助手：
>静态视图助手可以是任何类型的对象，包括接受任意参数的函数，并且访问到的对象必须是与用户请求无关的；
动态视图助手只能是一个函数，这个函数不能接受参数，但可以访问req合res对象；


# 章六
1，在不显式指定文件模块扩展名的时候，Node.js会分别试图加上.js、.json和.node扩展名。.js是JavaScript代码，.json是JSON格式的文本，.node是编译好的C/C++代码。

2，当require遇到一个既不是核心模块，又不是以路径形式表示的模块名称时，会试图在当前目录下的node_modules目录中来查找。如果没有找到，则会在当前目录的上一层中的node_modules目录中继续查找，反复执行这一过程，直到遇到根目录为止。

3，加载缓存：
>Node.js模块不会被重复加载，这是因为Node.js通过文件名缓存所有加载过的文件模块，所以以后再访问到时就不会重新加载了。注意，Node.js是根据实际文件名缓存的，加载两次，也不会重复加载，解析到的文件是同一个。

4，控制流问题：
>循环陷阱，可用forEach、闭包、let解决。
