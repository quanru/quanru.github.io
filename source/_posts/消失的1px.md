---
title: 消失的 1px
toc: true
date: 2016-04-17 14:38:11
categories: 工作记录
tags: CSS
---

之前本人写过一篇文章，是关于1px边框的：[从line-height到0-5px](http://quanru.github.io/2015/09/14/%E4%BB%8Eline-height%E5%88%B00-5px/)。文中提到用缩放的方法固然可行，但是在使用rem或者百分比单位时，时常会造成1px边框在某些机型下消失；而使用[border-image](http://imweb.io/topic/55e3d402771670e207a16bd1)方案则不会出现消失的情况；本文将探索该1px边框消失的原因以及后者为何能正常显示。

<!-- more -->

### 前因

之前本人写过一篇文章，是关于1px边框的：[从line-height到0-5px](http://quanru.github.io/2015/09/14/%E4%BB%8Eline-height%E5%88%B00-5px/)。文中提到用缩放的方法固然可行，但是在使用rem或者百分比单位时，时常会造成1px边框在某些机型下消失；而使用[border-image](http://imweb.io/topic/55e3d402771670e207a16bd1)方案则不会出现消失的情况；本文将探索该1px边框消失的原因以及后者为何能正常显示。

### LayoutUnit

在[LayoutUnit](http://trac.webkit.org/wiki/LayoutUnit)中提到了两种将亚像素(即小数点像素)转换为真实物理像素的两种方法，示意图如下：

![WebKitlayouttypes](https://quanru-github-io.pages.dev/post-img/WebKitlayouttypes.png)

#### enclosingIntRect

        x: floor(x)
        y: floor(y)
        maxX: ceil(x + width)
        maxY: ceil(y + height)
        width: ceil(x + width) - floor(x)
        height: ceil(y + height) - floor(y)
        pixelSnappedIntRect

采用该方式，最终形成的物理大小将会超过原来的小，使得盒模型出现溢出的风险。

#### pixelSnappedIntRect

        x: round(x)
        y: round(y)
        maxX: round(x + width)
        maxY: round(y + height)
        width: round(x + width) - round(x)
        height: round(y + height) - round(y)

    采用这种方式的好处是能够保证最终渲染的物理大小不超过原来的大小，使得在屏幕等分出现小数的情况也不会溢出到下一行。本人将七个div等分整个屏幕宽度，在不同的分辨率下并没有发生溢出的情况，因此猜测浏览器采用了这套方案。

### 转换时的相互影响

如果每个DOM节点都各自独立地采用上述方案之一，那么就不会出现1px消失的情况，然而事实上在文档流中，前一个节点所占用的大小经过亚像素转换之后，还会影响后一个节点的大小，从而影响后者进行亚像素转换。

此处以iPhone4屏幕大小为例，将其七等分：

       .box {
            font-size: 10px;
            width: 14.2857%;
            height: 14.2857%;
            background: pink;
            float: left;
        }
        .box:nth-child(2n) {
            background: gray;
        }


并打印计算宽度与实际渲染宽度：

```javascript
            $.each($(".box"), function(index, val) {
            var computedWid = getComputedStyle(val).width;
            var wid = val.offsetWidth;
            $(val).html(computedWid + '<br>' + wid + 'px');
```

显示效果如下：

![iPhone4](https://quanru-github-io.pages.dev/post-img/ip4.png)

其计算规则如下：

1. 第一个box的大小为45.7031px，进位46px大小，导致其覆盖了后一个box，覆盖宽度为1-0.7031=0.2969px；
2. 第二个box的大小此时缩减为45.7031-0.2969=45.4062px，因此舍入为45px，此时舍弃的0.4062px则合并到下一个box的上；
3. 第三个box的大小此时扩大为45.7031+0.4062=46.1093px，因此舍入为46px，合并到下一个box的宽度为0.1093px；
4. 第四个box的大小扩大为45.7031+0.1093px=45.8124px，因此进位为46px，覆盖下一个节点宽度0.1876px；
5. 第五个box的大小缩减为45.7031-0.1876=45.5155px，因此进位为46px，覆盖后一个节点宽度0.4845px；
6. 第六个box的大小缩减为45.7031-0.4845=45.2186px，因此舍入45px，合并到下一个节点宽度为0.2186px；
7. 第七个box的大小扩大为45.7031+0.2186=45.9217px，因此舍入为46px；

可发现计算结果与显示效果吻合，读者可以通过调整不同的分辨率来测试，根据这个规则都能预测正确结果。

### 结论

1. 采用scale、zoom、viewport等缩放方案实现的1px，由于实际上为0.5px的CSS像素，导致其有可能被上一个DOM节点所覆盖，从而导致其大小小于0.5px，进而导致其被舍入为0px，所以才会消失不见。

2. 而采用border-image方式则不会消失，由于border-image方案的大小为1px的CSS像素，上一个DOM节点无论如何覆盖，最大不过0.499999px，即不超过0.5px，因此即使被覆盖0.499999px，其大小仍为0.511111px，最终效果也是进位到1px，因此该方案实现的1px边框会始终显示。
