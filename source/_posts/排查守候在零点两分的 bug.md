---
title: 排查守候在零点两分的 bug
date: 2020-09-18 14:00:29
categories: 前端
tags:
- Node.js
- JavaScript
---

** 最近接手泛前端团队的服务稳定性治理，遇到一些很有特点的线上问题，这边记录一次『有趣的 bug』排查 **

<!-- more -->

## 背景

故事的开始是由老板的一个艾特开始的：

![](/images/2am1.jpg)

当时排查了下没啥思路，就放弃了（以为偶现，过几天它能自己好起来！）。直到某一天我又收到了同样的告警，我回想了下最近好几天都有这个告警。

抬头一看：

![](/images/2am2.jpg)

心里一惊：别搞出事故啊！就开始了我的排查之路。



## 排查思路

根据告警错误栈显示，这是一个 "unhandledRejection"：

```
[ERROR][2020-09-16T23:59:59.582+0800][default:process.<anonymous>  at /home/xxx/xxx/xxx/lib/app.js:49:10] _undef||traceid=64594b155f6231298ae0e2b114a1a02||spanid=38197e8a96a6d96a||pid=1431||msg=on unhandledRejection, error: { Error: ERR invalid expire time in set
    at JavascriptReplyParser.parseResult (/home/xxx/xxx/xxx/node_modules/redis-parser/lib/javascript.js:90:16)
    at JavascriptReplyParser.tryParsing (/home/xxx/xxx/xxx/node_modules/redis-parser/lib/javascript.js:117:21)
    at JavascriptReplyParser.run (/home/xxx/xxx/xxx/node_modules/redis-parser/lib/javascript.js:131:22)
    at JavascriptReplyParser.execute (/home/xxx/xxx/xxx/node_modules/redis-parser/lib/javascript.js:112:10)
    at Socket.<anonymous> (/home/xxx/xxx/xxx/node_modules/redis/index.js:223:27)
    at emitOne (events.js:116:13)
    at Socket.emit (events.js:211:7)
    at addChunk (_stream_readable.js:263:12)
    at readableAddChunk (_stream_readable.js:250:11)
    at Socket.Readable.push (_stream_readable.js:208:10) command: 'SET', code: 'ERR' }
```

所以一层一层往上找，是找不到抛错的源头的！猜测了一通无果，于是我去翻告警群的记录，我发现了一个惊人的规律，该告警只要出现，必定是每天凌晨 00:02：

![](/images/2am3.jpg)

因此排查思路锁定在以下几个：

1. 存在每天定时任务设置某个 redis 值的超时时间？
2. 服务器时间存在误差？



## 排查过程

剧透下，并不是上述两个原因。

经过多番搜索代码，发现了几处设置 redis 值的代码，同时结合 Google，有人指出 Redis 设置的超时时间不能为小于 0。经过本地验证，的确发现超时时间不能为 0：

![](/images/2am4.jpg)

于是排查方向转为代码中哪里出现了设置超时时间小于 0 的逻辑。可疑代码如下：

```js
setRedisKey(
  redisTeamKey,
  data,
  24 * 3600 - getPastTimeOfToday() / 1000,
)
```



那么这个值 `24*3600 - getPastTimeOfToday() / 1000` 可能为 0 或者负数吗？我们来看看完整逻辑：

```js
const getPastTimeOfToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = strPadding(date.getMonth() + 1, '0', 2)
  const day = strPadding(date.getDate(), '0', 2)
  const todayStartTs = +new Date(`${year}/${month}/${day} 00:00:00`)
  return +new Date() - +new Date(todayStartTs)
}
```



这个值代表当前这个时间点，离今天结束还有多少秒的时间。可是这个值不可能小于 0，我甚至猜测是否执行上述代码第二行时是昨天，而第七行的时候是今天，这样能验证我们的猜测，即这个函数返回的值大于 `24*3600`，那 `24*3600 - getPastTimeOfToday() / 1000` 就小于 0 了。不过这个可能性比较低，于是我转而去服务器复现这个 bug，编写如下代码并执行：

```js
const { setRedisKey } = require('./lib/xxx/xxx/redis')

process.on('unhandledRejection', console.log)

setRedisKey('abc', 'value', 0)
```



执行结果如下，与告警的错误栈一致：

![](/images/2am5.jpg)

既然复现了错误，回头继续找 bug，深入到 `setRedisKey` 代码：

```js
const setRedisKey = (key, value, expireTime = DEFAULT_EXPIRETIME) => {
  return redis.set(key, value, 'EX', Math.floor(expireTime))
}
```



过期时间 `expireTime` 被 Math.floor 包裹，也就是说当 `0 < expireTime  < 1` 时，`Math.floor(expireTime)` 的值为 0。那么当服务器时间到无限接近 00:00:00 时，`getPastTimeOfToday` 将返回 `(24*3600-x)*1000` ，因为无限接近 00:00:00，因此 x 的值介于 0 - 1 之间（毕竟时间戳的最小单位是毫秒，想象下『当天剩余毫秒数』还有不到 1000 的情况）。



## 为什么 unhandledRejection

对了，为什么该错误没有被捕获？如果一开始被捕获，也就有完整的错误栈，那么排查过程肯定会顺利很多。业务代码如下（已脱敏）：

```js
Promise.resolve().then(() => {
  Promise.reject(new Error('出错了！'))
}).catch(console.error)
```

大家发现了吧，then 中的 Promise 没有返回，那么我返回了就一定会被捕获吗？在这种写法下是会的，大家可以尝试下，但是你写成下面这样，还是会 `unhandledRejection`：

```js
new Promise((resolve, reject) => {
  if (false) {
    resolve('对了！')
  }

  if (true) {
    return Promise.reject(new Error('出错了！'))
  }

  
  reject(new Error('兜底逻辑！'))
}).catch(console.warn)
```

为什么呢？因为需要手动调用 reject 才可抛错，这就需要层层将 resolve 和 reject 传入可能报错的 Promise 才行，珍爱生命远离 Promise，大家还是尽量用 `async/await` 语法（相同功能下）。



## 解决方式

原因既然依旧找到，解决方式也就出来了：

1. 向下取整 Math.floor 改为向上取整 Math.ceil（不过极端情况下还是存在当天剩余毫秒数恰好为 0 的情况）
2. 判断  `expireTime` 值小于等于 0 时，赋值为 1（续一秒，蛤蛤蛤），同时记录 warn 警告日志
3. 排查未 return 的 Promise，统一返回

尝试找了下 typescript 限制 number 为正整数的方式，没有找到，有的话求大神告知？



