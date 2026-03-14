---
title: "Excerpts from Functional Programming in JavaScript"
toc: true
date: 2015-07-19 10:41:29
categories: Reading Notes
tags:
- JavaScript
- Functional Programming
---

### Chapter 1
1. Identify abstractions and build functions for them;
2. Use existing functions to build more complex abstractions;
3. Build even more complex abstractions by passing existing functions to other functions.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2015/07/19/Javascript%20%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BC%96%E7%A8%8B%E3%81%AE%E4%B9%A6%E6%91%98/">简体中文</a>.
</div>
</article>

# Chapter 1

1. Identify abstractions and build functions for them;
2. Use existing functions to build more complex abstractions;
3. Build even more complex abstractions by passing existing functions to other functions.

# Chapter 2

1. Functions as first-class citizens:
>Functional programming languages should facilitate the creation and use of functions;

2. Applicative programming:
>Function A is provided as an argument to function B;

3. JavaScript object keys can only be strings;

# Chapter 3

Lexical scope:
>Refers to a variable's visibility and the simulated value of its textual representation; variable lookup expands outward from the innermost scope.

Dynamic scope:
>1. Maintains a global table of "values" (a global mapping of named binding stacks);
>2. Uses a function to look up the bound value;
>3. Drawback: for any given binding value, it is unknowable until the function calling it is determined.

Closure:
>A closure is a function that captures external bindings in its scope (i.e., not its own arguments). These bindings are defined for later use (even after the scope has ended).
>If a variable reference exists both inside and outside a closure, its changes can cross seemingly private boundaries. Therefore, JavaScript often uses the following pattern, treating captured variables as private data:
```javascript
          var pingpong = (function() {
               var private = 0;
               return {
                   inc: function(n) {
                              return private += n;
                    }
                    dec: function(n) {
                              return private -= n;
                    }
               };
           })();
           pingpong.inc(10);
           pingpong.dec(7);
```

# Chapter 4

Higher-order functions:
>1. They are first-class citizens;
>2. Take a function as an argument;
>3. Return a function as a result;

Closure:
>1. Closures capture a value (or reference) and return the same value multiple times;
>2. Each new closure captures a different value;

# Chapter 5

Curried functions:
>Gradually return functions that consume arguments until all arguments are exhausted;

Partial application:
>A partially executed function that waits to receive the remaining arguments for immediate execution;

Function composition:
>_.compose: executes from right to left, the result of the rightmost function is fed to the function on its left, one after another.

# Chapter 6

Tail recursion:
>The last action of a function (besides the stopping condition return value) is a recursive call;

Recursion and function composition:
>andify and orify;

Mutually related functions:
>Two or more functions calling each other is called mutual recursion. They bounce back and forth through mutual recursive calls, decrementing an absolute value until one side or the other reaches zero;

Trampoline principle:
>By wrapping calls rather than calling directly; the trampoline function: continuously calls the return value of the function until it is no longer a function.

# Chapter 7

Pure functions:
>1. Their result can only be computed from their argument values;
>2. They cannot depend on data that can be changed by external operations;
>3. They cannot change external state.

Idempotency:
>Running a function once with the same arguments should produce the same result as running it twice consecutively.

Immutability:
>For example, strings;

Object immutability:
>1. Immutable objects should fix their values at construction and not be modifiable afterward;
>2. Immutable object operations return new objects.

# Chapter 8

Lazy chains:
>Before calling value, _.chain is lazy—nothing happens;

Thunk:
>A function that wraps some behavior;

Pipeline;
