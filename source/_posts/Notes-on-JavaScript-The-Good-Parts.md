---
title: "Notes on JavaScript: The Good Parts"
toc: true
date: 2016-11-20 23:11:45
categories: Reading Notes
tags:
- JavaScript
---

I recently bought a few books, and this "JavaScript: The Good Parts" truly lives up to its name. It's short in length with extensive appendices. The author is Douglas Crockford, the inventor of JSON -- sounds impressive, and indeed the book is packed with insights. I benefited greatly from reading it!
<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/11/20/JavaScript%20%E8%AF%AD%E8%A8%80%E7%B2%BE%E7%B2%B9%E3%81%AE%E7%AC%94%E8%AE%B0/">简体中文</a>.
</div>
</article>

# JavaScript: The Good Parts

## Chapters 4 & 5

> Functions & Inheritance

1.   If a function is invoked with the `new` prefix, a new object is created behind the scenes, linked to the function's `prototype` member.

   > a. **The linking is done via `__proto__`, so the new object's `__proto__` property has all the properties and methods from `prototype`.**
   >
   > b. **Meanwhile, `this` is bound to this new object. If the return value is not an object, `this` is returned instead.**

```js
var that = Object.create(this.prototype);
var other = this.apply(that, arguments);
return (typeof outer === 'object' && other) || that;
```



2. The `new` operator creates a new object (inheriting from its operand's prototype), then invokes the operand, binding `this` to the newly created object. This allows the operand (i.e., the constructor function) to customize the newly created object before returning it to the caller.
3. Due to the dynamic nature of JavaScript's prototypal inheritance, new methods are immediately available to all instances of an object, even those created before the method was added to the corresponding class's `prototype` property.
4. For `function A() {}`, class A's constructor resides on A's prototype. Therefore, when inheriting using the following approach, the last step must reset the subclass's constructor to itself:

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

5. About Object.create

> The `**Object.create()**` method creates a new object with the specified prototype object and properties.

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



# Chapter 6

> Arrays



1. JavaScript arrays are objects with some array-like characteristics.

```js
var arr = [];
var obj = {};

typeof arr === typeof obj // true, both are 'object'

arr instanceof Array // true
arr instanceof Object // true

```

2. Setting a larger `length` for an array does not allocate more space, but setting `length` smaller will delete all properties with indices greater than or equal to the new `length`.
3. Since arrays are objects, you can use the `delete` operator to remove elements.

```js
var arr = ['one', 'two', 'three'];
delete arr[1]; // ['one', undefined, 'three']

// Use the splice method
arr.splice(1,1); // ['one', 'three']
```

4. Since arrays are objects, you can add properties to them. When the property name is not a number, it does not increase `length`.



# Chapter 7

> Regular Expressions

1. If you're unsure whether a special character needs escaping, you can always add an escape character `\`.

2. ```js
   \d [0-9] \D
   \s Unicode character \S
   \w [0-9A-Z_a-Z] \W
   . Any character except line terminators
   ```

3. Regular expression grouping: `()`, regular expression character class: `[]`

4. Quantifiers:

```js
// If there is only one quantifier (of the form {1,}), greedy matching is performed
let reg = /w{3,}/;
'wwwww'.match(reg); // 'wwwww'

// Use ? for non-greedy matching
let reg2 = /w{3,}?/;
'wwwww'.match(reg2); // 'www'

```



# Chapter 8

> Methods

1. `array.pop` and `array.shift` pop from different positions -- one from the tail, the other from the head.
2. `array.push` and `array.unshift` push to different positions -- one to the tail, the other to the head.
3. `array.slice(start, end)` performs a shallow copy; `array.splice(start, deleteCount, item...)` removes elements and replaces them with the provided items.
4. `regexp.exec(string)`, `regexp.test(string)`
5. `string.lastIndexOf(searchString, position)`, `string.charAt(position)`, `string.match(regexp)`, `string.search(regex)`

# Appendix

1. ```js
   1 + 0.2 // 0.30000000000000004
   0.1 + 0.2 == 0.3 // false

   ```

2. ```js
   typeof NaN === 'number' // true
   Nan === NaN // false
   NaN !== NaN // true

   isNaN(NaN) // true  ES6 moved it to Number.isNaN
   ```

3. Checking for arrays:

```js
arr && typeof arr === 'object' && arr.constructor === Array

```

Enhanced version:

```js
Object.prototype.toString.apply(arr) === '[object Array]'

```

4. Bitwise operators are very slow in JavaScript.
5. It is recommended to use `var foo = function foo() {};` instead of `function foo() {};`.
6. Avoid using type wrappers: `new Boolean(false)`, `new Number(1)`, `new String('abc')`.
7. Avoid using `new Object` and `new Array`.
8. In HTML, the literal `<` character must be written as `&lt;`.

# JSON

1. JSON has six value types: objects, arrays, strings, numbers, booleans, and null.
