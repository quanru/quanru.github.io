---
title: redux 中间件入门到编写，到改进，到出门
date: 2017-03-18 20:15:09
categories: 前端学习
tags:
- JavaScript
- Redux
- 源码解析
---

春江花月夜调 bug，孤独寂寞日著 blog。吾母昨夜托梦，吾儿只身在外，读书撩妹两手要抓，前端知识切莫荒废。如无对象可面向，可以学学函数式。多写代码少睡觉，还有周五的周报。redux 要会，middleware 能写，有空记得写博客，写好发给我看看。

惊醒之余，其敦敦教诲不敢忘，乃正襟危坐，挑灯写下这篇博客，感动~

<!-- more -->

## redux 中间件

redux 提供了类似 Web 开发的中间件机制，Web 中经过中间件的是一个个请求，而 redux 中经过中间件的是一个个 action，使得开发人员能够在中间件中针对特定 action 进行各种统一的处理，比如日志打印，数据请求，错误处理等。

## 如何使用

redux 提供 applyMiddleware 方法，通过如下方式即可应用中间件：

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

## 实现原理

### compose 函数

此处有个神奇的函数，即 compose，该函数在 applyMiddleware 中也是核心代码，正是它实现了 redux 中间件的机制，我们来看看 compose 的源码：

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

从注释中可知，它的作用是从右到左将多个函数组合成一个新函数，其中最右边的函数消耗了该新函数的参数，并逐级向左作为参数依次执行；

执行 compose(f1, f2, f3) 可得 (...args) => f1(f2(f3(...args)))；核心操作为 reduce，详细使用方式可参看[文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)

```js
第一次 reduce
  previousValue: f1;
  currentValue: f2;
  returnValue: (...args1) => f1(f2(...args1)) // 记为 R1

第二次 reduce
  previousValue: R1
  currentValue: f3;
  returnValue: (...args2) => R1(f3(...args2)) // 记为 R2

其中 R2:
(...args2) => ((...args1) => f1(f2(...args1)))(f3(...args2))

此时传入 args 执行 R2：
第一步： 得到 ((...args1) => f1(f2(...args1)))(f3(args)) // 记为 R3
第二步：f3(args) 即是 R3 的参数 (...args1)，继续执行可得 f1(f2(f3(args)))
```

其实之前这个 compose 方法不是使用 reduce 实现的，而是使用 reduceRight 实现 composeRight，因此对比新版实现，比较好理解，原来的版本为：
> [新版 Merge Request](https://github.com/reactjs/redux/commit/44dfc39c3f8e5e8b51eeab7c44057da6c1086752)
> 新版的方式使用惰性求值，性能有提升

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

让我们回到：

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

createStoreWithMiddleware 的最终值为：

```js
applyMiddleware(nextAndRequest,errorCatcher)(DevTools.instrument()(window.devToolsExtension()(createStore)))
```

### applyMiddleware 函数

其源码如下：

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

一个 redux 中间件的结构：

```js
store => next => action => {
  // 中间件逻辑代码
}
```

假设有三个中间件 M1, M2, M3，应用 applyMiddleware(M1, M2, M3) 将返回一个闭包函数，该函数接受 createStore 函数作为参数，使得创建状态树 store 的步骤在这个闭包函数内执行;
接着将 store 重新组装成 middlewareAPI 作为新的 store，也就是我们编写的中间件最外层函数的参数 store，这样中间件就可以根据状态树进行各种操作了。

可以发现重新组装之后的 store 只有两个方法，一个是用户获取 state 的 getState 方法，另一个是用于分发 action 的 dispatch，而 setState、subscribe、replaceReducer 等方法则不提供，setState 在设置状态时重新 render 可能会触发新的 action 而导致死循环；setState 本身就是用于订阅每个 dispatch 操作，此时 dispatch 就在你手上（next)，根本不需要订阅；replaceReducer 用于动态加载新的 reducer，我猜你用不到。

将中间件数组中的函数逐一传入参数 middlewareAPI 并执行，从而得到 chain 数组，此时 chain 数组中的每个函数长这样：

```js
next => action => {
  // 中间件逻辑代码
}
```

***核心代码解读***
>  dispatch = compose(...chain)(store.dispatch)

假设 chain 是包含 C1, C2, C3 三个函数的数组，那么 compose(...chain)(store.dispatch) 即是 C1(C2(C3(store.dispatch))), 因此易知：

1. applyMiddleware 的最后一个中间件 M3 中的 next 就是原始的 store.dispatch;
2. M2 中的 next 为 C3(store.dispatch);
3. M1 中的 next 为 C2(C3(store.dispatch));

最终将 C1(C2(C3(store.dispatch))) 作为新的 dispatch 挂在 store 上返回给用户，因此这就是用户切实调到的 dispatch 方法，既然层层执行了 C3，C2, C1，那么一个中间件已经被拆解为：

```js
action => {

}
```

#### 触发 action 的完整流程

有了这个 dispatch 方法和被扒光的中间件，我们来梳理一遍当用户触发一个 action 的完整流程：

1. 手动触发一个 action：store.dispatch(action)；
2. 即调用 C1(C2(C3(store.dispatch)))(action)；
3. 执行 C1 中的代码，直到遇到 next(action)，此时 next 为 M1 中的 next，即：C2(c3(store.dispatch))；
4. 执行 C2(c3(store.dispatch))(action)，直到遇到 next(action)，此时 next 为 M2 中的 next，即：C3(store.dispatch)；
5. 执行 C3(store.dispatch)(action)，直到遇到 next(action)，此时 next 为 M3 中的 next，即：store.dispatch；
6. 执行 store.dispatch(action)，store.dispatch 内部调用 root reducer 更新当前 state；
7. 执行 C3 中 next(action) 之后的代码
8. 执行 C2 中 next(action) 之后的代码
9. 执行 C1 中 next(action) 之后的代码

即：C1 -> C2 -> C3 -> store.dispatch -> C3 -> C2 -> C1

洋葱模型有没有!!!

## 如何编写

讲了这么多，终于切入正题，开始写中间件了，目标是实现中间件，使得异步请求，错误处理都能经由中间件处理；而不需要每次手动繁琐的发起异步请求，同时每个异步请求语句之后都手动处理错误代码。

先从简单的错误处理中间件开始~

### 错误处理中间件

通过检测 action 上是否存在 error 字段，来决定是否抛出错误

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

当发现 action 中有 error 字段，则抛出错误，这个字段可由上游中间件出错后，将对应的错误信息挂在 action.error 上，使得本中间件能够处理这个错误，由于项目基于 antd，此处将所有错误都通过 notification 组件在右上角弹窗显示；

如果做成通用的错误处理的话，可以再包一层函数，传入错误处理函数，便能够自定义错误处理函数了：

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

则使用方式变为：

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

### 异步请求处理中间件

#### 版本一

通过判断 action 字段上是否用 url 字段来判断是否需要发起异步请求，同时将请求结果挂在 action 的 result 字段上，供下一个中间件或 reducer 使用。

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



#### 版本二

由于本项目大部分情况需要在执行一个异步 action 之后，再重新执行一个异步 action，达到更新当前列表的目的。
> 例如删除或添加一条记录后，希望更新当前列表信息

因此做如下更改，在 action 上增加一个 nextAction 字段，使得能够在执行当前 action 之后，接着执行一个 action：

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

为了方便执行一些额外的操作，此处 nextAction 也可以是一个函数，该函数必须返回一个 action，同时将当前 action 的返回值作为回调传入这个函数，nextAction 执行之后，除了将请求结果作为 result 字段挂在 action 之外，还加入了一个 lastResult 字段保存首次 action 的值。



#### 版本三

目前只能支持一级 nextAction，如果要支持多级的话，可以传入数组，数组中可以是一个普通的 action，也可以是返回一个 action 的函数，完整代码如下：

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

如此这般，便能开心的写页面了~
好了，我要发给我妈看看。
