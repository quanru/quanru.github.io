---
title: Testing Node.js with Jest
toc: true
date: 2018-02-22 18:13:35
categories: Node.js Server
tags:
- JavaScript
- Node.js
- Unit Testing
---

Testing your Node.js applications with Jest

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2018/02/22/%E4%BD%BF%E7%94%A8%20Jest%20%E6%B5%8B%E8%AF%95%20Node.js/">简体中文</a>.
</div>
</article>


## Purpose

- Enhance code robustness
- Discover uncovered code logic in a timely manner
- Make project handoffs and refactoring more confident

## Tools

### 1. Installation

```
npm install --save-dev jest supertest
```



### 2. Configure `package.json`

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



### 3. Add gitignore

1. Add `coverage` directory to the .gitignore configuration file



### 4. Run

```bash
npm test # Run all tests
npm run test-watch # Enable watch mode, only run modified test files
```



### 5. Useful `jest` Command Parameters

- `npm test -- fileName` File name supports regex, e.g., `npm test -- server/*`; supports partial matching, e.g., `npm run test -- controllers/login`
- `npm test --bail [-- fileName]` Exit immediately when encountering a failed test case, making it easier to view error messages
- `npm test --watch [-- fileName]` Watch for test file modifications, only re-execute modified test cases
- `npm test --watchAll [-- fileName]` Watch for test modifications, re-execute all test cases



### 6. Directory Structure Convention

1. Test files: `__tests__`
2. Mock modules: `__mocks__`
3. Utilities: `__test__/fixtures`

```bash
__tests__
├── fixtures
├── __mocks__
│   └── request.js
└── server
    ├── controllers
    │   └── thread
    │       └── index.test.js
    └── server.test.js
```



## Testing Dimensions

1. Positive testing: Does the function implement the very basic functionality as declared?
2. Negative testing: Can the code handle unexpected values?



## Test Coverage

The proportion of source code that is tested, measured across four dimensions:

- Line coverage: Has every line been executed?
- Function coverage: Has every function been called?
- Branch coverage: Has every if block been executed?
- Statement coverage: Has every statement been executed?

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

> Appendix: [Unit Testing Guidelines](https://github.com/yangyubo/zh-unit-testing-guidelines/blob/master/readme.rst) - lengthy document, recommended for after-meal reading



## What to Test

- server - Does it start normally
- middlewares - Load correctly, work properly on requests
- controllers - Request specific routes, check if responses match expectations
- services - Call specific methods, verify return results match expectations, edge cases
- routes, lib - Standard testing



## Writing Test Cases

#### A Complete Unit Test File

  ```js
  describe('API mapping module', () => {
    // Runs before all tests, used to prepare environment for the current describe module, e.g., global database
    beforeAll(() => {

    })

    // Runs before each test, used to prepare operations for each case (it), e.g., reset server app
    beforeEach(() => {

    })

    // Runs after each test, used to clean up variables for each case (it), e.g., reset all module caches
    afterEach(() => {
      jest.resetModules()
    })

    // Runs after all tests, used to clean up environment, e.g., clean up "environment preparations" generated for tests
    afterAll(() => {

    })

    // Note: All four methods above support returning a Promise, in which case Jest will wait for the Promise to resolve before continuing

    it('When env is the default development environment, returns localhost address', async() => {
      process.env.NODE_ENV = ''

      const API = require('lib/api')

      expect(API).toThrow() // Expect API to throw
      expect(API('')).toMatch(/localhost/) // Expect return to contain 'localhost'
    })

    it.only('When env is test environment, returns test environment address', async() => { // Only execute this test case, commonly used for debugging
      process.env.NODE_ENV = 'test'

      const API = require('lib/api')

      expect(API('get_items')).toMatch(/test.baidu.info/)
    })
  })

  ```

  > Appendix: Common expect statements, see [official expect documentation](http://facebook.github.io/jest/docs/en/expect.html#content) for more

  ```js
  .toBe(value) // Expect value to be value
  .toEqual(value) // Expect two objects to be deeply equal
  .toBeDefined() // Expect to be defined
  .toBeFalsy() // Expect to be Falsy
  .toBeTruthy() // Expect to be Truthy
  .toMatch() // Expect to match, supports strings and regex
  .toThrow() // Expect to throw

  .toHaveBeenCalled() // Method was called
  .toHaveBeenCalledWith(arg1, arg2, ...) // Method was called with arguments arg1, arg2, ...
  .toHaveBeenCalledTimes(number) // Method was called number times

  // All expect statements above can be negated: not.toBe()
  ```



## Mock Examples

### Two Main Purposes of Mocking in Jest:

#### Shielding External Effects:

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
// Mock the debug module, so each require returns an auto-generated mock instance
jest.mock('debug')
...
it('Returns the sum of a and b', () => {
  const add = require('utils/number-add')
  const total = add(1, 2)

  expect(total).toBe(3)
})
...
```

#### Simulating External Calls:

```js
// string-add-async.js
const fetch = require('node-fetch')

module.exports = async (apiA, apiB) => {
  const stringA = await fetch(apiA)
  const stringB = await fetch(apiB)

  return stringA + stringB
}

// string-add-async.test.js
describe('Testing string-add-async module', () => {
  it('Returns concatenation of strings from API a and API b', async () => {
    // Mock node-fetch module
    jest.mock('node-fetch', () => {
      return jest
        .fn()
        .mockImplementationOnce(async () => 'Hello ') // First call returns 'Hello '
        .mockImplementationOnce(async () => 'world!') // Second call returns 'world!'
    })

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})
```


### How to Properly Mock a Module

> Using string-add-async module as an example

```js
// Method 1
describe('Testing string-add-async module', () => {
  it('Returns concatenation of strings from API a and API b', async () => {
    // Mock node-fetch module
    jest.mock('node-fetch', () => {
      return jest
        .fn()
        .mockImplementationOnce(async () => 'Hello ') // First call returns 'Hello '
        .mockImplementationOnce(async () => 'world!') // Second call returns 'world!'
    })

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})

// Method 2
describe('Testing string-add-async module 2', () => {
  it('Returns concatenation of strings from API a and API b', async () => {
    // Mock node-fetch module, so each require returns a mock instance
    jest.mock('node-fetch')

    const fetch = require('node-fetch')

    fetch
      .mockImplementationOnce(async () => 'Hello ') // First call returns 'Hello '
      .mockImplementationOnce(async () => 'world!') // Second call returns 'world!'

    const addAsync = require('utils/string-add-async')
    const string = await addAsync('apiA', 'apiB')

    expect(string).toBe('Hello world!')
  })
})

// Method 3
// __tests__/__mocks__/node-fetch.js
module.exports = async apiUrl => {
  return apiUrl
}

```

> Note: Method 3 is strongly discouraged as it has a broad impact scope, though it's suitable for "shielding external effects" scenarios



### Mock Instances

> When a module is mocked, it returns a mock instance with rich methods for further mocking; it also provides rich properties for assertions

1. `mockImplementation(fn)` where fn is the implementation of the mocked module
2. `mockImplementationOnce(fn)` Similar to 1, but only effective once. Can be chained so each mock returns differently
3. `mockReturnValue(value)` Directly define a mock module's return value
4. `mockReturnValueOnce(value)` Directly define a mock module's return value (one-time)
5. `mock.calls` Call property, e.g., a mock function fun called twice: `fun(arg1, arg2); fun(arg3, arg4);`, then mock.calls is `[['arg1', 'arg2'], ['arg3', 'arg4']]`

> Appendix: See [official documentation](http://facebook.github.io/jest/docs/en/mock-function-api.html#content) for more mock instance properties and methods



## Test Examples

#### Complete code not provided at this time



### Testing Utility Modules

#### See the "Mock Examples" section of this document



### Testing Server Startup

```js
const supertest = require('supertest')

describe('Server service', () => {
  let app, server

  beforeEach(async () => {
    app = await require('server')

    // Disable koa-logger log output
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

  it('Starts normally', async () => {
    expect(request).not.toThrow()
  })

  it('App throws exception handling', async () => {
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

### Testing Middleware

```js
const supertest = require('supertest')

describe('Error middleware', () => {
  let app, server

  beforeEach(async () => {
    app = await require('server')

    // Try uncommenting this line to see that without resetting module cache, test case 3 uses the server instance from case 2
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

  it('Throws exception - middleware error (custom error)', async () => {
    app.use(async (ctx, next) => {
      await Promise.reject(new Error('Middleware error'))
      await next()
    })

    await request()
      .get('/throw-error')
      .expect(200)
      .then(res => {
        expect(res.body.error).toBe('Middleware error')
      })
  })

  it('App throws exception - system error, please try again later (default error)', async () => {
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

### Testing APIs

// add-api.js
```js
const AddService = require('./add-service')

module.exports = async router => {
  router.get('/add', async ctx => {
    const { a, b } = ctx.query
    const numberA = Number(a)
    const numberB = Number(b)

    if (Number.isNaN(numberA) || Number.isNaN(numberB)) {
      throw new Error('Parameters must be numbers!')
    }

    const projectService = new AddService(ctx)
    const ret = await projectService.add(numberA, numberB)

    // Process data after successful request
    ctx.body = `API calculation result: ${ret}`
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

describe('Testing add API', () => {
  it(`When a=1 and b=2, returns 'API calculation result: 1 + 2 = 3'`, async () => {
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

  it(`When a=1 and b=xxx, API throws error`, async () => {
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

### Testing Service Layer

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
describe('Testing project service', function() {
  it('Testing service add method', async () => {
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

#### console.log sometimes doesn't work

> Try console.warn



#### Mock not taking effect

> Check if mock modules are interfering with each other across multiple test cases;
>
> Check if mock operations are placed after require;
>
> Check if you need to execute `jest.resetModules()` or `jest.resetAllMocks()` in `beforeEach`;
>
> Check if you need to separately execute the mock instance method `mockReset`;


## References

- [Jest - Getting Started](https://facebook.github.io/jest/docs/getting-started.html#content)
