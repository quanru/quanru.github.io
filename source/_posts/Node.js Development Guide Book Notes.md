---
title: "Node.js Development Guide - Book Notes"
toc: true
date: 2016-3-18 16:31:19
categories: Reading Notes
tags:
- JavaScript
- Node.js
---

### Chapter 3
1. Single Loading:
>require does not load modules repeatedly. No matter how many times require is called, the module obtained is always the same one.

2. Overriding exports:
>When encapsulating an object into a module, using exports.Hello = Hello requires require('./singleobject').Hello to obtain the object. This can be simplified as follows: module.exports = Hello; Then you can directly obtain the object: var Hello = require('./hello'); hello = new Hello();

3. Creating Global Links:
>npm link express; This allows you to use the globally installed express in the current directory.

4.
>Use npm init to interactively initialize a standard package.json;
Publish a package: npm publish;
After modifying the version field in the json file, republish to update the version;
Unpublish: npm unpublish;

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/03/18/Node.js%20%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97%E4%B9%A6%E6%91%98/">简体中文</a>.
</div>
</article>

# Chapter 3
1. Single Loading:
>require does not load modules repeatedly. No matter how many times require is called, the module obtained is always the same one.

2. Overriding exports:
>When encapsulating an object into a module, using exports.Hello = Hello requires require('./singleobject').Hello to obtain the object. This can be simplified as follows: module.exports = Hello; Then you can directly obtain the object: var Hello = require('./hello'); hello = new Hello();

3. Creating Global Links:
>npm link express; This allows you to use the globally installed express in the current directory.

4.
>Use npm init to interactively initialize a standard package.json;
Publish a package: npm publish;
After modifying the version field in the json file, republish to update the version;
Unpublish: npm unpublish;

# Chapter 4
1. process:
> process.argv: An array of command-line arguments, where the first element is node, and so on;
process.nextTick(callback): Sets a task for the event loop. Node.js will call the callback on the next event loop iteration (generally used to split events, thereby reducing the execution time of each event);

2. console:
> console.trace(): Outputs the current call stack to the standard error stream;

3. util:
>util.inherits(constructor, superConstructor): Only inherits functions defined in the prototype of superConstructor. Properties and functions created inside the constructor are not inherited;
util.inspect(object, [showHidden], [depth], [colors]): A method to convert any object to a string, typically used for debugging and error output;

4. events:
```javascript
            events.EventEmitter:
                 var events = require("events");
                 var emitter = new events.EventEmitter();
                  emitter.on("someEvent", function(arg1, arg2) {
                           console.lgo("listener1", arg1, arg2);
                 });
            emitter.emit("someEvent", "byvoid", 1991);
```

result:
>listener1 byvoid 1991

emitter.emit("error"); exits the program and prints the call stack.
Any core module that supports event responses is a subclass of EventEmitter, such as fs, net, and http.

5. fs:
>fs.readFile(filename, [encoding], [callback(err, data)];
fs.readFileSync(filename, [encoding]);
Unlike synchronous I/O functions, asynchronous functions in Node.js mostly do not have return values.

6. HTTP Server:
>var http = requitr('http');

http.Server is an event-based HTTP server with the following main events:
>1. request: Triggered when a client request arrives, providing two parameters req and res, which are instances of http.ServerRequest and http.ServerResponse respectively.
2. connection: Triggered when a TCP connection is established, providing a parameter socket, which is an instance of net.Socket. This event has coarser granularity than request.
3. close: Triggered when the server is closed, not when a user disconnects.
>Since request is the most commonly used, http provides a shortcut: http.createServer([requestListener]), which creates an HTTP server and sets requestListener as the listener function for the request event.

http.ServerRequest provides the following three events for controlling transmission:
>1. data: Triggered when the request body arrives, providing a parameter chunk representing the received data.
2. end: Triggered when the request body data transmission is complete.
3. close: Triggered when the current user request ends.

http.ServerResponse is the information returned to the client:
>1. response.WriteHead(statusCode, [headers]): Sends a response header to the client.
2. response.write(data, [encoding]): Sends response content to the requesting client.
3. response.end([data], [encoding]): Ends the response, informing the client that all sending is complete. If not called, the client will remain in a waiting state forever.

# Chapter 5
1. Building the basic website structure:
>express -t ejs microblog

2. Creating an application instance:
>express.createServer()

3. Control transfer:
>When Express processes routing rules, it prioritizes matching rules defined first. Later rules will be blocked, but you can use next() to transfer control.

4. Path matching:
>app.get('/user/:username', function(req, res) { res.send('user: ' + req.params.username);

5. The EJS template engine has three types of tags:
```html
        <% code %>: JavaScript code;
        <%= code %>: Displays content with HTML special characters escaped;
        <%- code %>: Displays raw HTML content.
```

6. Disabling layout:
>app.set('view options', { layout: false });
Specifying a layout:
>function(req, res) { res.render('userlist', { title: 'Admin Panel', layout: 'admin' }); }; This specifies admin.ejs as the page layout.

7. Partial views:
>partials.

8. View helpers:
>Static view helpers can be any type of object, including functions that accept arbitrary parameters, and the accessed objects must be independent of user requests;
Dynamic view helpers can only be a function that does not accept parameters but can access the req and res objects;


# Chapter 6
1. When the file module extension is not explicitly specified, Node.js will try appending .js, .json, and .node extensions respectively. .js is JavaScript code, .json is JSON-formatted text, and .node is compiled C/C++ code.

2. When require encounters a module name that is neither a core module nor expressed as a path, it will try to look it up in the node_modules directory under the current directory. If not found, it will continue searching in the node_modules directory one level up, repeating this process until the root directory is reached.

3. Loading cache:
>Node.js modules are not loaded repeatedly because Node.js caches all loaded file modules by filename. Subsequent accesses will not reload them. Note that Node.js caches based on the actual filename, so loading twice will not result in duplicate loading if the resolved file is the same.

4. Control flow issues:
>Loop traps can be solved using forEach, closures, or let.
