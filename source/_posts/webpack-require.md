---
title: __webpack_require__, module.exports, __webpack_exports__
date: 2017-01-21 21:38:43
categories: 前端工程化
tags: Webpack JavaScript
---

研究了下 webpack 打包后的代码，发现 webpack1 与 webpack2 的处理方式还不大一样，webpack2 已经默认支持 es6 module 规范

<!-- more -->

### [webpack](https://webpack.github.io/)
webpack 是目前最流行 JavaScript 模块打包工具，相信各位前端开发对于标题的 __webpack_require__ 一定有印象吧，当调试使用 webpack 打包的 JavaScript 程序时，感觉密密麻麻的都是注释，每个模块顶部都有如下注释：

```js
    /* 1 */
  /*!**************************!*\
    !*** ./hello.js ***!
    \**************************/
  /***/ function(module, exports, __webpack_require__) {
    // .....
  /***/ },
```

当其他模块引用 hello.js 这个模块时，便可使用如下方式：

```js
  __webpack_require__(/*! ./hello */ 1);
```

那么，这是怎么做到的呢？还有 module.exports, __webpack_exports__ 又是什么鬼？且往下看。

### JavaScript 的模块化方案
> 此处就不扯模块化方案的历史了，反正我只使用过 CommonJS 和 ESModule

1. CommonJS
  使用 module.exports 变量，保存当前模块希望提供给其它模块的变量
  使用 require 函数，使得当前模块能够导入其它模块的 module.exports 变量

  其中 module 与 require 在 node 中皆是全局变量；
  通过构造一个闭包，将 module 与 require 作为参数传入模块文件中，因此就会出现类似如下的代码：

```js
    /* 1 */
  /*!**************************!*\
    !*** ./hello.js ***!
    \**************************/
  /***/ function(module, exports, __webpack_require__) {
    // .....
  /***/ },
```

2. ESModule
  使用 export 关键字，导出当前模块希望提供给其它模块的变量
  使用 import 关键字，导入当前模块能够导入其它模块导出的变量

二者目前的区别主要是 CommonJS 能够动态加载，而 ESModule 则为静态加载，不过 ESModule 预计即将支持使用 [import() 动态加载](https://github.com/tc39/proposal-dynamic-import)，目前已经进入 stage 3 状态，此处 import() 就与 require() 一样，是一个函数，而不是关键字。

### Webpack1 打包生成的代码分析

### Webpack2 打包生成的代码分析