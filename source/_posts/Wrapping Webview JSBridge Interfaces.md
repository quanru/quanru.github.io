---
title: "Wrapping Webview JSBridge Interfaces"
toc: true
date: 2016-10-02 09:31:21
categories: Work Journal
tags:
- JavaScript
- Webview
- JsBridge

---

Our company's existing JSBridge solution had cumbersome invocations, deeply nested parameters, and compatibility issues across multiple apps, drawing widespread complaints from our frontend developers...

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/10/02/%E8%AE%B0%E4%B8%80%E6%AC%A1%20Webview%20Jsbridge%20%E6%8E%A5%E5%8F%A3%E5%B0%81%E8%A3%85/">简体中文</a>.
</div>
</article>

# Background

The client-side developers designed a JSBridge interaction scheme from their own perspective, based on the features that the frontend needed. While the scheme could effectively handle mutual function calls between native and H5 pages, it was difficult to promote because it didn't adequately consider frontend developers' usage habits. As a member of the frontend team assigned to the shared infrastructure group, I felt it was necessary to wrap a developer-friendly API layer on top of the existing solution.

# Comparing Old and New Approaches

## The Old Way

+ Synchronous interface

```js
  const data = {
    "action": "doLogin"
  }
  bridge.send(JSON.stringify(data));
```

+ Asynchronous interface

```js
  const data = {
    "action": "isLogin"
  }
  bridge.send(JSON.stringify(data), (response) => {
    alert(response === 'true');
  });
```

#### Pros and Cons

+ Pros: 1. All interfaces use the unified `bridge.send` method

+ Cons: 1. Parameters are in multi-level JSON format, which is cumbersome; 2. Too many parameters make it easy to make mistakes; 3. Insufficient semantic clarity makes calls unintuitive

**Example: closeWebView**
> Closes the current webview and passes a message to the next opened webview

```js
  //sending parameters
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

  //In the previous webview, you need to initialize bridge.init to listen for messages

  bridge.init((data) => {
    data === JSON.stringify({
      "action": "prePageClose",
      "params": {
        "message": "data form previous page"
      }
    });
  });
```

## The New Way

+ Synchronous

```js

  bridge.doLogin();

```

+ Asynchronous

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

#### Pros and Cons

+ Pros: 1. Implemented with Promises, matching frontend conventions; 2. Synchronous interfaces also return Promises for easy future async conversion; 3. API method names directly reflect the action, making them intuitive; 4. The catch function handles exceptions

# The New Implementation

+ Native and H5 interaction
H5 sends messages to native using the following function:

```js

  web.handleMessageFromJs

```

> APIs without callbacks: directly use the above function to send messages to native

> APIs with callbacks: in addition to sending the message, a unique ID is sent to identify the callback function. When the client finishes execution, it can use the unique ID to invoke the callback, with a timeout cleanup mechanism

+ Dynamic API generation

> Through an action list, corresponding API functions are generated, making it easy to dynamically scan for new APIs and add them to the JSBridge library

```js
    // action list
    const actionList = [
        {"action": "isLogin", "hasCallback": true},
        {"action": "doLogin", "hasCallback": false},
        {"action": "test", "hasCallback": true}
    ];

    // Generate API functions from the list
    factory(actionList) {
    for (let value of actionList) {
      this[`${value.action}`] = this.generator(value);
    }
  }

    // API generator: creates sync or async APIs depending on whether a callback is needed
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

          // Timeout cleanup for the callback
          let destoryCallback = setTimeout(() => {
            delete this.responseCallbackList[callbackId];
            reject(new Error('TIME EXCEED'));
          }, 5000);

        });
      }
    }
  }

```

# About the Generator Function

With functional programming gaining popularity, this function is essentially a curried function in the traditional sense:

1. It accepts a function
2. Returns a function that takes a single parameter

A higher-order function indeed!
