---
title: 16-Grid Drag and Drop
toc: true
date: 2015-06-16 21:07:03
categories: Interview
tags: JavaScript
---

Implement a 16-grid page as shown below, where each numbered box can be dragged and swapped with another. The horizontal and vertical header bars ABC and XYZ allow pairwise swapping of positions, causing entire columns (or rows) to swap together.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2015/06/16/16%E5%AE%AB%E6%A0%BC%E6%8B%96%E6%8B%BD/">简体中文</a>.
</div>
</article>

Implement a 16-grid page as shown below, where each numbered box can be dragged and swapped with another. The horizontal and vertical header bars ABC and XYZ allow pairwise swapping of positions, causing entire columns (or rows) to swap together.

![Illustration](/post-img/16宫格拖拽.png)

# Styling

- Set the outer container and inner block widths, and float them left to form the 16-grid layout;
- Each box's position is represented by coordinates (x, y), where 0 < x, y < 4;

---

```css
	#container {
	  position: relative;
	  width: 400px;
	  height: 400px;
	  background: #eee;
	}
	.box {
	  float: left;
	  width: 70px;
	  height: 70px;
	  margin: 5px;
	  font-weight: bold;
	  line-height: 70px;
	  text-align: center;
	  border: 10px solid red;
	  border-radius: 10px;
	}
```

- Since dragging uses absolute positioning, first obtain each box's current offset, then set the box's position property to absolute, and use the corresponding offset values for top and left.

---

```javascript
	function absoluteThem(e) {
	  $($(".box").toArray().reverse()).each(function(index, el) {
	    $(this).css({
	      "left": $(this).position().left,
	      "top": $(this).position().top,
	      "float": "none",
	      "position": "absolute"
	    });
	  });
	}
```

# Drag Handling
**Note the boundary check for boxes, and that header bar letters can only move horizontally or vertically. Save the coordinates of the dragged box.**

---

```javascript
	function clickNum(e) {// Click on a number
	  var targetEle = e.target,
	        targetEleJQ = $(targetEle),
	    oriX = e.clientX - targetEle.offsetLeft, // Cursor position relative to the element when pressed
	    oriY = e.clientY - targetEle.offsetTop;
	  if (targetEleJQ.hasClass("undraggable")) {
	    return;
	  }
	  $(document).bind("mousemove", moveIt);
	  $(document).bind("mouseup", mouseUp);

	  function moveIt(e2) {// Move
	    var newX = e2.clientX - oriX,
	      newY = e2.clientY - oriY,
	      maxX = 400 - targetEle.offsetWidth - 10,
	      maxY = 400 - targetEle.offsetHeight - 10;
	      if (newX < 100) {
	        newX = 100;
	      } else if (newX > maxX) {
	        newX = maxX;
	      }
	      if (newY < 100) {
	        newY = 100;
	      } else if (newY > maxY) {
	        newY = maxY;
	      }
	      if(targetEleJQ.hasClass("num")){// If it's a number
	        targetEle.style.left = newX + "px";
	        targetEle.style.top = newY + "px";
	      }
	      else if(targetEleJQ.hasClass("group1")){// If it's the ABC bar
	        targetEle.style.left = newX + "px";
	      }
	      else if(targetEleJQ.hasClass("group2")){// If it's the XYZ bar
	        targetEle.style.top = newY + "px";
	      }
	  }
```

# Dropping the Box
Coordinates of the box at the mouse release position: divide the current mouse position clientX and clientY by 100, then floor the result to get the coordinates.

---

```javascript
	  function mouseUp(e3) {
	    var boxLocX = Math.floor(e3.clientY/100),// Grid coordinates when the cursor is released
	          boxLocY = Math.floor(e3.clientX/100),
	          oriBoxLocX = parseInt(targetEle.id.substr(4,1)),// Original grid coordinates
	          oriBoxLocY = parseInt(targetEle.id.substr(6,1)),
	          boxNow = "box-" + boxLocX + "-" + boxLocY,// Box id at the drop location
	          boxOri = "box-" + oriBoxLocX + "-" + oriBoxLocY;

	    if(targetEleJQ.hasClass("group1")) {
	      if(!$("#" + boxNow).hasClass("letter") || $("#" + boxNow).hasClass("group2")){// Clicked a letter but released on a non-letter
	        resetLoc(boxOri);
	        return;
	      }
	      changeLoc(boxNow, boxOri);
	      for(var i = 1; i < 4; i++){
	        boxLocX ++;
	        oriBoxLocX ++;
	        boxNow = "box-" + boxLocX + "-" + boxLocY;// Box id at the drop location
	        boxOri = "box-" + oriBoxLocX + "-" + oriBoxLocY;
	        changeLoc(boxNow, boxOri);
	      }
	    }
	    else if (targetEleJQ.hasClass("group2")) {
	      if(!$("#" + boxNow).hasClass("letter")  || $("#" + boxNow).hasClass("group1")){// Clicked a letter but released on a non-letter
	        resetLoc(boxOri);
	        return;
	      }
	      changeLoc(boxNow, boxOri);
	      for(var j = 1; j < 4; j++){
	        boxLocY ++;
	        oriBoxLocY ++;
	        boxNow = "box-" + boxLocX + "-" + boxLocY;// Box id at the drop location
	        boxOri = "box-" + oriBoxLocX + "-" + oriBoxLocY;
	        changeLoc(boxNow, boxOri);
	      }
	    }
	    else{
	      if(!$("#" + boxNow).hasClass("num")){
	        resetLoc(boxOri);
	        return;
	      }
	      changeLoc(boxNow, boxOri);
	    }
	    $(document).unbind("mousemove", moveIt);
	    $(document).unbind("mouseup", mouseUp);
```

[Full source code](https://github.com/quanru/dragThem)
