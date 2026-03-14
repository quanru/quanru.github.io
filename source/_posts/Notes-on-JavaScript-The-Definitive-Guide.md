---
title: "Notes on JavaScript: The Definitive Guide"
toc: true
date: 2015-6-15 20:22:15
categories: Reading Notes
tags:
- JavaScript
---

1. When the JavaScript interpreter starts, it creates a new global object and gives it a set of defined initial properties.
2. Whenever a property of a string literal is referenced, the string value is converted to an object by calling new String(), and once the reference ends, this temporary object is destroyed.
3. The "==" operator treats primitive values and their wrapper objects as equal, while "===" does not.
4. Primitive values are immutable; object references are mutable.
5. undefined converted to number:
>NaN, while null converted to number: 0, empty string converts to 0 and false.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2015/06/15/JavaScript%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97%E3%81%AE%E7%AC%94%E8%AE%B0/">简体中文</a>.
</div>
</article>

# Objects

1. When the JavaScript interpreter starts, it creates a new global object and gives it a set of defined initial properties.
2. Whenever a property of a string literal is referenced, the string value is converted to an object by calling new String(), and once the reference ends, this temporary object is destroyed.
3. The "==" operator treats primitive values and their wrapper objects as equal, while "===" does not.
4. Primitive values are immutable; object references are mutable.

5. undefined converted to number:
>NaN, while null converted to number: 0, empty string converts to 0 and false.

6. Object to boolean conversion:
>All objects (including arrays and functions) convert to true.

7. Global scope doesn't require var, but local variable declarations need var, otherwise a global variable is created by default.
8. JavaScript has no block-level scope, replaced by function scope, meaning all variables declared within a function are always visible throughout the function body. Variables are available before they are declared, but assignment operations are still executed at their original position, i.e., "hoisting."

9.
>1. var truevar = 1; // Declares a non-deletable global variable
>2. fakevar = 2; // Creates a deletable property of the global object

10. Use x!=x to determine whether x is NaN.

11. The in operator:
>Returns true if the right-side object has a property with the name of the left operand value.
12. typeof(null) -> "object"; typeof(undefined) -> "undefined"; commonly used in expressions:
>(typeof value == "string") ? " ' " + value + " ' " : value;
13. Functions are a type of object, but typeof(func) returns "function."
14. Deleting a property or array element doesn't just set an undefined value; the property will no longer exist.
15. Variables declared with var cannot be deleted, deleting a non-existent property returns true, deleting array elements doesn't change its length.

16. The void operator:
>Ignores the result of the operand and returns undefined.

17. for(variable in object) statement; first evaluates the variable value and assigns the property name to it.
18. break cannot cross function boundaries, while continue can only be used within loop bodies.

19. && short-circuit:
>When the left operand is truthy, the operator evaluates the right operand and returns it as the result of the entire expression.

20. hasOwnProperty() is used to check whether a given name is an own property of the object.

21. Accessor properties:
>getter and setter, inheritable, get property(){}, set property(){}.

22. Data property: value, writability, enumerability, configurability;
23. Accessor property: get, set, enumerability, configurability.
24. Once converted to non-extensible, it cannot be converted back. Object.preventExtensions(); adding properties to the prototype of a non-extensible object will still allow it to inherit new properties.
23.

>1. Object.getOwnPropertyDescriptor() can get the property descriptor of a specific property of an object: ({x:1},"x").

>2. Object.defineProperty(o,"x",{value:1,writable:true,enumerable:false,configurable:true});

>3. Both functions above do not include inherited properties.



# Arrays

25. Arrays are a special form of JavaScript objects. Array indices are essentially property names that happen to be integers.

26. Array traversal: 1. Exclude null, undefined, and non-existent elements:
>if(!a[i]) continue;

2. Exclude undefined and non-existent elements:
>if(a === undefined) continue;

3. Exclude non-existent but still process undefined:
>if(!(i in a)) continue; or: for(var index in sparseArray){}.

27. Array methods:

>1. join():
>Converts all elements to strings and concatenates them. Default separator is comma; custom separator can be specified;
>2. reverse():
>Reverses the order of elements;
>3. sort():
>Sorts in alphabetical order. Numeric sort: a.sort(function(a,b) { return a - b; }); // If the first argument should come first, return a negative number, and vice versa;
>4. concat():
>Creates and returns a new array containing the original array and each argument of concat();
>5. slice():
>Returns an array containing elements from the first argument position to the second argument position, excluding the second. If one argument, it's the start position with end at the last element. Negative numbers: -1 represents the last element;
>6. splice():
>Unlike slice and concat, it modifies the calling array and returns an array of deleted elements;
>7. push and pop;
>8. unshift and shift operate at the array head;

>JavaScript 5:

>1. forEach():
>Iterates the array, calling the specified function for each element;
>2. map():
>Requires return value, returns a new array without modifying the calling array, while forEach() modifies;
>3. filter():
>Compress sparse arrays: var dense = sparse.filter(function(){return true;}); // filter skips missing elements in sparse arrays, returned array is always dense;
>4. Remove both undefined and null elements:
>a = a.filter(function(x){return x !== undefined && x != null;});
>5. every():
>Returns true only when the predicate function returns true for all elements;
>6. some():
>Returns true if at least one returns true;
>7. reduce():
>var sum = a.reduce(function(x,y) { return x + y }, 0); // The second argument 0 is the initial value;
>8. reduceRight():
>Processes from right to left;
>9. indexOf():
>Searches the entire array for an element with the given value, returns the index of the first found element, returns -1 if not found;
>10. lastIndexOf():
>Reverse search, second argument specifies the starting position.
28. Determine if it's an array:
>Array.isArray().

# Functions

29. Nested functions do not inherit this from the function that calls them. If a nested function is called as a method, its this points to the object that called it. If called as a function, this is either the global object (non-strict mode) or undefined (strict mode).

30. When calling new o.m(), the context (this) is not o, but a new empty object created by the constructor invocation.
31. &&:
>If the left operand is falsy, returns the left operand value without evaluating the right; if the left is truthy, evaluates and returns the right operand value;

32. ||:
>If the left operand is truthy, returns the left operand value without evaluating the right; if the left is falsy, evaluates and returns the right operand value;

32. arguments:
>A reference to the arguments object, which has a length property but is not a true array.

33. arguments property:
>callee: refers to the currently executing function.

34. Functions can have their own properties because they are a special type of object.

35. Functions as namespaces:
>( function(){ //codes } () ); // End the function definition and immediately invoke it.

36. Closures:
>JavaScript functions use the scope chain for execution, which is created when the function is defined. No matter when and where the inner nested function f() is executed, variables in f are always local variables.

37. Each time a JavaScript function is called, a new object is created to hold local variables. This object is added to the scope chain. When the function returns, this variable-binding object is removed from the scope chain.

38. Nested functions cannot access this unless it's converted to a variable in the outer function:
>var self = this;

39. Function property:
>length: number of formal parameters;

40. prototype property:
>When a function is used as a constructor, newly created objects inherit properties from the prototype object.

41. Call function f as a method of object o:
>f.call(o) or f.apply(o);

42. bind() method:
>var g = f.bind(o); // Call o.f(x) by calling g(x).

43. Functions created by the Function() constructor do not use lexical scope; function body code is always compiled and executed at the top-level function (global scope).
44. Partial functions and memoized functions.

# Classes and Modules

45. Calling a constructor:
>The constructor's prototype property is used as the prototype for the new object, inheriting properties from prototype.

46. Factory function approach vs. constructor approach.
47. The prototype object is the only identifier of a class. Two objects belong to instances of the same class if and only if they inherit from the same prototype object.
48. For any function F.prototype.constructor==F; an object's constructor property refers to this class.

49. The relationship between constructor and prototype object: ![](/post-img/权威指南1.png)

50.
>1. Any property added to the constructor object (not inside the constructor) is a class field or class method, belonging to the class rather than any specific instance;
>2. Properties of the prototype object are inherited by all instances of the class. If a prototype property value is a function, it serves as an instance method shared by all instances;
>3. Defining non-function properties directly on each instance of the class is essentially instance fields.

51. Even after object creation, changes to the prototype's properties will affect all instance objects that inherit from this prototype.

52.
>1. Checking an object's class: instanceof, isPrototypeOf(). The inheritance doesn't have to be direct;
>2. constructor property;
>3. The above two methods don't work in multi-window and multi-frame sub-pages, so constructor names can be used instead;

53. Factory method:
![](/post-img/权威指南2.png)
![](/post-img/权威指南3.png)

54. Constructor method:
![](/post-img/权威指南4.png)

54. toJSON() is used for serialization. If an object has a toJSON() method, JSON.stringify() won't serialize the passed object directly but will call toJSON() instead. JSON.parse() is the reverse process.

55. forEach: ![](/post-img/权威指南5.png)

56. Private methods:
>Simulating private instance fields by closuring variables (or parameters) within a constructor:
![](/post-img/权威指南6.png)

57. Key to creating subclasses:
>1. B.prototype = inherit(A.prototype); // Subclass derives from parent
>2. B.prototype.constructor = B; // Override inherited constructor property

58. Set implementation using composition instead of inheritance:
![](/post-img/权威指南7.png)
![](/post-img/权威指南8.png)

59.
>1. Object.preventExtensions(): Makes the object non-extensible, no new properties can be added;
>2. Object.seal and Object.freeze: Makes all properties read-only and non-configurable.

60. Object.create(null); // Creates an object without a prototype, enabling direct use of the in operator

61. Functions as private namespaces:
![](/post-img/权威指南9.png)
![](/post-img/权威指南10.png)

1. Creating off-screen images:
>new Image(80,20).src = "images/***.gif";

2. this:
>1. Points to the current object of function execution;
>2. When there's no explicit current object, points to the global object window.
>3. In event handler code, the keyword this refers to the document element that triggered the event.

3. Form element properties:
>type, form (read-only reference to the containing Form object), name, value;
Use this.form to reference the Form object, this.form.x to reference a sibling form element named x.

5. Cookie properties:
>expires, path, domain, secure.

6. Function literals and the Function() constructor for creating functions: suitable for one-time use, no naming needed.
7. The callee property:
>Used to reference the currently executing function.

8. f.call(o,1,2); is equivalent to:
>o.m = f; o.m(1,2); delete o.m;

9. Deleting a property:
>delete book.chapter2.

10. Inside a method body, the value of this becomes the object on which the method was called.
11. JavaScript objects "inherit" properties from their prototype objects.
12. Property inheritance only occurs when reading property values, not when writing them.
13. Instance properties have their own copies, while instance methods are shared by the class.

14. To create a subclass of class Complex, simply ensure the new class's prototype object is an instance of Complex, so it inherits all properties of Complex.prototype:
>1. MoreComplex.prototype = new Complex(0,0);
>2. MoreComplex.prototype.constructor = MoreComplex;

15. Object.property is equivalent to Object["property"] -> associative array.
16. Only elements actually stored in the array have memory allocated.

17. Regular expression literal:
>var pattern = /S$/; i.e., var pattern = new RegExp("S$");

18. Copying and passing use references, but comparison uses values.
19. Define methods and constants shared by all class instances by setting the class.prototype property.

20.
>1. Function() constructor vs. Function literal
>2. Allows dynamic creation and compilation of JS code at runtime vs. Static
>3. Each call parses the function body and creates a new function object vs. Opposite
>4. Does not use lexical scope, acts as top-level function

21.
>1. null == undefined -> true;
>2. null === undefined -> false;

# JavaScript in Web Browsers
23. If scripts in two windows set the Document's domain property to the same value, the two windows are no longer subject to the same-origin policy and can read each other's properties.
22.

>1. When the HTML parser encounters a script tag element, it must by default execute the script first, then resume document parsing and rendering;

>2. The defer attribute of the script tag:
Makes the browser delay script execution until the document is fully loaded and parsed; executed in order.

>3. The async attribute:
Makes the browser execute the script as soon as possible without blocking document parsing during script download; may execute out of order.



# The Window Object

24. The Window object's location property references the Location object:
>window.location === document.location //true

25. The Location object's toString method returns the value of its href property.
26. When calling a function in window B from window A, the function executes in the scope where it was defined, not where it was called.
27. For built-in classes, each window has its own copy of the constructor and a separate copy of the corresponding prototype object.

# Scripting Documents

28. Setting the name or id attribute for certain HTML elements automatically creates corresponding properties on the window and document objects, whose values point to the HTMLElement objects representing those elements.

29. Selecting elements via CSS selectors:
>querySelectorAll(), querySelector(); accepts a string argument containing CSS selectors.

30. Document, Element, and Text objects are all Node objects. Properties:
>parentNode, childNodes, firstChild, lastChild, nextSibling, previousSibling, nodeType, nodeValue, nodeName, textContent.

31. Element properties:
>attributes, innerHTML;

33. DocumentFragment is a special Node that serves as a temporary container for other nodes.

34. Scroll position:
>window.pageXOffset/pageYOffset;
35. Querying viewport dimensions:
>window.innerWidth/innerHeight;

35. In HTML5, the input tag's placeholder attribute specifies the hint message displayed before user input.

36. The Document type defines methods for creating Element and Text objects:
>document.createTextNode("text node content");

37. The Node type defines methods for inserting, deleting, and replacing in the node tree:

>1. parent.appendChild(child); // Insert at the end of parent element;
>2. parent.insertBefore(child, parent.childNodes[n]);
>3. n.parentNode.removeChild(n);
>4. n.parentNode.replaceChild(document.createTextNode("[ REDACTED ]"), n);


# Scripting CSS

1. Inline styles:
>e.style.position="relative";

2. Computed styles:
>window.getComputedStyle(element, null);

# Event Handling

37. Registering event handlers via HTML attributes is an exception; they are converted to top-level functions that can access global variables rather than any local variables.

38. When a certain type of event is triggered on an object (e.g., onclick click event), if the object has defined a handler for this event, the handler is called. If no handler is defined or the event returns true, the event propagates to the parent object, from inside out, until it is handled (all same-type events of parent objects are activated) or reaches the topmost level of the object hierarchy, i.e., the document object (some browsers use window).

# jQuery


40. each() can only iterate jQuery objects, while jQuery.each() can iterate array elements or object properties.
39.

>1. focus and blur events don't support bubbling, while focusin and focusout do;
>2. mouseover and mouseout support bubbling, mouseenter and mouseleave don't;
