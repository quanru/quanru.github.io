---
title: What Is Currying Actually Useful For in Functional Programming?
toc: true
date: 2016-10-06 17:10:37
categories: Frontend Learning
tags:
- JavaScript
- Functional Programming
---

**Functional programming has been increasingly active lately. When I was interning last year, I bought a copy of "Functional Programming in JavaScript," read through it hastily with only a vague understanding. After re-reading it this year, I'm writing this blog post to share my understanding of currying.**

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/10/06/%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BC%96%E7%A8%8B%E4%B8%AD%E7%9A%84%E6%9F%AF%E9%87%8C%E5%8C%96%E5%88%B0%E5%BA%95%E6%9C%89%E4%BB%80%E4%B9%88%E7%94%A8%EF%BC%9F/">简体中文</a>.
</div>
</article>

# Currying

A curried function returns a new function for each logical argument. (*Functional Programming in JavaScript*)

>Simply put, currying is the process of reducing the arity of higher-order functions.
For example, transforming:
function(arg1,arg2) into function(arg1)(arg2)
function(arg1,arg2,arg3) into function(arg1)(arg2)(arg3)
function(arg1,arg2,arg3,arg4) into function(arg1)(arg2)(arg3)(arg4)
...
function(arg1,arg2,...,argn) into function(arg1)(arg2)...(argn)

>Author: Xiaodie Jinghong
Link: [https://www.zhihu.com/question/40374792/answer/86268208](https://www.zhihu.com/question/40374792/answer/86268208)
Source: Zhihu

## Examples

### One Argument
> Force accepting only one argument
```js
// Auto-curry for single argument
function curry (fun) {
  return function (arg) {
    return fun(arg);
  }
}

// ES6 version
function curry (fun) {
  return arg => fun(arg);
}

[1, 2, 3, 4, 5].map(parseInt)
//[1, NaN, NaN, NaN, NaN]

[1, 2, 3, 4, 5].map(curry(parseInt))
//[1, 2, 3, 4, 5]

```

### Two Arguments

```js
// Normal two-argument addition
function normalAdd(x, y) {
  return x + y;
}

// Curried version
function add(y) {
  return function(x) {
    return x + y;
  }
}

let add2 = add(2);

add2(3);
// 5

// Normal two-argument multiplication
function normalMultiply(x, y) {
  return x * y;
}

// Curried version
function multiply(y) {
  return function(x) {
    return x * y;
  }
}

let multiply2 = multiply(2);

multiply2(3);
// 6

// Auto-curry
function curry2 (fun) {
  return function (arg2) {
    return function (arg1) {
      return fun(arg1, arg2);
    }
  }
}

// ES6 version
function curry2 (fun) {
  return arg2 => arg1 => fun(arg1, arg2);
}

let curryAdd = curry2(normalAdd);
let curryAdd2 = curryAdd(2);

let curryMultiply = curry2(normalMultiply);
let curryMultiply2 = curryMultiply(2);

curryAdd2(3);
// 5

curryMultiply2(3);
// 6

```

### Three Arguments

```js
// Normal version
function normalAddThenMultiply(arr, factor, increase) {
  let tempArr = arr.map(function(ele, index) {
    return normalAdd(ele, increase);
  });

  return tempArr.map(function(ele, index) {
    return normalMultiply(ele, factor);
  });
}

normalAddThenMultiply([1, 2, 3], 3, 2);
// [9, 12, 15]


// Curried version
function addThenMultiply(increase){
    return function(factor) {
      return function(arr) {
        let addStep = curry2(normalAdd);
        let multiplyFactor = curry2(normalMultiply);
        let tempArr = arr.map(addStep(increase));
        return tempArr.map(multiplyFactor(factor));
      }
    }
  }

let add2Multiply = addThenMultiply(2);

let add2Multiply3 = add2Multiply(3);

add2Multiply3([1, 2, 3]);
// [9, 12, 15]


// Auto-curry
function curry3 (fun) {
  return function (last) {
    return function (middle) {
      return function (first) {
        return fun(first, middle, last);
      }
    }
  }
}

// ES6 version
function curry3(fun) {
  return last => middle => first => fun(first, middle, last);
}

let curryAddMultiply = curry3(normalAddThenMultiply);
let curryAdd2Multiply = curryAddMultiply(2);
let curryAdd2Multiply3 = curryAdd2Multiply(3);

curryAdd2Multiply3([1, 2, 3]);
// [9, 12, 15]
```

# What Is Currying Actually Useful For

> Each step is an explicit call (consuming one argument), while caching the result of that step (returning an anonymous closure that awaits the next argument), thereby deferring the call. When the time is right, the next argument can be passed to continue the invocation.

## Application with Two Arguments

```js
  // Used to define a series of actions
 actionList = [{
   "action": "isLogin",
   "hasCallback": true
   }, {
   "action": "doLogin",
   "hasCallback": false
   }, {
   "action": "setTitle",
   "hasCallback": true
 }];

 // Factory function for batch-generating APIs
 factory(actionList) {
   for (let value of actionList) {
     this[`${value.action}`] = this.generator(value);
   }
 }

 // Simplified API generator function
 generator(action) {
    return function(params) {

      let MyPromise = es6Promise.Promise;

      action['params'] = params;

      return new MyPromise((resolve, reject) => {
        let callbackId = this.generateId();
        this.responseCallbackList[callbackId] = (data) => {
          resolve(data);
        }
        this.sendAction(action, callbackId);
      });
    }
  }

// Final usage, where params are passed by the user at call time
   bridge.setTitle({skin: 'red', color: '#666'})
   .then((data) => {
      alert(data);
   })
   .catch((err) => {
     alert(err);
   });

```

## Application with Three Arguments

```js
// redux-thunk middleware
export default function thunkMiddleware({ dispatch, getState }) {
  return next => action =>
    typeof action === 'function' ? action(dispatch, getState) : next(action);
}
```

This middleware expects a first argument { dispatch, getState } and returns an anonymous function expecting a next parameter. Since the value of next is determined by the previous middleware, the call is deferred until the next parameter is passed. Finally, it returns a new function (the enhanced dispatch function with middleware), which expects an action parameter.

For detailed invocation process and principles, see: [Understanding Redux Middleware](https://zhuanlan.zhihu.com/p/21391101)


References:
[Functional Programming for Frontend Developers](https://zhuanlan.zhihu.com/p/22476797)
[Deep Dive into Source Code: Understanding Redux Design and Usage](http://div.io/topic/1309)
[Understanding Redux Middleware](https://zhuanlan.zhihu.com/p/21391101)
