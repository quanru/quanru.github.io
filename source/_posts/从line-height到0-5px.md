---
title: 从 line-height 到 0.5 px
toc: true
date: 2015-09-14 21:54:33
categories: 工作记录
tags:
- CSS

---

前几天发现写的一段代码，其中line-height（1.7rem）与height（1.7rem）相等，font-size（1.1rem）；在ios设备上文字垂直居中，而在android设备上竟上下缝隙相差1px（其实我看不出来是不是一像素，我猜的）。

<!-- more -->

# 问题
前几天发现写的一段代码，其中line-height（1.7rem）与height（1.7rem）相等，font-size（1.1rem）；在ios设备上文字垂直居中，而在android设备上竟上下缝隙相差1px（其实我看不出来是不是一像素，我猜的）。

## 为什么

我试了好久，我以为是字体的原因，毕竟ios用了自己设计的字体，虽然我的大魅族也是自己设计（白永祥：这并没有什么卵用）。后来我发现当我把字体设为1rem时，android上的字体看起来就居中了，而ios无论如何都是居中的，百思不得其解啊；

机智如我，获取了魅族MX5的设备宽度（360），所以根据我的页面计算出来的rem对应为18px，也就是说line-height实际高度为1.7rem=1.7*18px=30.6px，font-size实际大小为1.1rem=1.1*18px=19.8px；

而由于1px是最小单位，那么这个带小数点的单位到底是向上取整还是向下取整，亦或是四舍五入，我在我的MX5上设置了“林”这个字的如下字号：70、70.4、70.5、70.6、71px；接着屏幕截图，放到ps里量了下，高度分别是71、71、71、71、72；事实证明是向下取整的，不要问我为什么是71而不是70，因为我不告诉你。

那么，就有了一个很好的解释了：line-height - font-size = (30 - 19)px = 11px，11px上下没法均摊，结果上面5px，而下面的空隙就是6px，导致了整体向上偏移，然而这没法解释ios设备为什么就可以上下均摊。

再试试，字号改为1rem的情况：line-height - font-size = (30 - 18)px = 12px，上下各自为6px，因此能居中。

## 0.5px

今天在搜寻如何在retina设备上实现1px，无意中发现ios8以上的版本，是支持0.5px的，也就是说ios8设备上的精度是0.5px，所以11px除以2，各自都是5.5px，难怪可以垂直居中。

## ios8中的近似

那么，70.4、70.5、70.6这些字号，在ios8这种精度为0.5px的设备上是如何近似的呢？答案就是：只要不是整数，通通设为70.5px，这能叫居中近似吗？哈哈~

## 那么问题来了

1px边框到底如何在非ios8的retina屏幕下实现呢？今天看到一篇博客里的一句话，我激动了：![被嫌弃的target-densitydpi属性](./post-img/0.5px.png)

要是没有最后一句话该多好啊~

网上搜了好久，找到一个不错的方法：
### 伪类 + transform
>原理是把原先元素的 border 去掉，然后利用 :before 或者 :after 重做 border ，并 transform 的 scale 缩小一半，原先的元素相对定位，新做的 border 绝对定位

单条 border:

```css
.hairlines li{
    position: relative;
    border:none;
}
.hairlines li:after{
    content: '';
    position: absolute;
    left: 0;
    background: #000;
    width: 100%;
    height: 1px;
    -webkit-transform: scaleY(0.5);
            transform: scaleY(0.5);
    -webkit-transform-origin: 0 0;
            transform-origin: 0 0;
}
```

四条 border:

```css
.hairlines li{
    position: relative;
    margin-bottom: 20px;
    border:none;
}
.hairlines li:after{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    border: 1px solid #000;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    width: 200%;
    height: 200%;
    -webkit-transform: scale(0.5);
    transform: scale(0.5);
    -webkit-transform-origin: left top;
    transform-origin: left top;
}
```

样式使用的时候，需要结合 JS 代码，判断是否 Retina 屏

```javascript
if(window.devicePixelRatio && devicePixelRatio >= 2){
    document.querySelector('ul').className = 'hairlines';
}
```
## 那么问题又来了
**有没有更好的方法啊？**
