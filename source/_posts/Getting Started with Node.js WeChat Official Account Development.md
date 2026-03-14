---
title: Getting Started with Node.js WeChat Official Account Development
toc: true
date: 2016-08-14 13:10:21
categories: Node.js Server-side
tags:
- JavaScript
- Node.js
---

Setting up a server: WeChat Official Account development requires a server to receive and process messages. I recommend applying for a free cloud server from Tencent Cloud, [click here to apply](https://www.qcloud.com/act/try?t=cvm), available at 9:30 AM daily. I chose Ubuntu as the server image. For how to set up a Node environment on the server, refer to my other blog post [Using Linux for Web Frontend Development](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/). The principle of Official Account development is to set up a receiving interface; once developer mode is enabled, WeChat's server will forward messages to this interface.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/08/14/Node.js%20%E5%BE%AE%E4%BF%A1%E5%85%AC%E4%BC%97%E5%8F%B7%E5%BC%80%E5%8F%91%E5%B0%8F%E8%AF%95/">简体中文</a>.
</div>
</article>

## Setting Up a Server

WeChat Official Account development requires a server to receive and process messages. I recommend applying for a free cloud server from Tencent Cloud, [click here to apply](https://www.qcloud.com/act/try?t=cvm), available at 9:30 AM daily. I chose Ubuntu as the server image. For how to set up a Node environment on the server, refer to my other blog post [Using Linux for Web Frontend Development](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/). The principle of Official Account development is to set up a receiving interface; once developer mode is enabled, WeChat's server will forward messages to this interface.

## Development Steps

### Fill in Server Configuration
![](https://quanru.github.io/share/post-img/2016-07-29/1.png)

### Verify Server Address Validity
After completing the configuration, the server will receive a GET verification request from WeChat, which includes the following parameters:
>1. signature - WeChat encrypted signature, encrypted using the token parameter filled in by the developer along with the timestamp and nonce parameters from the request
2. timestamp - Timestamp
3. nonce - Random number
4. echostr - Random string; when verification passes, return this string to WeChat's server to complete the verification

Verification Process
>1. Sort the token, timestamp, and nonce parameters in lexicographic order
2. Concatenate the three parameter strings into one string and perform SHA1 encryption
3. The developer can compare the encrypted string with the signature to verify that the request originates from WeChat

Verification Code
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

### Implement Business Logic Based on the API Documentation
Taking text messages as an example, below is a text message forwarded by WeChat to the server:
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

Message Handling:

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

The turingRobot function is used to send user messages to the Turing Robot:
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

The auto-reply module autoReply:
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
Using WeChat's official Node middleware makes Official Account development more convenient and efficient.
[Link](https://www.npmjs.com/package/wechat)
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

[Presentation slides](https://quanru.github.io/share/2016-07-29.html#/)
[Source code](https://github.com/quanru/share/tree/2016-07-29)

## References

[Node.js WeChat Development - Implementing Auto Reply](https://segmentfault.com/a/1190000005861026)
[WeChat Official Platform Development Overview - Getting Started Guide (login required)](https://mp.weixin.qq.com/wiki)
[Using Linux for Web Frontend Development](http://quanru.github.io/2016/04/17/%E4%BD%BF%E7%94%A8%20Linux%20%E7%B3%BB%E7%BB%9F%E5%BC%80%E5%8F%91Web%E5%89%8D%E7%AB%AF/)
