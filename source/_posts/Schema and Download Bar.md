---
title: "Schema and Download Bar"
toc: true
date: 2015-08-16 19:34:27
categories: Work Notes
tags:
- JavaScript
---

Since our company had a website without a corresponding mobile version, we needed to display a download bar at the bottom when the website is accessed from a mobile device. Clicking the download bar needed to meet the following two requirements:

1. If the app is already installed on the device, attempt to open the corresponding app;
2. If the app is not installed on the device, redirect to the download page for the corresponding operating system.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2015/08/16/Schema%E4%B8%8E%E4%B8%8B%E8%BD%BD%E6%9D%A1/">简体中文</a>.
</div>
</article>

# Requirements
Since our company had a website without a corresponding mobile version, we needed to display a download bar at the bottom when the website is accessed from a mobile device. Clicking the download bar needed to meet the following two requirements:

1. If the app is already installed on the device, attempt to open the corresponding app;
2. If the app is not installed on the device, redirect to the download page for the corresponding operating system.

![Illustration](/post-img/downloadBar.png)

# Schema Protocol

>Schema is similar to a custom URL protocol. We can use a custom protocol to open our own application, in the format:
 Code example:
myapplink://
1. For example, Facebook's:
fb://
2. iTunes:
itms-apps://
3. SMS also uses a similar format:
sms://
If you want to open an app, the simplest way is through a link. For example, in HTML you can write:
 Code example:
<a href="myapplink://">Open my app</a>

# Download Bar

## Configuration

Since the download bar is used on a PC page, rem units cannot be used. I made all the download bars as PNGs and configured different download bars by including a JS file:
```
<script src="dlBar.js" data-imgurl="下载条图片地址" data-itunesurl="苹果下载地址" data-androidurl="安卓下载地址" data-schemaurl="schema url">
</script>
```

## Generation

For compatibility, the download bar is generated using vanilla JavaScript to create the corresponding CSS and HTML. The code is as follows:

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

Configure the download bar image, App Store redirect URL, Android download URL, and schema URL.

# Main Code

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

## Code Logic

1. First, create an iframe and assign the schema URL to its src attribute;
2. When the download button is clicked, record the timestamp at the time of the click, append the iframe to the body, and then set a setTimeout;
3. If the app is already installed, it will attempt to open the app using the schema protocol;
4. If the app is not installed, the timer will execute after 600ms. It records the time when the timer fires, and if the difference from the click time is within 200ms, it redirects to the download URL for the corresponding operating system.

## How It Works

1. If the schema URL redirect succeeds, it means the app is already installed, and it doesn't matter how the subsequent code executes;
2. Otherwise, if the redirect fails, it means the app is not installed, so the program redirects to the corresponding download URL;
3. The time difference is there to wait for the schema URL to open the app. Without the waiting time, the program would immediately execute the redirect, leaving no chance for the schema to work.

[Complete source code](https://github.com/quanru/downloadBar)
