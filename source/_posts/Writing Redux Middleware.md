---
title: "Redux Middleware: From Getting Started to Writing Your Own"
toc: true
date: 2017-03-18 20:15:09
categories: Frontend Learning
tags:
- JavaScript
- Redux
- Source Code Analysis
---

A deep dive into understanding Redux middleware internals and writing custom middleware for async requests and error handling.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2017/03/18/%E7%BC%96%E5%86%99%20redux%20%E4%B8%AD%E9%97%B4%E4%BB%B6/">简体中文</a>.
</div>
</article>

## Redux Middleware

Redux provides a middleware mechanism similar to that of web servers. In web development, middleware processes individual requests; in Redux, middleware processes individual actions. This allows developers to perform various centralized operations on specific actions within middleware, such as logging, data fetching, and error handling.

## How to Use It

Redux provides the `applyMiddleware` method. You can apply middleware as follows:

```js
import {
  createStore,
  applyMiddleware,
  compose,
} from 'redux'
import nextAndRequest from './middleware/redux-next-and-request'
import errorCatcher from './middleware/redux-error-catcher'
import reducer from '../reducer'

const createStoreWithMiddleware = compose(
  applyMiddleware(
    nextAndRequest,
    errorCatcher,
  ),
  DevTools.instrument(),
  window.devToolsExtension(),
)(createStore)
```

## How It Works

### The compose Function

Here we have a remarkable function — `compose`. It is also the core of `applyMiddleware`, as it implements the Redux middleware mechanism. Let's look at the source code of `compose`:

```js
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

As the comments explain, its purpose is to compose multiple functions from right to left into a single function. The rightmost function consumes the arguments of the new function, and the results are passed leftward as arguments to each successive function.

Executing `compose(f1, f2, f3)` yields `(...args) => f1(f2(f3(...args)))`. The core operation is `reduce` — for detailed usage, see the [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce).

```js
First reduce iteration
  previousValue: f1;
  currentValue: f2;
  returnValue: (...args1) => f1(f2(...args1)) // denoted as R1

Second reduce iteration
  previousValue: R1
  currentValue: f3;
  returnValue: (...args2) => R1(f3(...args2)) // denoted as R2

Expanding R2:
(...args2) => ((...args1) => f1(f2(...args1)))(f3(...args2))

Passing args to execute R2:
Step 1: yields ((...args1) => f1(f2(...args1)))(f3(args)) // denoted as R3
Step 2: f3(args) becomes the argument (...args1) of R3, yielding f1(f2(f3(args)))
```

Previously, `compose` was not implemented with `reduce` but with `reduceRight` as `composeRight`. Compared to the new implementation, the old version is easier to understand:
> [New version Merge Request](https://github.com/reactjs/redux/commit/44dfc39c3f8e5e8b51eeab7c44057da6c1086752)
> The new approach uses lazy evaluation for better performance

```js
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  funcs = funcs.filter(func => typeof func === 'function')

  if (funcs.length === 1) {
    return funcs[0]
  }

  const last = funcs[funcs.length - 1]
  const rest = funcs.slice(0, -1)
  return (...args) => rest.reduceRight((composed, f) => f(composed), last(...args))
}
```

Let's return to:

```js
const createStoreWithMiddleware = compose(
  applyMiddleware(
    nextAndRequest,
    errorCatcher,
  ),
  DevTools.instrument(),
  window.devToolsExtension(),
)(createStore)
```

The final value of `createStoreWithMiddleware` is:

```js
applyMiddleware(nextAndRequest,errorCatcher)(DevTools.instrument()(window.devToolsExtension()(createStore)))
```

### The applyMiddleware Function

Here is its source code:

```js
import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const store = createStore(reducer, preloadedState, enhancer)
    let dispatch = store.dispatch
    let chain = []

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
```

The structure of a Redux middleware:

```js
store => next => action => {
  // middleware logic
}
```

Suppose we have three middlewares M1, M2, M3. Calling `applyMiddleware(M1, M2, M3)` returns a closure that accepts `createStore` as its argument, allowing the store creation step to happen inside this closure.

The store is then reassembled into `middlewareAPI` as the new `store` — this is the `store` parameter in the outermost function of our middleware. This way, middleware can perform various operations based on the state tree.

Notice that the reassembled store only has two methods: `getState` for reading state, and `dispatch` for dispatching actions. Methods like `setState`, `subscribe`, and `replaceReducer` are not exposed. `setState` could trigger new actions during re-rendering, potentially causing infinite loops; `subscribe` is meant for subscribing to each dispatch operation, but you already have dispatch in your hands (`next`), so there's no need to subscribe; `replaceReducer` is for dynamically loading new reducers — you probably won't need it.

Each function in the middleware array is called with `middlewareAPI` as its argument, producing the `chain` array. At this point, each function in the `chain` array looks like this:

```js
next => action => {
  // middleware logic
}
```

***Core Code Explained***
>  dispatch = compose(...chain)(store.dispatch)

Assuming `chain` contains three functions C1, C2, C3, then `compose(...chain)(store.dispatch)` is `C1(C2(C3(store.dispatch)))`. From this we can deduce:

1. The `next` in the last middleware M3 passed to `applyMiddleware` is the original `store.dispatch`;
2. The `next` in M2 is `C3(store.dispatch)`;
3. The `next` in M1 is `C2(C3(store.dispatch))`;

Finally, `C1(C2(C3(store.dispatch)))` is assigned as the new `dispatch` on the store and returned to the user. This is the `dispatch` method users actually call. Since C3, C2, and C1 have all been executed in sequence, each middleware has been reduced to:

```js
action => {

}
```

#### Complete Flow When an Action Is Triggered

With this `dispatch` method and the unwrapped middleware, let's trace the complete flow when a user triggers an action:

1. Manually dispatch an action: `store.dispatch(action)`;
2. This calls `C1(C2(C3(store.dispatch)))(action)`;
3. C1's code executes until it hits `next(action)`, where `next` is M1's `next`, i.e., `C2(C3(store.dispatch))`;
4. `C2(C3(store.dispatch))(action)` executes until it hits `next(action)`, where `next` is M2's `next`, i.e., `C3(store.dispatch)`;
5. `C3(store.dispatch)(action)` executes until it hits `next(action)`, where `next` is M3's `next`, i.e., `store.dispatch`;
6. `store.dispatch(action)` executes — internally the root reducer updates the current state;
7. Code after `next(action)` in C3 executes;
8. Code after `next(action)` in C2 executes;
9. Code after `next(action)` in C1 executes;

That is: C1 -> C2 -> C3 -> store.dispatch -> C3 -> C2 -> C1

The onion model in action!

## How to Write Middleware

After all that theory, let's finally get to the main event — writing middleware. The goal is to implement middleware that handles async requests and error handling, so we don't need to manually make async requests or handle errors after every request.

Let's start with the simpler error handling middleware.

### Error Handling Middleware

This middleware checks whether the action has an `error` field to determine whether to throw an error:

```js
import { notification } from 'antd'

export default store => next => async action => {
  try {
    if(action.error) {
      throw new Error(action.error)
    } else {
      next(action)
    }
  } catch (err) {
    notification.error({
      message: '错误信息',
      description: err.message
    });
    throw err
  }
}
```

When an `error` field is found on the action, an error is thrown. This field can be set by upstream middleware when something goes wrong, attaching the error message to `action.error` for this middleware to handle. Since the project is based on antd, all errors are displayed using the `notification` component as a pop-up in the top-right corner.

To make this a generic error handler, you can wrap it in another function that accepts a custom error handler:

```js
export default handler => store => next => action => {
  try {
    if(action.error) {
      throw new Error(action.error)
    } else {
      next(action)
    }
  } catch (err) {
    handler && handler(err)
    throw err
  }
}
```

Then the usage becomes:

```js
const createStoreWithMiddleware = compose(
  applyMiddleware(
    nextAndRequest,
    errorHandler(err => {
      notification.error({
        message: '错误信息',
        description: err.message
      })
    }),
  ),
  window.devToolsExtension
)(createStore)
```

### Async Request Middleware

#### Version 1

This middleware checks whether the action has a `url` field to determine if an async request should be made, and attaches the response to the action's `result` field for the next middleware or reducer to use.

```js
import request from './request'

export default store => next => async action => {
  if (action.url) {
    try {
      const execAction = async act => {

        if(act.url) {
          const {
            code,
            data,
            error,
          } = await request({
            url: act.url,
            method: act.method || 'get',
            data: act.data || {},
          })

          if (code !== 0) {
            throw new Error(error || '未知错误！')
          } else {
            return data
          }
        }
      }

      const result = await execAction(action)

      next({
        result,
        ...action
      })

    } catch (error) {
      next({
        error: error.message,
      })
    }
  } else {
    next(action)
  }
}
```



#### Version 2

In this project, most scenarios require executing one async action followed by another to refresh the current list.
> For example, after deleting or adding a record, we want to refresh the current list.

So we add a `nextAction` field to the action, enabling execution of a follow-up action after the current one:

```js
import request from './request'

export default store => next => async action => {
  if (action.url || action.nextAction) {
    try {
      const execAction = async act => {

        if(act.url) {
          const {
            code,
            data,
            error,
          } = await request({
            url: act.url,
            method: act.method || 'get',
            data: act.data || {},
          })

          if (code !== 0) {
            throw new Error(error || '未知错误！')
          } else {
            return data
          }
        }
      }

      const result = await execAction(action)

      next({
        result,
        ...action
      })

      if (action.nextAction) {
        const act = action.nextAction
        const nextAction = typeof act === 'function' ? await act(result, action) : act
        const nextResult = await execAction(nextAction)

        next({
          result: nextResult,
          lastResult: result,
          ...nextAction
        })
      }

    } catch (error) {
      next({
        error: error.message,
      })
    }
  } else {
    next(action)
  }
}
```

For flexibility, `nextAction` can also be a function that must return an action. The return value of the current action is passed as a callback parameter to this function. After `nextAction` executes, in addition to attaching the response as `result`, a `lastResult` field is also added to preserve the first action's return value.



#### Version 3

Currently only one level of `nextAction` is supported. To support multiple levels, we can pass an array where each element can be either a plain action or a function that returns an action. Here's the complete code:

```js
// index.js

import execAction from './exec-action'
import execNextAction from './exec-next-action'
import isFunction from './is-function'
import isArray from './is-array'

export default () => next => async action => {
  if (action.url || action.nextAction) {
    try {
      const result = await execAction(action)

      next({
        result,
        ...action
      })

      if (action.nextAction) {
        let nextAction = action.nextAction
        let lastResult = result
        let lastAction = action

        if(isFunction(nextAction)) {
          nextAction = await nextAction(lastResult, lastAction)
          await execNextAction(nextAction, lastResult, next)
        } else if(isArray(nextAction)) {
          let currentAction
          for( let i = 0; i < nextAction.length; i++ ) {
            lastAction = nextAction[i - 1] ? nextAction[i - 1] : lastAction
            currentAction = isFunction(nextAction[i]) ? await nextAction[i](lastResult, lastAction) : nextAction[i]
            await execNextAction(currentAction, lastResult, next)
          }
        } else {
          await execNextAction(nextAction, lastResult, next)
        }
      }

    } catch (error) {
      next({
        error: error.message,
      })
    }
  } else {
    next(action)
  }
}
```

```js
// is-array.js

export default param => Array.isArray(param)
```

```js
// is-function.js

export default param => typeof param === 'function'
```

```js
// request.js

import reqwest from 'reqwest'

export default async opts => {
  const defaultOpts = {
    type: 'json',
    url: `/routers${opts.url}`,
  }

  const finalOpts = {
    ...opts,
    ...defaultOpts,
  }

  let ret
  try {
    ret = await reqwest(finalOpts)
    return ret
  } catch (e) {
    try {
      ret = JSON.parse(e.response)
    } catch (e) {
      ret = e.message
    }

    return ret
  }
}
```

```js
// exec-action.js

import request from './request'

export default async act => {

  if(act.url) {
    const {
      code,
      data,
      error,
    } = await request({
      url: act.url,
      method: act.method || 'get',
      data: act.data || {},
    })

    if (code !== 0) {
      throw new Error(error || '未知错误！')
    } else {
      return data
    }
  }
}
```

```js
// exec-next-action.js

import execAction from './exec-action'

export default async (nextAct, lastResult, next) => {
  const result = await execAction(nextAct)

  next({
    result,
    lastResult,
    ...nextAct
  })
}
```

And with that, we can happily build our pages!
Alright, time to send this to my mom for review.
