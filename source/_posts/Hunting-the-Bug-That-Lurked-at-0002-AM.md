---
title: "Hunting the Bug That Lurked at 12:02 AM"
toc: true
date: 2020-09-18 14:00:29
categories: Node.js Server
tags:
- Node.js
- JavaScript
---

I recently took over the frontend team's service stability governance and encountered some very distinctive production issues. Here I'll document one particularly "interesting" bug hunt.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2020/09/18/%E6%8E%92%E6%9F%A5%E5%AE%88%E5%80%99%E5%9C%A8%E9%9B%B6%E7%82%B9%E4%B8%A4%E5%88%86%E7%9A%84%20bug/">简体中文</a>.
</div>
</article>

## Background

The story began with a mention from my boss:

![](/post-img/2am1.jpg)

I investigated at the time but couldn't find any leads, so I gave up (thinking it was intermittent and would fix itself in a few days!). Until one day I received the same alert again and realized it had been happening for several days.

Looking up:

![](/post-img/2am2.jpg)

I panicked—can't let this become an incident! So began my debugging journey.

## Debugging Approach

The alert error stack showed this was an "unhandledRejection":

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

Tracing up layer by layer didn't reveal the source! After several unsuccessful guesses, I went through the alert group history and discovered a stunning pattern—whenever this alert appeared, it was always at exactly 00:02 AM:

![](/post-img/2am3.jpg)

So the debugging focus narrowed to:

1. Is there a daily cron job setting a Redis value's expiration time?
2. Is there a server time discrepancy?

## Debugging Process

Spoiler: it was neither of those reasons.

After extensive code searching, I found several places that set Redis values. Combined with Google searches, someone pointed out that Redis expiration time cannot be less than 0. Local verification confirmed that expiration time cannot be 0:

![](/post-img/2am4.jpg)

The investigation shifted to where the code could produce an expiration time less than 0. The suspicious code:

```js
setRedisKey(
  redisTeamKey,
  data,
  24 * 3600 - getPastTimeOfToday() / 1000,
)
```

Could the value `24*3600 - getPastTimeOfToday() / 1000` be 0 or negative? Let's look at the full logic:

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

This value represents how many seconds remain until today ends. It shouldn't be negative. I even wondered if line 2 executed yesterday while line 7 executed today, which would make the function return a value greater than `24*3600`, making `24*3600 - getPastTimeOfToday() / 1000` negative. But that's unlikely. So I went to the server to reproduce the bug:

```js
const { setRedisKey } = require('./lib/xxx/xxx/redis')

process.on('unhandledRejection', console.log)

setRedisKey('abc', 'value', 0)
```

The result matched the alert error stack:

![](/post-img/2am5.jpg)

Having reproduced the error, I dug deeper into `setRedisKey`:

```js
const setRedisKey = (key, value, expireTime = DEFAULT_EXPIRETIME) => {
  return redis.set(key, value, 'EX', Math.floor(expireTime))
}
```

The expiration time `expireTime` is wrapped with Math.floor, meaning when `0 < expireTime < 1`, `Math.floor(expireTime)` equals 0. So when the server time approaches 00:00:00, `getPastTimeOfToday` returns `(24*3600-x)*1000`, and since it's very close to 00:00:00, x is between 0 and 1 (imagine when the "remaining milliseconds of the day" are less than 1000).

## Why unhandledRejection

Why wasn't this error caught? If it had been caught from the start with a complete error stack, debugging would have been much smoother. The business code (sanitized):

```js
Promise.resolve().then(() => {
  Promise.reject(new Error('Error!'))
}).catch(console.error)
```

Did you spot it? The Promise in then isn't returned. But would returning it definitely catch it? In this pattern, yes. But written like this, it still causes `unhandledRejection`:

```js
new Promise((resolve, reject) => {
  if (false) {
    resolve('Correct!')
  }

  if (true) {
    return Promise.reject(new Error('Error!'))
  }

  reject(new Error('Fallback logic!'))
}).catch(console.warn)
```

Why? Because you need to manually call reject to throw errors, which requires passing resolve and reject layer by layer into potentially failing Promises. Cherish life, stay away from raw Promises—use `async/await` syntax instead (for equivalent functionality).

## Solution

Now that we've found the cause, the fix is clear:

1. Change Math.floor (floor) to Math.ceil (ceiling)—though in extreme cases, remaining milliseconds could be exactly 0
2. When `expireTime` is <= 0, assign it to 1 (one more second, haha), and log a warning
3. Check for unreturned Promises and return them uniformly

I tried finding a TypeScript way to constrain number to positive integers but couldn't find one. If anyone knows how, please share!
