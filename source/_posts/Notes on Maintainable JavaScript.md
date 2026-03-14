---
title: Notes on Maintainable JavaScript
toc: true
date: 2016-11-27 14:58:23
categories: Reading Notes
tags:
- JavaScript
- Maintainability
---

Part one covers coding style to make team code look as if written by a single person. Part two covers programming practices, with many valuable JavaScript programming lessons. Part three is about automation, but the toolchain it introduces feels quite outdated by the end of 2016.
<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/11/27/%E7%BC%96%E5%86%99%E5%8F%AF%E7%BB%B4%E6%8A%A4%E7%9A%84%20JavaScript%20%E3%81%AE%E7%AC%94%E8%AE%B0/">简体中文</a>.
</div>
</article>

# Notes on Maintainable JavaScript

# Part One

> Basic Formatting



1. It is recommended to add a blank line before each flow control statement (such as `if` and `for` statements).
2. Variable names should be prefixed with nouns, while function names should be prefixed with verbs. Common verb conventions:

| Verb | Meaning |
| :--: | :-----: |
| can  | Returns a boolean |
| has  | Returns a boolean |
|  is  | Returns a boolean |
| get  | Returns a non-boolean value |
| set  | Used to save a value |

3. Constants should be written in uppercase letters with words separated by underscores.

4. Scenarios for using `null` (think of it as an object placeholder):

   > a. Initializing a variable that may later be assigned an object
   >
   > b. Comparing with an already initialized variable (which may or may not be an object)
   >
   > c. Passing as an argument when a function expects an object
   >
   > d. Returning as a value when a function's return value is expected to be an object

5. null == undefined // true

6. typeof null === object // true

7. Leave a blank line before comments, except at the beginning of a file.

8. Code that is counterintuitive or intentionally unconventional should be commented.

9. Leave a blank line after declarations.

10. Primitive wrapper types: String, Boolean, Number — primitive values themselves do not have object characteristics.



# Part Two

1. Use a single global variable; mount all variables under one specific global variable.
2. Create objects on the first level of the global object to serve as namespaces.
3. Use function wrappers to create a zero-global-variable scenario:

```js
(function(win) {
  let doc = window.document;
  // your code
}(window));
```

4. Separate application logic — for example, encapsulate event handlers in a global object:

```js
const MyApp = {
  handleClick: e => {
    this.showPopup(e);
  },

  showPopup: e => {
    // event logic code
  }，
}；
```

5. Do not distribute the event object; only pass the required parameters:

```js
const MyApp = {
  handleClick: e => {
    this.showPopup(e.clientX, e.clientY);
  },

  showPopup: (x, y) => {
    // event logic code
  }，
}；
```

6. Make event handlers the only functions that touch the `event` object. Following points 4, 5, and 6 makes code easier to test:

```js
const MyApp = {
  handleClick: e => {
    e.preventDefault();
    e.stopPropagation();

    this.showPopup(e.clientX, e.clientY);
  },

  showPopup: (x, y) => {
    // event logic code
  }，
}；
```

7. When an object from frame A is passed into frame B, each frame effectively has its own copy, resulting in:

```js
// true
frameAObjInstance instanceof frameAObj
//false
frameAObjInstance instanceof frameBObj

// The same applies to Function and Array, since each frame has its own constructors
```

8. Use `Array.isArray` to check for arrays.
9. To check whether an object has a property (avoid falsy property values — using `if(obj['count'])` is not recommended), use the `in` operator or the `hasOwnProperty()` method.
10. Extract configuration data (hardcoded values).
11. Throwing errors is like leaving yourself a sticky note explaining what went wrong.
12. The only difference between the wrapper pattern and the adapter pattern is that the former creates a new interface while the latter implements an existing one.
13. Avoid using feature inference and browser inference; use feature detection and user agent detection judiciously.
