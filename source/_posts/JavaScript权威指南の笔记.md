---
title: JavaScript 权威指南の笔记
toc: true
date: 2015-6-15 20:22:15
categories: 读书笔记
tags:
- JavaScript
---

1. 当Javascript解释器启动时，它将创建一个新的全局对象，并给它一组定义的初始属性。
2. 只要引用了字符串直接量的属性，就会将字符串值通过调用new String(). 方式转换成对象，一旦引用结束，则销毁这个临时对象。
3. “==”将运算符将原始值与其包装对象视为相等，而“===”不然。
4. 原始值不可变，对象引用可变。
5. undefined转换为数字：
>NaN，而null转换为数字：0，空字符串转为0与false。

<!-- more -->

# 对象

1. 当Javascript解释器启动时，它将创建一个新的全局对象，并给它一组定义的初始属性。
2. 只要引用了字符串直接量的属性，就会将字符串值通过调用new String(). 方式转换成对象，一旦引用结束，则销毁这个临时对象。
3. “==”将运算符将原始值与其包装对象视为相等，而“===”不然。
4. 原始值不可变，对象引用可变。

5. undefined转换为数字：
>NaN，而null转换为数字：0，空字符串转为0与false。

6. 对象到布尔值的转换：
>所有对象（包括数组和函数）都转为true。

7. 全局作用域可以不写var，但局部变量的声明需要var，否则默认生成全局变量。
8. Javascript并无块级作用域，取而代之的是函数作用域，指在函数内声明的所有变量在函数体内始终可见，意. 着变量在声明之前已经可用，但是赋值操作还在原始位置执行，即“声明提前”。

9.  
>1. var truevar = 1；//声明一个不可删除的全局变量
 >2. fakevar = 2; //创建全局对象的可删除的属性

10. x!=x来判断x是否为NaN。

11. in运算符：
>若右侧对象拥有一个名为左操作数值的属性名，则返回true。
12.typeof(null) -> "object";typeof(undefined) -> "undefined";常用语表达式中：
>(typeof value == "string") ? " ' " + value + " ' " : value;
13. 函数是对象的一种，但是typeof(func)的结果是“function”。
14. 删除属性或数组不仅仅是设置了一个undefined的值，其属性将不存在。
15. 不能删除通过var声明的变量，删除不存在的属性返回true，删除数组元素，不改变其长度。

16. void运算符：
>忽略操作数的计算结果并返回undefined。

17. for(variable in object) statement;先计算variable的值，并将属性名赋值给它。
18. break不能越过函数的边界，而continue只能在循环体内使用。

19. &&短路：
>当左操作数是真值时，该运算符将计算右操作数的值并将其返回作为整个表达式的计算结果。

20. hasOwnProperty()用来检测给定的名字是否是对象的自有属性。

21. 存取器属性：
>getter与setter，可继承，get property(){},set property(){}。

22. 数据属性：值，可写性，可枚举性，可配置性；
23. 存取器属性：get，set，可枚举性，可配置性。
24. 转换为不可扩展性后，不可转回，Object.preventExtensions()，给一个不可扩展的对象的原型添加属性，它照样会继承新属性。
23.

>1, Object.getOwnPropertyDescriptor()可获得某个对象特定属性的属性描述符：({x:1},"x")。

>2, Object.defineProperty(o,"x",{value:1,writable:true,enumerable:false,configurable:true});

>3, 以上两个函数都不包括继承属性。



# 数组

25. 数组是JS对象的特殊形式，数组索引实际上和碰巧是整数的属性名差不多。

26. 数组遍历：1. 排除null与defined、不存在的元素：
>if(!a[i]) continue;

2. 排除undefined和不存在的元素：
>if(a === undefined) continue;

3. 排除不存在仍处理undefined：
>if(!(i in a)) continue;或：for(var index in sparseArray){}。

27. 数组方法：

>1. join()：
>将所有元素转成字符串连接在一起，默认分隔符为逗号，可指定分隔符；
>2. reverse()：
>将元素颠倒顺序；
>3. sort()：
>字母表顺序排列，数值顺序：a.sort(function(a,b) { return a - b; } ); //若第一个参数应该在前，返回小于零的数值，反之亦然；
>4. concat()：
>创建并返回一个新数组，包括原始数组与concat()的每个参数；
>5. slice()：
>返回的数组包含第一个参数指定的位置到第二个参数指定的位置之间的所有数组元素，不包括第二个参数；若指定一个参数，则该参数为起始位置，结束位置在最后；负数：-1代表最后一个元素；
>6. splice()：
>不同于slice与concat，它会修改调用的数组；并返回被删元素组成的数组；
>7. push与pop；
>8. unshift与shift在数组头部操作；

>Javascript 5：

>1. forEach()：
>遍历数组，为每个元素调用指定的函数；
>2. map()：
>需要返回值，返回的是新数组，不修改调用的数组，而forEach()修改；
>3. filter()：
>压缩稀疏数组：var dense = sparse.filter(functin(){return true;});//filter会跳过稀疏数组中缺少的元素，返回的数组总是稠密的;
>4. 同时删除undefined和null元素：
>a = a.filter(function(x){return x !== undefined && x != null;});
>5. every()：
>当且仅当针对数组中的所有元素调用判定函数都返回true，它才返回true；
>6. some()：
>至少有一个为true，则返回true；
>7. reduce()：
>var sum = a.reduce(function(x,y) { return x + y }, 0);//其中第二个参数0是初始值；
>8. reduceRight()：
>从右到左处理；
>9. indexOf()：
>搜索整个数组中具有给定值的元素，返回找到的第一个元素的索引，没找到返回-1；
>10. lastIndexOf()：
>反向搜索，第二个参数指定开始查找的位置。
28. 判定是否为数组：
>Array.isArray()。

# 函数

29. 嵌套函数不会从调用它的函数中继承this，如果嵌套函数作为方法调用，其this的值指向调用它的对象，作为函数调用，其this值不是全局对象（非严格模式下）就是undefined（严格模式下）。

30. new o.m()调用上下文（this）并不是o，而是构造函数调用创建的一个新的空对象。
31. &&：
>若左操作数为假，返回左操作数值，不计算右操作数；若左操作数为真，计算右操作数并返回右操作数的值；

32.  ||：
>若左操作数为真，返回左操作数值，不计算右操作数；若左操作数为假，计算右操作数并返回右操作数的值；

32. arguments：
>指向实参对象的引用，包含一个length属性，却不是真正的数组。

33. arguments的属性：
>callee：指代当前正在执行的函数。

34. 函数可以有自己的属性，因为它是一种特殊的对象。

35. 函数可以作为命名空间：
>( function(){ //codes } () );//结束函数定义并立即调用它。

36. 闭包：
>JS函数执行用到了作用域链，此链是函数定义的时候创建的，不管在何时何地执行内部嵌套函数f()
，f中的变量一定是局部变量。

37. 每次调用JS函数的时候，都会为之创建一个新的对象用来保存局部变量，把这个对象添加至作用域链中，当函数返回时，就从作用域链中将这个绑定变量的对象删除。

38. 嵌套函数里是无法访问this的，除非在外部函数将其转换为一个变量：
>var self = this;

39. 函数属性：
>length：形参个数；

40. prototype属性：
>当函数用作构造函数时，新创建的对象会从原型对象上继承属性。

41. 以对象o的方法来调用函数f：
>f.call(o)或者f.apply(o);

42. bind()方法：
>var g = f.bind(o);//通过调用g(x)来调用o.f(x)。

43. Function()构造函数所创建的函数并不使用词法作用域，函数体代码的编译总是会在顶层函数（全局作用域）执行。
44. 不完全函数与记忆函数。

# 类和模块

45. 调用构造函数：
>构造函数的prototype属性被用作新对象的原型，从而继承了prototype的属性。

46. 工厂函数方法与构造函数方法。
47. 原型对象是类的唯一标识，当且仅当两个对象继承自同一个原型对象时，它们才属于同一个类的实例。
48. 对于任意函数F.prototype.constructor==F;一个对象的constructor属性指代这个类。

49. 构造函数与原型对象之间的关系：![](https://quanru-github-io.pages.dev/post-img/权威指南1.png)

50.
>1. 任何添加到构造函数对象（不是指添加到构造函数内部）的属性都是类字段和类方法，属于类而不属于类的某个实例；
>2. 原型对象的属性被类的所有实例所继承，若原型对象的属性值是函数的话，这个函数就作为类的实例方法来调用，实例方法由所有实例所共享；
>3. 直接给类的每个实例定义非函数属性，实际上就是实例的字段。

51. 即使创建对象之后，原型的属性发生改变，也会影响到继承这个原型的所有实例对象。

52.
>1. 检测对象的类：instanceof，isPrototypeOf()，这里的继承可以不是直接继承；
>2. constructor属性；
>3. 以上两个方法不适用于多窗口和多框架子页面，因此可以使用构造函数的名称；

53. 工厂方法：
![](https://quanru-github-io.pages.dev/post-img/权威指南2.png)
![](https://quanru-github-io.pages.dev/post-img/权威指南3.png)    

54. 构造函数方法：
![](https://quanru-github-io.pages.dev/post-img/权威指南4.png)

54. toJSON()用于序列号对象，如果一个对象有toJSON()方法，则JSON.stringify()并不会对传入的对象做序列号操作，而会调用toJSON()来执行序列号操作，JSON.parse()是其逆过程。

55. forEach：![](https://quanru-github-io.pages.dev/post-img/权威指南5.png)

56. 私有方法：
>通过将变量（或参数）闭包在一个构造函数内来模拟实现私有实例字段：
![](https://quanru-github-io.pages.dev/post-img/权威指南6.png)

57. 创建子类的关键：
>1. B.prototype = inherit(A.prototype);//子类派生自父类
>2. B.prototype.constructor = B;//重载继承来的constructor属性

58. 用组合代替继承的集合的实现：
![](https://quanru-github-io.pages.dev/post-img/权威指南7.png)
![](https://quanru-github-io.pages.dev/post-img/权威指南8.png)

59.
>1. Object.preventExtensions():将对象设置为不可扩展的，即不能给对象添加任何新属性；
>2. Object.seal与Object.freeze:将对象的所有属性设置为只读和不可配置的。

60. Object.create(null);//创建一个不包含原型的对象，使之能够直接对它使用in运算符

61. 作为私有命名空间的函数：
![](https://quanru-github-io.pages.dev/post-img/权威指南9.png)
![](https://quanru-github-io.pages.dev/post-img/权威指南10.png)

1. 创建屏外图像：
>new Image(80,20).src = "images/***.gif";

2. this：
>1,指向函数执行时的当前对象；
>2,没有明确的当前对象时，指向全局对象window。
>3,在事件处理程序的代码中，关键字this引用触发该事件的文档元素。

3. 表单元素的属性：
>type，form（对包含该元素的form对象的只读引用），name，value；
使用this.form引用Form对象，this.form.x引用名为x的兄弟表单元素。

5. cookie的性质：
>expires，path，domain，secure。

6. 函数直接量与Function()构造函数创建函数的方法：适用于只用一次，无需命名。
7. 属性callee：
>用来引用当前正在执行的函数。

8. f.call(o,1,2);等价于：
>o.m = f; o.m(1,2); delete o.m;

9. 删除一个属性：
>delete book.chapter2。

10. 在方法主体的内部，this的值就变成了调用该方法的对象。
11. JS对象都“继承”原型对象的属性。
12. 属性的继承只发生于读属性值时，而在写属性值时不发生。
13. 实例属性有自己的副本，而实例方法是一个类共享的。

14. 若要生成类Complex的一个子类，只需确保新类的原型对象是Complex的一个实例；这样它就能继承Complex.prototype的所有属性：
>1. MoreComplex.prototype = new Complex(0,0)；
>2. MoreComplex.prototype.constructor = MoreComplex;

15. Object.property 等价于 Object["property"] ->关联数组。
16. 只有那些真正存储在数组中的元素才能够分配内存。

17. 正则表达式直接量：
>var pattern = /S$/;即：var pattern = new RegExp("S$");

18. 在复制和传递时使用的是引用，但在比较它们时使用的却是值。
19. 通过设置class.prototype属性来定义所有类实例共享的方法和常量。

20.
>1. Function()构造函数   函数直接量
>2. 允许运行时动态地创建和编译JS代码 静态
>3. 每次调用都会解析函数体并创建一个新的函数对象 相反
>4. 不使用词法作用域作为顶级函数                                  

21.
>1. null == undefined ->true;
>2. null === undefined -> false;

# web浏览器中的JS
23. 如果两个窗口包含的脚本把Document的domain属性设置成相同的值，则这两个窗口就不再受同源策略的约束，能够相互读取对方的属性。
22.

>1, 当HTML解析器遇到script标签元素时，它默认必须先执行脚本，然后再恢复文档的解析和渲染；

>2, script标签的defer属性：
使得浏览器延迟脚本的执行，直到文档的载入和解析完成；按顺序执行。

>3, async属性：
使得浏览器尽快的执行脚本，而不用在下载脚本时阻塞文档的解析；有可能无序执行。



# window对象

24. Window对象的location属性引用的是Location对象：
>window.location === document.location //true

25. Location对象的toString方法返回的是它的href属性的值。
26. A窗口中调用B窗口中的函数，此函数在定义它的作用域中执行，而不是在调用它的作用域中执行。
27. 对于内置的类，每个窗口都有构造函数的一个独立副本和构造函数对应原型对象的一个独立副本。

# 脚本化文档

28. 为某些HTML元素设置name或id属性值，将自动为window与document对象创建对应的属性，其属性值指向表示该文档元素的HTMLElement对象。

29. 通过CSS选择器选取元素：
>querySelectorAll()，querySelector()；接受一个包含CSS选择器的字符串参数。

30. Document、Element、Text对象都是Node对象，其属性：
>parentNode，childNodes，firstChild，lastChild，nextSibling，previoursSibling，nodeType，nodeValue，nodeName，textContent。

31. Element属性：
>attributes，innerHTML;

33. DocumentFragment是一种特殊的Node，作为其他节点的一个临时容器。

34. 滚动条位置：
>window.pageXOffset/pageYOffset;
35. 查询视口尺寸：
>windows.innerWidth/innerHeight;

35.  HTML5中，input标签的placeholder属性指定了用户输入前在输入域显示的提示消息。

36. Document类型定义了创建Element和Text对象的方法：
>document.createTextNode("text node content");

37. Node类型定义了在节点树中插入、删除和替换的方法：

>1. parent.appendChild(child);//插入parent元素的最后；
>2. parent.insertBefore(child,parent.childNodes[n];
>3. n.parentNode.removeChild(n);
>4. n.parentNode.replaceChild(document.createTextNode("[ REDACTED ]"), n);


# 脚本化CSS

1. 内联样式：
>e.style.position="relative";

2. 计算样式：
>window.getComputedStyle(element,null);

# 事件处理

37. 通过HTML属性来注册事件处理程序是一个例外，它们被转换为能存取全局变量的顶级函数而非任何本地变量。

38. 在一个对象上触发某类事件（比如单击onclick事件），如果此对象定义了此事件的处理程序，那么此事件就会调用这个处理程序，如果没有定义此事件处理程序或者事件返回true，那么这个事件会向这个对象的父级对象传播，从里到外，直至它被处理（父级对象所有同类事件都将被激活），或者它到达了对象层次的最顶层，即document对象（有些浏览器是window）。

# jQuery


40. each()只能遍历jQuery对象，而jQuery.each()可以遍历数组元素或对象属性。
39.

>1. focus与blur事件不支持冒泡，而focusin与focusout支持；
>2. mouseover与mouseout支持冒泡，mouseenter与mouseleave不支持；
