---
title: Node.js 微信公众号开发小试
date: 2016-08-14 13:10:21
categories: 前端
tags:
- JavaScript
- Node.js
---

**申请服务器: 微信公众号的开发需要使用一台用于接收并处理消息的服务器, 此处推荐申请腾讯的免费云主机, [点我去申请吧](https://www.qcloud.com/act/try?t=cvm), 每天九点半开抢, 我选择的服务器镜像是Ubuntu, 关于如何在服务器上配置Node环境, 可参考我另一篇博客[使用 Linux 系统开发Web前端](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/). 公众号开发的原理就是通过设置一个接收接口, 一旦开启开发者模式, 微信服务器将转发消息至该接口.**

<!-- more -->

## 申请服务器

微信公众号的开发需要使用一台用于接收并处理消息的服务器, 此处推荐申请腾讯的免费云主机, [点我去申请吧](https://www.qcloud.com/act/try?t=cvm), 每天九点半开抢, 我选择的服务器镜像是Ubuntu, 关于如何在服务器上配置Node环境, 可参考我另一篇博客[使用 Linux 系统开发Web前端](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/). 公众号开发的原理就是通过设置一个接收接口, 一旦开启开发者模式, 微信服务器将转发消息至该接口.

## 接入开发步骤

### 填写服务器配置
![](https://quanru.github.io/share/post-img/2016-07-29/1.png)

### 验证服务器地址的有效性
完成配置后, 服务器将收到来自微信的GET验证请求, 该请求包括如下参数:
>1. signature 微信加密签名, 使用开发者填写的token参数和请求中的timestamp参数、nonce参数进行加密
2. timestamp 时间戳
3. nonce 随机数
4. echostr 随机字符串, 当验证通过时, 返回该字符串给微信服务器, 从而完成验证

验证流程
>1. 将token、timestamp、nonce三个参数进行字典序排序
2. 将三个参数字符串拼接成一个字符串进行sha1加密
3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信

验证有效性的代码
```js
  app.get('/wechat', (req, res) => {
    var token = "quanru";
    var signature = req.query.signature;
    var timestamp = req.query.timestamp;
    var echostr = req.query.echostr;
    var nonce = req.query.nonce;

    var oriArray = [nonce, timestamp, token];
    oriArray.sort();
    var original = oriArray.join('');

    var shaObj = new jsSHA(original, 'TEXT');
    var scyptoString = shaObj.getHash('SHA-1', 'HEX');
    if (signature == scyptoString) {
      //验证成功
      res.send(echostr);
    } else {
      //验证失败
      res.send(false);
    }
  });
```

### 依据接口文档实现业务逻辑
以文本消息为例, 如下为微信转发至服务器的文本消息:
    ```html
     <xml>
     <ToUserName><![CDATA[toUser]]></ToUserName>
     <FromUserName><![CDATA[fromUser]]></FromUserName>
     <CreateTime>1348831860</CreateTime>
     <MsgType><![CDATA[text]]></MsgType>
     <Content><![CDATA[this is a test]]></Content>
     <MsgId>1234567890123456</MsgId>
     </xml>
    ```

消息处理:

```js
    app.post('/wechat', (req, res) => {
      res.writeHead(200, {'Content-Type': 'application/xml'});

      var content = req.body.xml.content;

      turingRobot(encodeURI(content)).then((data) => {
        var response = JSON.parse(data);
        var resMsg = autoReply(req.body.xml, response.text);
  console.log(resMsg);
        res.end(resMsg);
      });
  });
```

其中turingRobot用于向图灵机器人发送用户消息:
    ```js
    const request = require('request');
    function getTuringResponse(info) {
      if(typeof info !== 'string') {
        info = info.toString();
      }
      let options = {
        method:'GET',
        url: 'http://www.tuling123.com/openapi/api?key=13a74dbd0f6b45d69ac49334e7027742&info='+info
      };
      return new Promise((resolve, reject) => {
        request(options,  (err, res, body) => {
          if (res) {
            resolve(body);
          } else {
            reject(err);
          }
        });
      })
    }
    module.exports = getTuringResponse;
    ```

自动回复模块autoReply:
```js
    function autoReply(requestData, info) {
        if(requestData.msgtype == 'text') {
          var resMsg = '<xml>' +
            '<ToUserName><![CDATA[' + requestData.fromusername + ']]></ToUserName>' +
            '<FromUserName><![CDATA[' + requestData.tousername + ']]></FromUserName>' +
            '<CreateTime>' + parseInt(new Date().valueOf() / 1000) + '</CreateTime>' +
            '<MsgType><![CDATA[text]]></MsgType>' +
            '<Content><![CDATA['+info+']]></Content>' +
            '</xml>';
      }
      return resMsg;
    }
    module.exports = autoReply;
```

## One More Thing
使用微信的官方的Node中间件, 可更方便高效地开发公众号
[传送门](https://www.npmjs.com/package/wechat)
```js
    const turingRobot = require('./turingRobot');
    const autoReply = require('./autoReply');
    const wechat = require('wechat');

    module.exports = function(app) {
      //使用中间件
      //传入这三个配置, 自动帮你验证
      var config = {
        token: 'quanru',
        appid: 'wxdc6410f1001d787b',
        encodingAESKey: 'IJwymet3h2KzGSTPxMnITc25pGiSzSlWCXHUhcvQRzc'
      };
      app.use('/wechat', wechat(config, (req, res, next) => {
      //用户的消息以对象的形式返回到该变量
        var message = req.weixin;
        var content = message.Content;
        turingRobot(encodeURI(content))
          .then((data) => {
            var response = JSON.parse(data);
            //默认回复文本消息, 支持多种格式回复, 如图像, 音乐
            res.reply(response.text);
          });
      }));
    }
```

[附上精美PPT地址](https://quanru.github.io/share/2016-07-29.html#/)
[附上精美代码地址](https://github.com/quanru/share/tree/2016-07-29)

## 参考

[nodejs微信开发---自动回复的实现](https://segmentfault.com/a/1190000005861026)
[微信公众平台开发概述---接入指南(需要登录)](https://mp.weixin.qq.com/wiki)
[使用 Linux 系统开发Web前端](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/)
