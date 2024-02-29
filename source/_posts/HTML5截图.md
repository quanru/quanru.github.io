---
title: "HTML5 截图"
toc: true
date: 2015-07-19 10:41:29
categories: 面试
tags:
- Canvas
- CSS
---

实现一个类似于QQ截图的小东西，点击载入按钮，则载入图片，长按图片，弹出截图框，截图框右下角能够调整大小，并在右边的截图预览区域实时显示

<!-- more -->

# 需求
实现一个类似于QQ截图的小东西，点击载入按钮，则载入图片，长按图片，弹出截图框，截图框右下角能够调整大小，并在右边的截图预览区域实时显示，其最终效果图如下：
![示意图](https://quanru-github-io.pages.dev/post-img/screenShot.png)

# HTML
需要注意canvas的设置，主要结构如下：
```HTML
        <section class="clearfix">
            <div id="origin">
                <canvas id="originImg" width="500" height="500"></canvas>
                <div id="shotRect">
                    <div class="resizeBR"></div>
                </div>
            </div>
            <canvas id="showPre" width="500" height="500"></canvas>
        </section>
```
# CSS
截图框初始大小为50px*50px,右下角设置了一个不可见的调节区域,此处大小设置为12px*12px，并在之后为其注册调整大小的事件。
```CSS
	#shotRect {
	    position: absolute;
	    display: none;
	    width: 50px;
	    height: 50px;
	    opacity: .5;
	    border: 2px solid #2d2d2d;
	}

	.resizeBR {
	    position: absolute;
	    right: -5px;
	    bottom: -5px;
	    width: 12px;
	    height: 12px;
	    cursor: nw-resize;
	    opacity: 0;
	    background: #000;
	    background: #ff0;
	}
```
其中原始图片的canvas大小与预览区的大小一致。

# JavaScript
## 载入图片，并绘制canvas
```javascript
	function loadImg(event) { //载入图片
	    cOri = document.getElementById("originImg");
	    imgOri = new Image();
	    ctxOri = cOri.getContext("2d");
	    imgOri.src = "vegetable.jpg";
	    imgOri.onload=function(){
	        ctxOri.drawImage(imgOri,0,0,500,500);//将图片绘制到canvas上
	    };
	}
```

## 长按待截图区域,弹出截图框
```javaScript
	function longClick(event) { //长按弹出截图框
	    event = event || window.event;
	    var shotRect = document.getElementById("shotRect");
	    timeout = setTimeout(function() {
	        shotRect.style.display = "block";
	        var disX = event.clientX - shotRect.offsetWidth + 10,
	            disY = event.clientY - shotRect.offsetHeight + 10;
	        shotRect.style.left = disX + 'px';
	        shotRect.style.top = disY + 'px';
	        initCanvas();
	        updateRect(disX, disY, shotRect.offsetWidth, shotRect.offsetHeight);
	    }, 1000);
	}
```
释放鼠标时,需要清除timeout。
### 初始化预览canvas
```javaScript
	function initCanvas() {//初始化预览画布
	    cPre = document.getElementById("showPre");
	    ctxPre = cPre.getContext("2d");
	    img = document.getElementById("originImg");
	}
```
### 更新预览canvas
根据原始图片,在预览区域上使用drawImage方法画出预览图,其中x,y为截图框左上角相对于原始图片左上角的坐标;而w,h为截图框的长与宽;这四个参数提取出了截图框内的图像数据,而之后(0,0)这个坐标代表在画布上放置该图像数据的坐标位置,(0,0)意味着将该图像数据的左上角与预览区域的左上角重合。
```javaScript
	function updateRect(x, y, w, h) {//更新画布
	    ctxPre.clearRect(0, 0, 500, 500); //清空画布
	    ctxPre.drawImage(img, x, y, w, h, 0, 0, 500, 500);
	}
```
### 调整截图框大小
计算截图框左上角的坐标，并根据调整大小后鼠标的坐标，并据此重新设置截图框的大小，然后调用更新截图预览的函数updateRect，注意限制截图框的边界不能超过原始图片的大小。
```javaScript
	function resizeDown(event) {
	    event = event || window.event;
	    var shotRect = document.getElementById("shotRect"),
	        //计算Rect左上角的坐标
	        x = shotRect.offsetLeft,
	        y = shotRect.offsetTop ;
	        //console.log("x=" +  x+ " " + "y=" +  y);
	    //绑定事件
	    document.addEventListener("mousemove", mouseMove);
	    document.addEventListener("mouseup", mouseUp);
	    //移动鼠标
	    function mouseMove(event) {
	        event = event || window.event;
	        var finalX = event.clientX,
	                finalY = event.clientY;
	        //防止超过边界
	        if (event.clientX >= 488) {
	            finalX = 488;
	        }
	        if (event.clientY >= 488) {
	            finalY = 488;
	        }
	        //console.log( (event.clientX) + " " + (event.clientY));
	        xy = (finalX - x + 10) < (finalY - y +10) ? (finalX -x + 10) : (finalY - y + 10);
	        //计算移动后的Rect新大小
	        shotRect.style.width = xy + 'px';
	        shotRect.style.height = xy + 'px';
	        updateRect(x, x, shotRect.offsetWidth, shotRect.offsetHeight);
	    }
	    //停止事件
	    function mouseUp() {
	        //卸载事件
	        document.removeEventListener("mousemove", mouseMove);
	        document.removeEventListener("mouseup", mouseUp);
	    }
	}
```
### 移动截图框
详看注释吧~
```javascript
	function dragDown(event) {
	    event = event || window.event;
	    if (event.target !== event.currentTarget) return; //如果是从子元素冒上来的，返回
	    var shotRect = document.getElementById("shotRect"),
	        disX = event.clientX - shotRect.offsetLeft, // 光标按下时光标相对截图框的坐标
	        disY = event.clientY - shotRect.offsetTop;
	    //绑定事件
	    document.addEventListener("mousemove", mouseMove);
	    document.addEventListener("mouseup", mouseUp);

	    function mouseMove(event) {
	        event = event || window.event;
	        var disL = event.clientX - disX, //截图框左边界与左侧边界的距离
	            disT = event.clientY - disY, //截图框上边界与上侧边界的距离
	            maxW = document.getElementById("originImg").clientWidth - shotRect.offsetWidth, //最大宽度
	            maxH = document.getElementById("originImg").clientHeight - shotRect.offsetHeight; //最大高度
	        //超过边界则重置
	        if (disL < 0) {
	            disL = 0;
	        } else if (disL > maxW) {
	            disL = maxW + 1;
	        }
	        if (disT < 0) {
	            disT = 0;
	        } else if (disT > maxH) {
	            disT = maxH + 1;
	        }
	        shotRect.style.left = disL + 'px'; //重新计算截图框的相对位置
	        shotRect.style.top = disT + 'px';
	        updateRect(disL, disT, shotRect.offsetWidth, shotRect.offsetHeight);
	    }

	    function mouseUp(event) {
	        document.removeEventListener("mousemove", mouseMove);
	        document.removeEventListener("mouseup", mouseUp);
	    }
	}
```
## 保存图片
由于跨域问题,保存在chrome无效,在firefox中有效:
```javascript
	function saveImg(event) {
	    var image = cPre.toDataURL("image/png");
	    var w = window.open('about:blank', 'image from canvas');
	    w.document.write("<img src='" + image + "' alt='from canvas'/>");
	}
```

[完整代码](https://github.com/quanru/screenShot)
