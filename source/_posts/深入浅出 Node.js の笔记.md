---
title: 深入浅出 Node.js の笔记
toc: true
date: 2016-12-25 21:09:38
categories: 读书笔记
tags:
- JavaScript
- Node.js
---

前端开发人员上手 Node.js 还是需要课补一些服务端知识的。
<!-- more -->

# 章一，章二

1. 单线程，使得 Node 不需要像多线程编程那样处处在意状态的同步问题（没有死锁，没有线程上下文交换）
2. exports 对象用于导出当前模块的方法或变量，此外，在模块中还存在一个 module 对象，它代表模块自身，而 exports 是 module 的属性
3. exports 和 module.exports 的区别:
   1. module.exports 初始值为一个空对象 {}
   2. exports 是指向的 module.exports 的引用
   3. require() 返回的是 module.exports 而不是 exports
4. require 模块时优先从缓存中加载，而 Node 缓存的是编译和执行之后的对象
5. require 模块时，可省略扩展名，Node 会依次补足 .js, .json, .node 进行尝试，建议后缀为 .json 和 .node 时带上扩展名
6. 在模块编译过程中，Node 对获取的 JavaScript 文件进行了头尾包装，使其执行在一个包含特定变量（exports，require，module，__filename，__dirname）的闭包中，该闭包返回模块的 exports 属性


# 章三

1. 阻塞 IO: 等到系统内核层面完成所有操作之后，调用随之结束

2. 非阻塞 IO: 调用之后立即返回（不携带处理完成的数据，因为尚未生成），之后还得通过文件描述符再次读取数据

3. 非阻塞 IO 返回之后，CPU 时间片可以用于处理其它事务，但为了获取完整数据需要轮询，以判断操作是否完成

4. 轮询满足了非阻塞 IO 确保获取完整数据的需求，但是对于应用程序而言，它仍然是一种同步，因为应用程序仍然需要等待 IO 完全返回

5. Node 的单线程仅仅是指 JavaScript 执行在单线程中，内部另有线程池完成 IO 任务

6. Node 经典的调用方式: 从 JavaScript 调用 Node 的核心模块；核心模块调用 C++ 内建模块；内建模块通过 libuv 进行系统调用（其中 libuv 作为封装层，有两个平台的实现）

7. Node 的异步:

   第一部分：JavaScript 调用立即返回；接着在进行系统调用过程中，创建了一个请求对象，该对象包含了从JavaScript 层传入的参数和当前方法，以及回调函数；接着将该对象推入系统的线程池中等待执行，而不用在乎该操作是否阻塞 IO

   第二部分：线程池中的 IO 操作调用完毕之后，将 IO 结果通知并归还线程；此时在每次 Tick 的执行中，会调用特定方法检查线程池中是否有执行完的请求；若存在则将请求对象加入到 IO 观察者的队列中，然后将其当做事件处理

8. setTimeout 与 setInterval 的定时并不精确，相比 process.nextTick 更为浪费性能

9. process.nextTick 在每轮循环中将数组中的回调函数全部执行完毕，而 setImmediate 则在每轮循环中执行链表中的一个回调函数


# 章四

1. 雪崩: 在高访问量，大并发量的情况下缓存失效的情景，此时大量的请求同时涌入数据库中数据库无法同时承受如此大的查询请求，进而往前影响到网站整体的响应速度
2. 使用 once 解决雪崩问题:

```js
const proxy = new events.EventEmitter();
let status = 'ready';
const select = function(callback) {
  proxy.once('selected', callback);
  if(status === 'ready') {
    status = 'pending';
    db.select('SQL', (ret) => {
      proxy.emit('selected', ret);
      status = 'ready';
    });
  }};
```

将所有请求回调都压入事件队列中，使用 once 保证每个回调只会被执行一次，对于相同的 SQL 语句，保证只查询一次；SQL 在进行查询时，新到来的相同调用只需在队列中等待就绪即可，一旦查询结束，得到的结果可以被这些调用共同使用（因为都监听了 'selected' 事件）

3. 尾触发: next() 机制

# 章五

1. 解除引用：delete 操作和重新赋值具有相同的效果，在 V8 中通过 delete 删除对象的属性有可能干扰V8的优化，所以建议使用赋值方式。

2. 无法立即回收的内存有闭包和全局变量引用这两种情况。由于V8的内存限制，要十分小心此类变量是否无限制地增加，因为它会导致老生代中的对象增多。

3. 堆中的内存总是小于进程的内存，这意味着 Node 中的内存使用并非都是通过 V8 进行分配的。那些不是通过 V8 分配的内存称为堆外内存。例如 Buffe r对象，它不经过V8的内存分配机制，所以也不会有堆内存的大小限制。

4. 由于模块的缓存机制，模块是常驻老生代的。在设计模块时，要十分小心内存泄漏的出现。在下面的代码，每次调用 leak() 方法时，都导致局部变量 leakArray 不停增加内存的占用，且不被释放：

   ```js
   var leakArray = [];
   exports.leak = function () {
     leakArray.push("leak" + Math.random());
   };
   ```

   如果模块不可避免地需要这么设计，那么请添加清空队列的相应接口，以供调用者释放内存。

   ​

   深度的解决方案应该是监控队列的长度，一旦堆积，应当通过监控系统产生报警并通知相关人员。

   另一个解决方案是任意异步调用都应该包含超时机制，一旦在限定的时间内未完成响应，通过回调函数传递超时异常，使得任意异步调用的回调都具备可控的响应时间，给消费速度一个下限值。

5. 由于V8的内存限制，我们无法通过fs.readFile()和fs.writeFile()直接进行大文件的操作，而改用fs.createReadStream()和fs.createWriteStream()方法通过流的方式实现对大文件的操作。



# 章六

1. 如果需要超过 8 KB 的 Buffer 对象，将会直接分配一个 SlowBuffer 对象作为 slab 单元，这个 slab 单元将会被这个大 Buffer 对象独占。

2. 上面提到的 Buffer 对象都是 JavaScript 层面的，能够被 V8 的垃圾回收标记回收。但是其内部的 parent 属性指向的 SlowBuffer 对象却来自于 Node 中 C++ 层面上的 Buffe r对象，所用内存不在 V8 的堆中。

3. 当进行小而频繁的 Buffer 操作时，采用 slab 的机制进行预先申请和事后分配，使得 JavaScript 到操作系统之间不必有过多的内存申请方面的系统调用。对于大块的 Buffer 而言，则直接使用 C++ 层面提供的内存，而无需细腻的分配操作。

4. buffer += chunk; 这句代码里隐藏了 toString() 操作，它等价于如下的代码：

   ```js
   buffer = buffer.toString() + chunk.toString();
   ```

5. 通过预先转换静态内容为 Buffer 对象，可以有效地减少 CPU 的重复使用，节省服务器资源。在 Node 构建的 Web 应用中，可以选择将页面中的动态内容和静态内容分离，静态内容部分可以通过预先转换为 Buffer 的方式，使性能得到提升。由于文件自身是二进制数据，所以在不需要改变内容的场景下，尽量只读取 Buffer，然后直接传输，不做额外的转换，避免损耗。



# 章七

1. TCP 针对网络中的小数据包有一定的优化策略：Nagle算法。Nagle算法要求缓冲区的数据达到一定数量或者一定时间后才将其发出，所以小数据包将会被Nagle算法合并，以此来优化网络。这种优化虽然使网络带宽被有效地使用，但是数据有可能被延迟发送。

2. 在 Node 中，TCP 默认启用了 Nagle 算法，调用 socket.setNoDelay(true) 关闭 Nagle 算法，使得write() 可以立即发送数据到网络中。
   另一个需要注意的是，尽管在网络的一端调用 write() 会触发另一端的 data 事件，但是并不意味着每次 write() 都会触发一次 data 事件，在关闭掉 Nagle 算法后，另一端可能会将接收到的多个小数据包合并，然后只触发一次 data 事件。

3. UDP 与 TCP 同属于网络传输层。TCP 中连接一旦建立，所有的会话都基于连接完成，客户端如果要与另一个 TCP 服务通信，需要另创建一个套接字来完成连接。但在 UDP 中，一个套接字可以与多个 UDP 服务通信，常常应用在那种偶尔丢一两个数据包也不会产生重大影响的场景，比如音频、视频等。UDP 目前应用很广泛，DNS 服务即是基于它实现的。

4. 报文体部分则抽象为一个只读流对象，如果业务逻辑需要读取报文体中的数据，则要在这个数据流结束后才能进行操作，如下所示：

   ```js
   function (req, res) {
     // console.log(req.headers);
       var buffers = [];
       req.on('data', function (trunk) {
       buffers.push(trunk);
     }).on('end', function () {
       var buffer = Buffer.concat(buffers);
       // TODO
       res.end('Hello world');
     });
   }

   ```

5. HTTP响应对象：它封装了对底层连接的写操作，可以将其看成一个可写的流对象。它影响响应报文头部信息的 API 为 res.setHeader() 和 res.writeHead()。在上述示例中：
     res.writeHead(200, {'Content-Type': 'text/plain'});

   其分为 setHeader() 和 writeHead() 两个步骤。它在 http 模块的封装下，实际生成如下报文：

   < HTTP/1.1 200 OK
   < Content-Type: text/plain

   我们可以调用 setHeader 进行多次设置，但只有调用 writeHead 后，报头才会写入到连接中。除此之外，http模块会自动帮你设置一些头信息，如下所示：

   < Date: Sat, 06 Apr 2013 08:01:44 GMT
   < Connection: keep-alive
   < Transfer-Encoding: chunked
   ​

6. 报文体部分则是调用 res.write() 和 res.end() 方法实现，差别在于 res.end() 会先调用 write() 发送数据，然后发送信号告知服务器这次响应结束。

7. 响应结束后，HTTP 服务器可能会将当前的连接用于下一个请求，或者关闭连接。值得注意的是，报头是在报文体发送前发送的，一旦开始了数据的发送，writeHead() 和 setHeader() 将不再生效。
   另外，无论服务器端在处理业务逻辑时是否发生异常，务必在结束时调用res.end()结束请求，否则客户端将一直处于等待的状态。

8. 同时 http 模块提供了一个底层 API：http.request(options, connect)，用于构造 HTTP 客户端。

9. 为了重用 TCP 连接，http 模块包含一个默认的客户端代理对象 http.globalAgent。它对每个服务器端（host + port）创建的连接进行了管理，默认情况下，通过 ClientRequest 对象对同一个服务器端发起的 HTTP 请求最多可以创建 5 个连接。

10. 除此之外，WebSocket 与传统 HTTP 有如下好处：

   > 1. 客户端与服务器端只建立一个TCP连接，可以使用更少的连接。
   > 2. WebSocket服务器端可以推送数据到客户端，这远比HTTP请求响应模式更灵活、更高效。
   > 3. 有更轻量级的协议头，减少数据传送量。



# 章八

### 基础功能与数据上传

1. RESTful 类 Web 服务中请求方法：

   > 1. PUT 代表新建一个资源
   > 2. POST 表示要更新一个资源
   > 3. GET 表示查看一个资源
   > 4. 而 DELETE 表示删除一个资源

   我们可以通过请求方法来决定响应行为，如下所示：

   ```js
   function (req, res) {
     switch (req.method) {
     case 'POST':
     	update(req, res);
     	break;
     case 'DELETE':
     	remove(req, res);
     	break;
     case 'PUT':
     	create(req, res);
     	break;
     case 'GET':
     	default:
     	get(req, res);
     }
   }
   ```

   ​

2. ```js
   var url = require('url');
   var querystring = require('querystring');
   var query = querystring.parse(url.parse(req.url).query);

   //更简洁的方法是给url.parse()传递第二个参数，如下所示：
   var query = url.parse(req.url, true).query;

   // 它会将foo=bar&baz=val解析为一个JSON对象，如下所示：
   {
     foo: 'bar',
     baz: 'val'
   }

   ```

3. 要注意的点是，如果查询字符串中的键出现多次，那么它的值会是一个数组，如下所示：

   ```js
   // foo=bar&foo=baz
   var query = url.parse(req.url, true).query;

   // {
   // foo: ['bar', 'baz']
   // }

   ```

   业务的判断一定要检查值是数组还是字符串，否则可能出现TypeError异常的情况。

4. Cookie 的处理分为如下几步：

   > 1. 服务器向客户端发送 Cookie。
   > 2. 浏览器将 Cookie 保存。
   > 3. 之后每次浏览器都会将 Cookie 发向服务器端。

5. HTTP_Parser 会将所有的报文字段解析到 req.headers 上，那么 Cookie 就是 req.headers.cookie。

6. 响应的 Cookie 值在 Set-Cookie 字段中，规范中对它的定义如下所示：
   Set-Cookie: name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com;
   其中 name=value 是必须包含的部分，其余部分皆是可选参数。

   > 1. path 表示这个 Cookie 影响到的路径，当前访问的路径不满足该匹配时，浏览器则不发送这个 Cookie。
   > 2. HttpOnly 告知浏览器不允许通过脚本 document.cookie 去更改这个 Cookie 值，事实上，设置HttpOnly 之后，这个值在 document.cookie 中不可见。但是在 HTTP 请求的过程中，依然会发送这个Cookie到服务器端。
   > 3. Secure，当Secure值为true时，在HTTP中是无效的，在HTTPS中才有效，表示创建的Cookie只能在HTTPS连接中被浏览器传递到服务器端进行会话验证，如果是HTTP连接则不会传递该信息，所以很难被窃听到。

7. 如果在域名的根节点设置 Cookie，将使得几乎所有子路径下的请求都会带上这些Cookie。

   解决方法：为静态组件使用不同的域名

   > 1. 为不需要 Cookie 的组件换个域名减少无效 Cookie 的传输。
   > 2. 同时还可以突破浏览器下载线程数量的限制，因为域名不同，可以将下载线程数翻倍。
   > 3. 缺点是域名转换为 IP 需要进行 DNS 查询，多一个域名就多一次 DNS 查询。

8. 为了解决 Cookie 敏感数据的问题，Session 的数据只保留在服务器端，使数据的安全性得到一定的保障。

   两种方式：

   > 1. 第一种：基于Cookie来实现用户和数据的映射
   > 2. 第二种：通过查询字符串来实现浏览器端和服务器端数据的对应
   >
   > 注: 用户访问 http://localhost/pathname 时，如果服务器端发现查询字符串中不带 session_id 参数，就会将用户跳转到 http://localhost/pathname?session_id=12344567 这样一个类似的地址。如果浏览器收到302状态码和Location报头，就会重新发起新的请求。
   >
   > 有的服务器在客户端禁用Cookie时，会采用这种方案实现退化。通过这种方案，无须在响应时设置Cookie。但是这种方案带来的风险远大于基于Cookie实现的风险，因为只要将地址栏中的地址发给另外一个人，那么他就拥有跟你相同的身份。Cookie的方案在换了浏览器或者换了电脑之后无法生效，相对较为安全。

9. 为了解决性能问题和 Session 数据无法跨进程共享的问题，常用的方案是将 Session 集中化，将原本可能分散在多个进程里的数据，统一转移到集中的数据存储中。工具有 Redis、Memcached 等，通过这些高效的缓存，Node 进程无须在内部维护数据对象，垃圾回收问题和内存限制问题都可以迎刃而解，并且这些高速缓存设计的缓存过期策略更合理更高效，比在Node中自行设计缓存策略更好。

10. 采用第三方缓存来存储 Session 引起的一个问题是会引起网络访问。理论上来说访问网络中的数据要比访问本地磁盘中的数据速度要慢，因为涉及到握手、传输以及网络终端自身的磁盘I/O等，尽管如此但依然会采用这些高速缓存的理由有以下几条：

   > 1. Node 与缓存服务保持长连接，而非频繁的短连接，握手导致的延迟只影响初始化。
   > 2. 高速缓存直接在内存中进行数据存储和访问。
   > 3. 缓存服务通常与Node进程运行在相同的机器上或者相同的机房里，网络速度受到的影响较小。

11. ETag: 由服务端生成，服务端还可以决定它的生成规则，例如根据文件内容生成 Hash 值
12. 数据上传与安全：

> 内存限制：1. 限制上传内容的大小，一旦超过限制，停止并响应 400 状态码；2. 通过流式解析，将数据流导向磁盘中，Node 只保留文件路径等小数据

> CSRF：跨站请求伪造，可为每个请求的用户在 Session 中赋予一个随机值



### 路由解析与中间件

1. MVC

> Controller，一组行为的集合
>
> Model，数据相关的操作和封装
>
> View，视图的渲染

2. require 的缓存机制使得只有在首次 require 时是阻塞的
3. RESTful：将服务器端提供的内容看做一个资源，对该资源的操作只要体现在 HTTP 请求方法上：

> POST  /user/tihu
>
> DELETE /user/tihu
>
> PUT /user/tihu
>
> GET /user/tihu

4. Connect 中间件使用 next() 进行尾触发
5. 中间件与性能：

> 1. 编写高效的中间件：提高单个处理单元的处理速度，以尽早调用 next()；缓存需要重复计算的结果；避免不必要的计算
> 2. 合理使用路由：例如只处理静态资源的中间件，可限定路由（app.use('/public', statcFile))，从而避免对整站都处理



# 章九

1. 创建子进程：child_process 模块的四种方法

> 1. spawn() 启动一个子进程来执行命令
> 2. exec() 与 spawn 不同，它多了一个用于获知子进程状况的回调
> 3. execFile() 启动一个子进程来执行可执行文件
> 4. fork() 与 spawn 类似，不同点在于创建的子进程只需指定 JavaScript 文件模块
>
> 注：其中 2，3 可设置超时

2. 子进程对象的 send() 方法支持发送以下五种类型的句柄

> 1. net.Socket，TCP 套接字
> 2. net.Server， TCP 服务器
> 3. net.Native， C++ 层面的 TCP 套接字或 IPC 管道
> 4. dgram.Socket，UDP 套接字
> 5. dgram.Native， C++ 层面的 UDP 套接字

3. 多个应用监听相同端口时，文件描述符同一时间只能被某个进程所用，即抢占式的，因此只有一个进程能够抢到连接
4. 除了 send() 外，还能通过 kill() 方法给子进程发送消息，kill() 方法只是给子进程发送了一个系统信号，进程在收到这些系统信号时，做出约定的行为
5. 自杀信号：当所有进程都处于等待退出状态，并停止接收新连接，如果等到进程退出才重启，则此时新来的请求可能存在没有工作进程为新用户服务的情景，从而丢失请求；解决方法是在子进程决定退出前主动向父进程发送一个 “自杀信号” 通知父进程，使得父进程能够及时创建新进程。
6. 限量重启：当重启过于频繁时，主动通知进程放弃重启
7. 状态共享，使用第三方进行数据存储，比如数据库，磁盘文件，缓存服务（如 Redis），因此需要一种机制通知各个子进程：各个子进程向第三方进行定时轮询
8. 状态共享，主动通知，可设计一个进程只进行轮询和通知，如果想跨越多台服务器，可采用 UDP 或 TCP 方案



# 章十

1. 单测原则

> 1. 单一职责
> 2. 接口抽象
> 3. 层次分离

2. TDD：测试驱动开发；BDD：行为驱动开发；二者差别：

> 1. 关注点不同，TDD 关注所有功能是否被正确实现，每个功能对应一个测试用例；BDD 关注整体行为是否符合预期，适合自顶向下的设计方式
> 2. 表达方式不同，TDD 偏向于功能说明书风格，而 BDD 更接近与自然语言的习惯

3. BDD：before 与 after 分别在进入和退出 describe 时触发，beforeEach 与 afterEach 分别在 describe 中的每个测试用例执行前和执行后触发

4. 性能测试

   > 1. 基准测试，统计在多少时间内执行了多少次某个方法
   > 2. 压力测试，对网络接口进行压测的指标主要有吞吐率，响应时间和并发数
