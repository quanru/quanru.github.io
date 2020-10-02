---
title: Javascript 语言精粹の笔记
date: 2016-11-20 23:11:45
categories: 读书笔记
tags:
- JavaScript
---

最近买了几本书，这本《JavaScript 语言精粹》果真精粹，篇幅很少，而附录较多，作者是 JSON 的发明者 Douglas Crockford ，听起来屌屌的，其中的干货也是不少的，看完受益匪浅！
<!-- more -->
# JavaScript 语言精粹

## 章四,五

> 函数、继承

1.   如果在一个函数前面带上 new 来调用，则背地里会创建一个链接到该函数的 prototype 成员的新对象

   > a. **通过 __proto__ 进行链接，使得新对象上的 __proto__ 属性拥有 prototype 上的所有属性与方法**
   >
   > b. **同时 this 将会被绑定到这个新对象上，此时若返回值不是一个对象，则返回 this**

```js
var that = Object.create(this.prototype);
var other = this.apply(that, arguments);
return (typeof outer === 'object' && other) || that;
```



2. new 运算符创建一个新对象（继承自其运算数原型），然后调用该运算数，把新创建的对象绑定到 this 上；使得运算符（即构造器函数）在返回给调用者前能够自定义新创建的对象。
3. 因为 JavaScript 原型继承的动态本质，使得新的方法立刻被赋予到所有对象的实例上，哪怕在将方法增加到对应类的 prototype 属性之前就已经创建的对象实例。
4. function A() {}, 类 A 的构造函数位于 A 的原型 prototype 之上，因此使用如下方式继承时，最后一步需要重置子类的构造器为自身：

```js
// Shape - superclass
function Shape() {
  this.x = 0;
  this.y = 0;
}

// superclass method
Shape.prototype.move = function(x, y) {
  this.x += x;
  this.y += y;
  console.info('Shape moved.');
};

// Rectangle - subclass
function Rectangle() {
  Shape.call(this); // call super constructor.
}

// subclass extends superclass
Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;
```

5. 关于 Object.create

> The `**Object.create()**` method creates a new object with the specified prototype object and properties.
>
> 该方法根据指定的原型对象和属性生成一个新对象

```js
var o;

// create an object with null as prototype
o = Object.create(null);

o = {};
// is equivalent to:
o = Object.create(Object.prototype);

// o -> Object:{__proto__: Object}

function Constructor() {}
o = new Constructor();
// is equivalent to:
o = Object.create(Constructor.prototype);
// Of course, if there is actual initialization code in the
// Constructor function, the Object.create() cannot reflect it

// o -> Constructor:{__proto__: Object}

```



# 章六

> 数组



1. JavaScript 的数组是一种拥有一些类数组特性的对象

```js
var arr = [];
var obj = {};

typeof arr === typeof obj // true，皆为 'object'

arr instanceof Array // true
arr instanceof Object // true

```

2. 为数组设置更大的 length 不会分配更多空间，而把 length 设小，则将所下标大于等于新 length 的属性删除
3. 由于数组就是对象，因此可使用 delete 运算符移除元素

```js
var arr = ['one', 'two', 'three'];
delete arr[1]; // ['one', undefined, 'three']

// 使用 splice 方法
arr.splice(1,1); // ['one', 'three']
```

4. 数组是个对象，因此可以给其增添属性，当属性不为数字时，并不会增加 length



# 章七

> 正则

1. 如果拿不准一个特殊字符是否需要转义，可统一加上转义符  '\'

2. ```js
   \d [0-9] \D
   \s Unicode 字符 \S
   \w [0-9A-Z_a-Z] \W
   . 除结束符以外的任意字符
   ```

3. 正则表达式分组：()，正则表达式字符集：[]

4. 量词：

```js
//如果只有一个量词(形如 {1,} ) 则表示进行贪婪性匹配
let reg = /w{3,}/;
'wwwww'.match(reg); // 'wwwww'

// 通过 ？ 进行非贪婪性匹配
let reg2 = /w{3,}?/;
'wwwww'.match(reg2); // 'www'

```



# 章八

> 方法

1. array.pop 与 array.shift pop 的位置不同，一个在头部，一个在尾部
2. array.push 与 array.unshift push 的位置不同，一个在尾部，一个在头部
3. array.slice(start, end) 潜复制，array.splice(start, deleteCount, item...) 移除若干个元素，并使用 item 替换
4. regexp.exec(string)、regexp.test(string)
5. string.lastIndexOf(searchString, position)、string.charAt(position)、string.match(regexp)、string.search(regex)

# 附录

1. ```js
   1 + 0.2 // 0.30000000000000004
   0.1 + 0.2 == 0.3 // false

   ```

2. ```js
   typeof NaN === 'number' // true
   Nan === NaN // false
   NaN !== NaN // true

   isNaN(NaN) // true  ES6 将其归到 Number.isNaN
   ```

3. 判断数组：

```js
arr && typeof arr === 'object' && arr.constructor === Array

```

加强版:

```js
Object.prototype.toString.apply(arr) === '[object Array]'

```

4. 位运算符在 JavaScript 中执行效率非常慢
5. 建议使用 var foo = function foo() {}; 而不是 function foo() {};
6. 避免使用类型包装器：new Boolean(false)、new Number(1)、new String('abc')
7. 避免使用 new Object 与 new Array
8. HTML 中，字面上的 '<' 符号必须使用 '&lt ;'

# JSON

1. JSON 有六种类型值： 对象、数组、字符串、数字、布尔值、null
