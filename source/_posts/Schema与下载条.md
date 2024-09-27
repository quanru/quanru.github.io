---
title: "Schema 与下载条"
toc: true
date: 2015-08-16 19:34:27
categories: 工作记录
tags:
- JavaScript
---

由于我司有个网站还没有对应的移动端版本，因此需要在移动端访问该网站时，在底部显示一条下载条，而且点击该下载条时需要满足以下两个需求：

1. 点击下载时，如果本机已经安装该软件，则尝试打开对应软件；
2. 点击下载时，如果本机未安装该软件，则跳转到对应系统的下载地址。

<!-- more -->

# 需求
由于我司有个网站还没有对应的移动端版本，因此需要在移动端访问该网站时，在底部显示一条下载条，而且点击该下载条时需要满足以下两个需求：

1. 点击下载时，如果本机已经安装该软件，则尝试打开对应软件；
2. 点击下载时，如果本机未安装该软件，则跳转到对应系统的下载地址。

![示意图](/post-img/downloadBar.png)

# schema协议

>schema类似自定义url协议，我们可以通过自定义的协议来打开自己的应用，形如：
 代码如下 复制代码
myapplink://
1. 例如 facebook的
fb://
2. itunes的
itms-apps://
3. 还有短信也是类似的
sms://
如果要打开一个app，最简单的方式是通过一个链接，如我们在html中这样写：
 代码如下 复制代码
<a href="myapplink://">打开我的app</a>

# 下载条

## 配置

由于该下载条在PC页面中使用，因此无法使用rem单位，我将下载条统一做成了png，并通过引入js文件来配置不同的下载条：
```
<script src="dlBar.js" data-imgurl="下载条图片地址" data-itunesurl="苹果下载地址" data-androidurl="安卓下载地址" data-schemaurl="schema url">
</script>
```

## 生成

考虑到兼容性，其中下载条使用原生原生的方法生成对应的css与html部分，其代码如下：

```javascript
          function creatHtml () {
                var st = document.createElement("style");
                var cssText = document.createTextNode(".bottom-bar { display: none; position: fixed;  left: 0; bottom: 0;  width: 100%; } .dl-btn { position: absolute; right: 17.5%; width: 18.75%; } .cl-btn { position: absolute; right: 3.4375%; width: 4.6875%; }  .dl-img { width: 100%;  display: block; }");
                st.setAttribute("type", "text/css");
                st.appendChild(cssText);
                var heads = document.getElementsByTagName("head");
                if(heads.length) {
                 heads[0].appendChild(st);
                }

            document.body.insertAdjacentHTML("beforeEnd", '<div id="barab" style="display: none; position: fixed;  left: 0; bottom: 0;  width: 100%;"><img style="width: 100%;  display: block;" src="'+ imgSrc +'" alt="下载条"><span style="position: absolute; right: 14.8%;  bottom: 20%; width: 18.55%; height: 63%"></span><span style="position: absolute; right: 3.4375%; bottom: 35%;width: 4.6875%; height: 30%;"></span></div>');
          }
```

配置使用的下载条图片、APP store跳转地址、Android的下载地址以及schema地址。

# 主要代码

```javascript
    function downloadApp () {
        var dlNow = document.querySelector("#barab span");
        var closeBtn = dlNow.nextElementSibling;
        closeBtn.addEventListener("touchend", function  (event) {
           downBar.style.display = "none";
        });
        dlNow.addEventListener("touchend", function  (event) {
          var t;
          var clickTime = new Date();
          var ifr = document.createElement('iframe');
          ifr.src = schemaSrc;
          ifr.style.display = 'none';
          document.body.appendChild(ifr);
          if(ios) {
            t = window.setTimeout(function  () {
              var timeOutTime = new Date();
              if (!clickTime || timeOutTime - clickTime < 600 + 200) {
                    window.location = itunesSrc;
              }
            }, 600);
          }
          if(android) {
                t = window.setTimeout(function() {
                    var endTime = Date.now();
                    if (!clickTime || endTime - clickTime < 600 + 200) {
                        window.location = androidSrc;
                    }
                }, 600);
          }
          window.onblur = function() {
              clearTimeout(t);
          };
        });
    }
    })();
```

## 代码思路

1. 首先创建一个iframe，将schema赋值给它的src属性；
2. 当点击下载按钮时，记录点击时的时间戳，并将iframe添加到body中，紧接着设置一个setTimeout；
3. 如果该程序已经安装，便会尝试使用schema协议打开app；
4. 如果该程序没有被安装，则所设置的定时器会在600ms后执行，并记录定时器触发的时间，与点击的时间如果相差200ms，则跳转到对应系统的下载地址。

## 原理

1. 如果schema地址跳转成功，说明程序已经安装，则后续代码如何执行已不重要；
2. 否则，没跳转成功的话，说明程序尚未安装，因此程序跳转到对应下载地址；
3. 其中时间差就是为了等待schema地址打开软件的，如果不设置等待时间的话，程序会马上执行跳转部分，也就没有schema什么事了。

[完整代码](https://github.com/quanru/downloadBar)
