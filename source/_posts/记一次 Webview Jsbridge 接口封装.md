---
title: "记一次 Webview Jsbridge 接口封装"
toc: true
date: 2016-10-02 09:31:21
categories: 工作记录
tags:
- JavaScript
- Webview
- JsBridge

---

由于我司原有的 Jsbridge 方案调用繁琐, 参数多层嵌套, 并在多个 APP 上存在兼容性问题, 引来我司前端开发人员的一致吐槽...

<!-- more -->

# 前因

客户端开发人员站在自己的角度上, 根据前端需要使用的功能设计出了一套 Jsbridge 交互方案, 该方案虽然能很好地完成 native 与 h5 页面的相互调用对方的函数(方法), 但是由于没有充分考虑到前端开发的使用习惯, 导致该方案难以推广, 作为我司前端的一员, 恰好又被分在了公共组, 觉得十分有必要封装一层对前端开发人员友好的 API.

# 新旧对比

##  旧的方式

+ 同步接口

```js
  const data = {
    "action": "doLogin"
  }
  bridge.send(JSON.stringify(data));
```

+ 异步接口

```js
  const data = {
    "action": "isLogin"
  }
  bridge.send(JSON.stringify(data), (response) => {
    alert(response === 'true');
  });
```

#### 优缺点

+ 优点: 1.接口统一使用bridge.send方式执行

+ 缺点: 1.参数为多层JSON格式, 比较繁琐, 2.参数众多, 容易写错, 3.语义化不足, 调用起来不直观

**例如:closeWebView**
>关闭当前 webview ，并向下一个打开的 webview 传递 message 信息

```js
  //发送参数
  const data = {
    "action": "closeWebView",
    "params": {
      "message": {
        "action": "prePageClose",
        "params": {
    "message": "data form previous page"
        }
      }
    }
  }
  bridge.send(JSON.stringify(data));

  //在上一个 webview 中需要初始化 bridge.init 来监听消息

  bridge.init((data) => {
    data === JSON.stringify({
      "action": "prePageClose",
      "params": {
        "message": "data form previous page"
      }
    });
  });
```

## 新的方式

+ 同步

```js

  bridge.doLogin();

```

+ 异步

```js
  jsbridge.isLogin()
  .then((res) => {
    if(res) {
    alert("已登录!");
      } else {
    alert("未登录!");
      }
  })
  .catch((err) => {
      alert(err);
  });
```

#### 优缺点

+ 优点: 1. 使用 Promise 实现, 符合前端习惯; 2. 同步的接口也返回 Promise, 方便后续异步化; 3. API 方法名直接体现action, 比较直观; 3. catch函数能处理异常

# 新的实现方式

+ native 与 h5交互
h5通过如下函数向native发送消息

```js

  web.handleMessageFromJs

```

>无回调api: 直接使用上述函数向native发送消息

>有回调api: 除了发送消息外, 还需发送一个 unique id 标记回调函数, 当客户端执行完毕, 便可根据 unique id 执行该回调函数, 并提供超时销毁机制

+ 动态生成 API

>通过一个 action 列表, 生成对应的 API 函数, 方便动态地扫描新增的 API, 并添加到 Jsbridge 库中

```js
    // action 列表
    const actionList = [
        {"action": "isLogin", "hasCallback": true},
        {"action": "doLogin", "hasCallback": false},
        {"action": "test", "hasCallback": true}
    ];

    // 根据列表生成 API 函数
    factory(actionList) {
    for (let value of actionList) {
      this[`${value.action}`] = this.generator(value);
    }
  }

    // API 生成器, 根据是否有回调函数, 分别生成同步 API 和 异步 API
    generator(action) {
    return function(params) {

      action['params'] = params;
      if (!action.hasCallback) {
        return new Promise((resolve, reject) => {
          this.sendAction(action);
          resolve();
        });
      } else {
        return new Promise((resolve, reject) => {
          let callbackId = this.generateId();
          this.responseCallbackList[callbackId] = (data) => {
            clearTimeout(destoryCallback);
            resolve(data);
          }
          this.sendAction(action, callbackId);

          // 超时销毁回调
          let destoryCallback = setTimeout(() => {
            delete this.responseCallbackList[callbackId];
            reject(new Error('TIME EXCEED'));
          }, 5000);

        });
      }
    }
  }

```

# 关于 generator 函数

最近函数式编程越来越火, 从某种意义上来说该函数就是传说中的 curry 函数:

1. 它接受一个函数
2. 返回一个只接收一个参数的函数

好屌, 高阶函数有木有!
