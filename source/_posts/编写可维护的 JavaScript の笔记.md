title: 编写可维护的 JavaScriptの笔记
date: 2016-11-27 14:58:23
categories: 读书笔记
tags:
- JavaScript
- 可维护性
---

第一部分主要涉及编程风格，为了让团队的代码看起来如出一人之手；第二部分为编程实践，学到了很多关于 JavaScript 的编程经验；第三部分是关于自动化的，介绍的工具链，在 2016 年底看来已经相当过时。
<!-- more -->

# 编写可维护的 JavaScriptの笔记

# 第一部分

> 基本格式化



1. 建议在每个流程控制语句（比如 if 和 for 语句）之前添加空行
2. 变量命名应当以名词为前缀，而函数命名则以动词为前缀，常用动词约定：

|  动词  |   含义    |
| :--: | :-----: |
| can  |  返回布尔值  |
| has  |  返回布尔值  |
|  is  |  返回布尔值  |
| get  | 返回非布尔值  |
| set  | 用于保存一个值 |

3. 常量约定使用大写字母书写，单词之间使用下划线分隔

4. 使用 null 的场景（理解为对象的占位符）

   > a. 初始化一个变量，该变量可能赋值为一个对象
   >
   > b. 用来和一个已经初始化的变量（可以是也可以不是一个对象）比较
   >
   > c. 当函数的期望是对象时，用作参数传入
   >
   > d. 当函数的返回值期望是对象时，用作返回值传出

5. null == undefined // true

6. typeof null === object // true

7. 注释前留出空行，文件头部除外

8. 不符常理，有意为之的代码最好注释

9. 声明语句之后留出空行

10. 原始包装类型：String、Boolean、Number，原始值本身并不具有对象特性



# 第二部分

1. 使用单全局变量，将变量统一挂载到一个具体的全局变量上
2. 可在全局对象的第一层级创建对象以作为命名空间
3. 使用函数包装器创建零全局变量场景：

```js
(function(win) {
  let doc = window.document;
  // your code
}(window));
```

4. 隔离应用逻辑，例如将事件处理程序封装到一个全局对象中

```js
const MyApp = {
  handleClick: e => {
    this.showPopup(e);
  },

  showPopup: e => {
    // 事件逻辑代码
  }，
}；
```

5. 不要分发事件对象，仅分发需要的参数

```js
const MyApp = {
  handleClick: e => {
    this.showPopup(e.clientX, e.clientY);
  },

  showPopup: (x, y) => {
    // 事件逻辑代码
  }，
}；
```

6. 尽量让事件处理程序成为接触到 event 对象的唯一函数，经过4、5、6，使得代码更易于测试

```js
const MyApp = {
  handleClick: e => {
    e.preventDefault();
    e.stopPropagation();

    this.showPopup(e.clientX, e.clientY);
  },

  showPopup: (x, y) => {
    // 事件逻辑代码
  }，
}；
```

7. frame A 中的对象传入 frame B，则相当于每个 frame 都有一份拷贝，使得：

```js
// true
frameAObjInstance instanceof frameAObj
//false
frameAObjInstance instanceof frameBObj

// 同样适用于 Function 与 Array，因为每个 frame 中都个各自的构造函数
```

8. Array.isArray 判断数组
9. 判断某个对象是否存在某个属性值（避免属性假值，不建议 if(obj['count'])，使用 in 操作符，或者 hasOwnProperty() 方法
10. 抽离配置数据（硬编码值）
11. 抛出错误就像给自己留下为什么出错的便签
12. 包装器模式和适配器模式唯一的不同是前者创建新接口，后者实现已存在的接口
13. 避免使用特性推断和浏览器推断，酌情使用特性检测和用户代理检测
