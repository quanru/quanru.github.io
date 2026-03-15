---
title: "HTML5 Screenshot"
toc: true
date: 2015-07-19 10:41:29
categories: Interview
tags:
- Canvas
- CSS
---

Implement a QQ-screenshot-like tool: click the load button to load an image, long-press on the image to bring up a cropping box, resize the cropping box from its bottom-right corner, and display a real-time preview in the preview area on the right.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2015/07/19/HTML5%E6%88%AA%E5%9B%BE/">简体中文</a>.
</div>
</article>

# Requirements
Implement a QQ-screenshot-like tool: click the load button to load an image, long-press on the image to bring up a cropping box, resize the cropping box from its bottom-right corner, and display a real-time preview in the preview area on the right. The final result looks like this:
![Illustration](/post-img/screenShot.png)

# HTML
Pay attention to the canvas setup. The main structure is as follows:
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
The cropping box has an initial size of 50px * 50px. An invisible resize handle is placed at the bottom-right corner, set to 12px * 12px, and a resize event will be registered on it later.
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
The original image canvas and the preview area are the same size.

# JavaScript
## Load the Image and Draw on Canvas
```javascript
	function loadImg(event) { // Load image
	    cOri = document.getElementById("originImg");
	    imgOri = new Image();
	    ctxOri = cOri.getContext("2d");
	    imgOri.src = "vegetable.jpg";
	    imgOri.onload=function(){
	        ctxOri.drawImage(imgOri,0,0,500,500);// Draw the image onto the canvas
	    };
	}
```

## Long-Press the Area to Bring Up the Cropping Box
```javaScript
	function longClick(event) { // Long press to show cropping box
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
When the mouse is released, the timeout needs to be cleared.
### Initialize the Preview Canvas
```javaScript
	function initCanvas() {// Initialize preview canvas
	    cPre = document.getElementById("showPre");
	    ctxPre = cPre.getContext("2d");
	    img = document.getElementById("originImg");
	}
```
### Update the Preview Canvas
Based on the original image, use the drawImage method to draw the preview. Here, x and y are the coordinates of the cropping box's top-left corner relative to the original image's top-left corner; w and h are the width and height of the cropping box. These four parameters extract the image data within the cropping box. The subsequent (0, 0) coordinate represents where to place this image data on the canvas -- (0, 0) means the top-left corner of the image data aligns with the top-left corner of the preview area.
```javaScript
	function updateRect(x, y, w, h) {// Update canvas
	    ctxPre.clearRect(0, 0, 500, 500); // Clear canvas
	    ctxPre.drawImage(img, x, y, w, h, 0, 0, 500, 500);
	}
```
### Resize the Cropping Box
Calculate the top-left corner coordinates of the cropping box, then based on the mouse position after resizing, reset the cropping box dimensions and call the updateRect function to update the preview. Note that the cropping box boundaries must not exceed the original image dimensions.
```javaScript
	function resizeDown(event) {
	    event = event || window.event;
	    var shotRect = document.getElementById("shotRect"),
	        // Calculate top-left corner coordinates of the Rect
	        x = shotRect.offsetLeft,
	        y = shotRect.offsetTop ;
	        //console.log("x=" +  x+ " " + "y=" +  y);
	    // Bindevents
	    document.addEventListener("mousemove", mouseMove);
	    document.addEventListener("mouseup", mouseUp);
	    // Mouse move
	    function mouseMove(event) {
	        event = event || window.event;
	        var finalX = event.clientX,
	                finalY = event.clientY;
	        // Prevent exceeding boundaries
	        if (event.clientX >= 488) {
	            finalX = 488;
	        }
	        if (event.clientY >= 488) {
	            finalY = 488;
	        }
	        //console.log( (event.clientX) + " " + (event.clientY));
	        xy = (finalX - x + 10) < (finalY - y +10) ? (finalX -x + 10) : (finalY - y + 10);
	        // Calculate new Rect size after moving
	        shotRect.style.width = xy + 'px';
	        shotRect.style.height = xy + 'px';
	        updateRect(x, x, shotRect.offsetWidth, shotRect.offsetHeight);
	    }
	    // Stop event
	    function mouseUp() {
	        // Unbind events
	        document.removeEventListener("mousemove", mouseMove);
	        document.removeEventListener("mouseup", mouseUp);
	    }
	}
```
### Move the Cropping Box
See comments for details.
```javascript
	function dragDown(event) {
	    event = event || window.event;
	    if (event.target !== event.currentTarget) return; // If the event bubbled up from a child element, return
	    var shotRect = document.getElementById("shotRect"),
	        disX = event.clientX - shotRect.offsetLeft, // Cursor position relative to the cropping box when pressed
	        disY = event.clientY - shotRect.offsetTop;
	    // Bind events
	    document.addEventListener("mousemove", mouseMove);
	    document.addEventListener("mouseup", mouseUp);

	    function mouseMove(event) {
	        event = event || window.event;
	        var disL = event.clientX - disX, // Distance from cropping box left edge to left boundary
	            disT = event.clientY - disY, // Distance from cropping box top edge to top boundary
	            maxW = document.getElementById("originImg").clientWidth - shotRect.offsetWidth, // Max width
	            maxH = document.getElementById("originImg").clientHeight - shotRect.offsetHeight; // Max height
	        // Reset if exceeding boundaries
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
	        shotRect.style.left = disL + 'px'; // Recalculate the cropping box's relative position
	        shotRect.style.top = disT + 'px';
	        updateRect(disL, disT, shotRect.offsetWidth, shotRect.offsetHeight);
	    }

	    function mouseUp(event) {
	        document.removeEventListener("mousemove", mouseMove);
	        document.removeEventListener("mouseup", mouseUp);
	    }
	}
```
## Save the Image
Due to cross-origin restrictions, saving does not work in Chrome but works in Firefox:
```javascript
	function saveImg(event) {
	    var image = cPre.toDataURL("image/png");
	    var w = window.open('about:blank', 'image from canvas');
	    w.document.write("<img src='" + image + "' alt='from canvas'/>");
	}
```

[Full source code](https://github.com/quanru/screenShot)
