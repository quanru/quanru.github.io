---
title: 使用 Jest 测试 Node.js
toc: true
date: 2018-02-22 18:13:35
categories: Node.js 服务端
tags:
- JavaScript
- Node.js
- 单元测试
---

使用 Jest 测试你的 Node.js 应用

<!-- more -->


## 目的

- 增强代码的健壮性
- 及时发现未被覆盖的代码逻辑
- 项目交接或重构更加放心

## 工具

### 1. 安装

```
npm install --save-dev jest supertest
```



### 2. 配置 `package.json`

```js
"scripts": {
    "test": "NODE_ENV=development jest",
    "test-watch": "npm test -- --watch",
},
"jest": {
    "verbose": true,
    "notify": true,
    "collectCoverage": true,
    "testEnvironment": "node",
    "modulePaths": [
      "<rootDir>/server"
    ],
    "roots": [
      "<rootDir>/__tests__"
    ],
    "testPathIgnorePatterns": [
      "__tests__/(fixtures|__mocks__)/"
    ],
    "coverageReporters": [
      "html",
      "text",
      "text-summary"
    ]
  }
```



### 3. 添加 gitignore

1. 在 .gitignore 配置文件中增加忽略 `coverage` 目录



### 4. 运行

```bash
npm test # 全部测试
npm run test-watch # 开启 watch 模式, 只运行修改的测试文件
```



### 5. `jest`  命令的实用参数

- `npm test -- fileName`  文件名支持正则，比如 `npm test -- server/*`；支持部分匹配，比如 `npm run test -- controllers/login`
- `npm test --bail [-- fileName]` 当遇到失败的用例时，立马退出，方便查看报错信息
- `npm test --watch [-- fileName]` 监听测试文件修改，仅重新执行所修改的测试用例
- `npm test --watchAll [-- fileName]` 监听测试修改，重新执行所有测试用例



### 6. 目录结构约定

1. 测试文件：`__tests__`
2. mock 模块：`__mocks__`
3. 辅助工具：`__test__/fixtures`

```bash
__tests__
├── fixtures
├── __mocks__
│   └── request.js
└── server
    ├── controllers
    │   └── thread
    │       └── index.test.js
    └── server.test.js
```



## 测试维度

1. 正向测试：这个函数是否按照其声明的那样实现了非常基本的功能？
2. 负向测试：代码是否可以处理非期待值？



## 测试覆盖率

源代码被测试的比例, 有四个测量维度

- 行覆盖率（line coverage）：是否每一行都执行了？
- 函数覆盖率（function coverage）：是否每个函数都调用了？
- 分支覆盖率（branch coverage）：是否每个if代码块都执行了？
- 语句覆盖率（statement coverage）：是否每个语句都执行了？

```bash
-----------|----------|----------|----------|----------|----------------|
File       |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------|----------|----------|----------|----------|----------------|
All files  |      100 |    85.71 |      100 |      100 |                |
 logger.js |      100 |    85.71 |      100 |      100 |                |
-----------|----------|----------|----------|----------|----------------|
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        0.836s, estimated 1s
Ran all test suites.
```

> 附：[单元测试准则](https://github.com/yangyubo/zh-unit-testing-guidelines/blob/master/readme.rst) 文档较长，建议饭后查看



## 测哪些东西

- server - 启动是否正常
- middlewares - 加载正常，请求时正常工作
- controllers - 请求特定路由，看响应是否是符合预期
- services - 调用特定方法，返回结果符合预期，边界情况
- routes、lib  - 普通测试



## 测试用例撰写

#### 一个普通且完备的单测文件

  ```js
  describe('api 映射模块', () => {
    // 在所有单测运行前执行，用于准备当前 describe 模块所需要的环境准备，比如全局的数据库；
    beforeAll(() => {

    })

    // 在每个单测运行前执行，用于准备每个用例（it）所需要的操作，比如重置 server app 操作
    beforeEach(() => {

    })

    // 在每个单测运行后执行，用于清理每个用例（it）的相关变量，比如重置所有模块的缓存
    afterEach(() => {
      jest.resetModules()
    })

    // 在所有单测运行后执行，用于清理环境，比如清理一些为了单测而生成的“环境准备”
    afterAll(() => {

    })

    // 注：以上四个方法均支持返回一个 Promise，此时 Jest 将等待该 Promise resolve 后继续

    it('当 env 为默认的 development 环境时，返回 localhost 地址', async() => {
      process.env.NODE_ENV = ''

      const API = require('lib/api')

      expect(API).toThrow() // 期望 API 抛错
      expect(API('')).toMatch(/localhost/) // 期望返回包含 'localhost' 字段
    })

    it.only('当 env 为测试环境时，返回测试环境地址', async() => { // 仅执行本测试用例，常用于调试当前用例
      process.env.NODE_ENV = 'test'

      const API = require('lib/api')

      expect(API('get_items')).toMatch(/test.baidu.info/)
    })
  })

  ```
  ​

  >  附：expect 常用语句，更多请查看[官方 expect 文档](http://facebook.github.io/jest/docs/en/expect.html#content)

  ```js
  .toBe(value) // 期望值为 value
  .toEqual(value) // 期望两个对象内容完全相等
  .toBeDefined() // 期望被定义
  .toBeFalsy() // 期望为 Falsy
  .toBeTruthy() // 期望 Truthy
  .toMatch() // 期望符合，支持字符串和正则对象
  .toThrow() // 期望抛错

  .toHaveBeenCalled() // 方法被调用
  .toHaveBeenCalledWith(arg1, arg2, ...) // 方法被以参数 arg1, arg2, ... 调用
  .toHaveBeenCalledTimes(number) // 方法被调用次数为 number 次

  // 以上 expect 语句均可取非，形式如下：not.toBe()
  ```



##  mock 示例

### jest 中 mock 主要有两种作用：

#### 屏蔽外部影响：

```js
// number-add.js
...
const debug = require('debug')

module.exports = (a, b) => {
  debug('value a: ', a)
  debug('value b: ', b)

  return a + b
}

...

// number-add.test.js
// mock debug 模块，使得每次 require 该模块时，返回自动生成的 mock 实例
jest.mock('debug')
...
it('返回 a 和 b 的和', () => {
  const add = require('utils/number-add')
  const total = add(1, 2)

  expect(total).toBe(3)
})
...
```

#### 模拟外部调用：

```js
// string-add-async.js
const fetch = require('node-fetch')

module.exports = async (apiA, apiB) => {
  const stringA = await fetch(apiA)
  const stringB = await fetch(apiB)

  return stringA + stringB
}

// string-add-async.test.js
describe('测试 string-add-async 模块', () => {
  it('返回接口 a 和 接口 b 所返回的字符串拼接', async () => {
    // mock node-fetch 模块
    jest.mock('node-fetch', () => {
      return jest
        .fn()
        .mockImplementationOnce(async () => 'Hello ') // 首次调用时返回 'Hello '
        .mockImplementationOnce(async () => 'world!') // 第二次调用时返回 ' world!'
    })

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})
```


### 如何正确的 mock 一个模块

> 此处以 string-add-async 模块为例

```js
// 方式一
describe('测试 string-add-async 模块', () => {
  it('返回接口 a 和 接口 b 所返回的字符串拼接', async () => {
    // mock node-fetch 模块
    jest.mock('node-fetch', () => {
      return jest
        .fn()
        .mockImplementationOnce(async () => 'Hello ') // 首次调用时返回 'Hello '
        .mockImplementationOnce(async () => 'world!') // 第二次调用时返回 ' world!'
    })

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})

// 方式二
describe('测试 string-add-async 模块 2', () => {
  it('返回接口 a 和 接口 b 所返回的字符串拼接', async () => {
    // mock node-fetch 模块，使得每次 require 该模块时，返回 mock 实例
    jest.mock('node-fetch')

    const fetch = require('node-fetch')

    fetch
      .mockImplementationOnce(async () => 'Hello ') // 首次调用时返回 'Hello '
      .mockImplementationOnce(async () => 'world!') // 第二次调用时返回 ' world!'

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})

// 方式三
// __tests__/__mocks__/node-fetch.js
module.exports = async apiUrl => {
  return apiUrl
}

```

> 注：强烈不建议使用方式三，因为该方式影响范围比较大，不过适合 `屏蔽外部影响` 的情况



### mock 实例

> 当一个模块被 mock 之后，便返回了一个 mock 实例，该实例上有丰富的方法可以用来进一步 mock；且还给出了丰富的属性用以断言

1. `mockImplementation(fn)` 其中 fn 就是所 mock 模块的实现
2. `mockImplementationOnce(fn)` 与 1 类似，但是仅生效一次，可链式调用，使得每次 mock 的返回都不一样
3. `mockReturnValue(value)` 直接定义一个 mock 模块的返回值
4. `mockReturnValueOnce(value)` 直接定义一个 mock 模块的返回值（一次性）
5. `mock.calls` 调用属性，比如一个 mock 函数 fun 被调用两次：`fun(arg1, arg2); fun(arg3, arg4);`，则  mock.calls 值为 `[['arg1', 'arg2'], ['arg3', 'arg4']]`

> 附：更多 mock 实例属性与方法详见[官方文档](http://facebook.github.io/jest/docs/en/mock-function-api.html#content)



## 测试示例

#### 完整代码暂不提供



### 工具模块的测试方法

#### 参看本文档 `mock 示例` 部分



### 服务启动的测试方法

```js
const supertest = require('supertest')

describe('server 服务', () => {
  let app, server

  beforeEach(async () => {
    app = await require('server')

    // 禁用 koa-logger 日志输出
    app.log.level('fatal')
  })

  afterEach(() => {
    if (server) {
      server.close()
    }

    app = null
    server = null
  })

  const request = () => {
    if (!server) {
      server = app.listen(0)
    }

    return supertest(server)
  }

  it('启动正常', async () => {
    expect(request).not.toThrow()
  })

  it('app 抛出异常处理', async () => {
    app.use(async ctx => {
      app.emit('error', new Error('app error'), ctx)
      ctx.body = 'ok'
    })

    await request()
      .get('/throw-error')
      .expect(200)
      .then(res => {
        expect(res.text).toBe('ok')
      })
  })
})

```

### 中间件测试的方法

```js
const supertest = require('supertest')

describe('错误中间件', () => {
  let app, server

  beforeEach(async () => {
    app = await require('server')

    // 可以试试取消注释这一句，可以发现由于没有重置模块缓存，导致测试用例 3 使用了用例 2 中的 server 实例
    jest.resetModules()
  })

  afterEach(() => {
    if (server) {
      server.close()
    }

    app = null
    server = null
  })

  const request = () => {
    if (!server) {
      server = app.listen(0)
    }

    return supertest(server)
  }

  it('抛出异常-中间件出错（自定义错误）', async () => {
    app.use(async (ctx, next) => {
      await Promise.reject(new Error('中间件出错'))
      await next()
    })

    await request()
      .get('/throw-error')
      .expect(200)
      .then(res => {
        expect(res.body.error).toBe('中间件出错')
      })
  })

  it('app 抛出异常-系统异常，请稍后再试（默认错误）', async () => {
    app.use(async (ctx, next) => {
      await Promise.reject(new Error(''))
      await next()
    })

    await request()
      .get('/throw-error')
      .expect(200)
      .then(res => {
        expect(res.body.error).toBe('系统异常，请稍后再试')
      })
  })
})

```

### 接口测试的方法

// add-api.js
```js
const AddService = require('./add-service')

module.exports = async router => {
  router.get('/add', async ctx => {
    const { a, b } = ctx.query
    const numberA = Number(a)
    const numberB = Number(b)

    if (Number.isNaN(numberA) || Number.isNaN(numberB)) {
      throw new Error('参数必须为数字！')
    }

    const projectService = new AddService(ctx)
    const ret = await projectService.add(numberA, numberB)

    // 处理请求成功后的数据
    ctx.body = `接口计算结果：${ret}`
  })
}

```

// add.test.js
```js
jest.mock('./add-service')
const Service = require('./add-service')
const addApi = require('add-api')
const Router = class {
  constructor (ctx) {
    return new Proxy({},
      {
        get (target, name) {
          return async (path, callback) => {
            callback(ctx)
          }
        }
      })
  }
}

describe('测试 add 接口', () => {
  it(`当 a=1 且 b=2，返回 '接口计算结果：1 + 2 = 3'`, async () => {
    const mockedAdd = jest.fn(async () => '1 + 2 = 3')
    const ctx = {
      query: {
        a: '1',
        b: '2'
      }
    }

    Service.mockImplementation(() => {
      return {
        add: mockedAdd
      }
    })

    const router = new Router(ctx)

    await addApi(router)
    expect(mockedAdd).toBeCalledWith(1, 2)
    // or expect(mockedAdd.mock.calls).toEqual([[1, 2]])
    expect(ctx.body).toBe('接口计算结果：1 + 2 = 3')
  })

  it(`当 a=1 且 b=xxx，接口报错`, async () => {
    const mockedAdd = jest.fn(async () => '1 + 2 = 3')
    const ctx = {
      query: {
        a: '1',
        b: 'xxx'
      }
    }

    Service.mockImplementation(() => {
      return {
        add: mockedAdd
      }
    })

    const router = new Router(ctx)

    try {
      await addApi(router)
    } catch (error) {
      expect(error).toBeEqual(new Error('参数必须为数字！'))
    }
    expect(mockedAdd).not.toBeCalled()
  })
})

```

### 服务层的测试方法

// project-service.js
```js
const add = require('utils/number-add')

module.exports = class {
  add (a, b) {
    const ret = add(a, b)

    return `${a} + ${b} = ${ret}`
  }
}

```

// project-service.test.js
```js
describe('测试 project service', function() {
  it('测试 service 的 add 方法', async () => {
    jest.mock('utils/number-add')

    const add = require('utils/number-add')
    const Service = require('project-service')
    const service = new Service()

    add.mockImplementation(() => 100)

    const ret = await service.add(1, 2)

    expect(ret).toBe('1 + 2 = 100')
  })
})

```

## FAQ

#### console.log 有时无效

> 试试 console.warn



#### mock 没起作用

> mock 模块是否在多个测试用例中相互影响了；
>
> mock 操作是否在 require 之后；
>
> 是否需要在 `beforeEach` 中执行 `jest.resetModules()` 或 `jest.resetAllMocks()`；
>
> 是否需要单独执行 mock 的实例方法`mockReset`；


## 参考

- [Jest - Getting Started](https://facebook.github.io/jest/docs/getting-started.html#content)
