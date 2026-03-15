---
title: "Notes on Node.js in Depth"
toc: true
date: 2016-12-25 21:09:38
categories: Reading Notes
tags:
- JavaScript
- Node.js
---

Frontend developers picking up Node.js still need to brush up on some server-side knowledge.
<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/12/25/%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BA%20Node.js%20%E3%81%AE%E7%AC%94%E8%AE%B0/">简体中文</a>.
</div>
</article>

# Chapters 1 & 2

1. Single-threaded, meaning Node doesn't need to worry about state synchronization like multi-threaded programming (no deadlocks, no thread context switching)
2. The exports object is used to export methods or variables from the current module. Additionally, a module object exists in the module, representing the module itself, and exports is a property of module
3. Difference between exports and module.exports:
   1. module.exports initial value is an empty object {}
   2. exports is a reference pointing to module.exports
   3. require() returns module.exports, not exports
4. When requiring a module, it's loaded from cache first. Node caches the compiled and executed object
5. When requiring a module, extensions can be omitted. Node tries .js, .json, .node in order. It's recommended to include the extension for .json and .node files
6. During module compilation, Node wraps the JavaScript file with head and tail, executing it within a closure containing specific variables (exports, require, module, __filename, __dirname). The closure returns the module's exports property

# Chapter 3

1. Blocking IO: Waits until all operations at the system kernel level complete before the call ends
2. Non-blocking IO: Returns immediately after the call (without the completed data, since it hasn't been generated yet). The data must be read again later via file descriptors
3. After non-blocking IO returns, CPU time slices can handle other tasks, but polling is needed to determine if the operation is complete
4. Polling satisfies non-blocking IO's need for complete data, but from the application's perspective, it's still synchronous since the application still waits for IO to fully return
5. Node's single thread only refers to JavaScript executing in a single thread; internally, a thread pool handles IO tasks
6. Node's classic call pattern: JavaScript calls Node core modules; core modules call C++ built-in modules; built-in modules make system calls through libuv (libuv serves as the abstraction layer with two platform implementations)
7. Node's async model:

   Part 1: JavaScript call returns immediately; during the system call, a request object is created containing parameters from JavaScript, the current method, and the callback function; the object is then pushed into the thread pool for execution, regardless of whether the IO operation blocks

   Part 2: After IO operations in the thread pool complete, the IO result notifies and returns the thread; during each Tick, a specific method checks if the thread pool has completed requests; if so, the request object is added to the IO observer's queue and processed as an event

8. setTimeout and setInterval timing is imprecise; compared to process.nextTick, they waste more performance
9. process.nextTick executes all callbacks in the array within each loop iteration, while setImmediate executes one callback from the linked list per iteration

# Chapter 4

1. Thundering herd: In high-traffic, high-concurrency scenarios where cache becomes invalid, massive requests simultaneously flood the database, which can't handle that many queries, cascading back to affect overall site responsiveness
2. Using once to solve the thundering herd problem:

```js
const proxy = new events.EventEmitter();
let status = 'ready';
const select = function(callback) {
  proxy.once('selected', callback);
  if(status === 'ready') {
    status = 'pending';
    db.select('SQL', (ret) => {
      proxy.emit('selected', ret);
      status = 'ready';
    });
  }};
```

All request callbacks are pushed into the event queue. Using once ensures each callback executes only once. For identical SQL queries, only one query runs; new identical calls just wait in the queue. Once the query completes, results are shared by all calls (since they all listen to the 'selected' event).

3. Tail trigger: the next() mechanism

# Chapter 5

1. Releasing references: delete and reassignment have the same effect. In V8, deleting object properties with delete may interfere with V8 optimization, so reassignment is recommended.
2. Memory that can't be immediately reclaimed includes closures and global variable references. Due to V8's memory limits, be very careful whether such variables grow without bounds, as they cause objects in the old generation to increase.
3. Heap memory is always smaller than process memory, meaning not all memory in Node is allocated through V8. Memory not allocated through V8 is called off-heap memory. For example, Buffer objects bypass V8's memory allocation mechanism and aren't subject to heap memory size limits.
4. Due to the module caching mechanism, modules are permanent residents of the old generation. Be very careful about memory leaks when designing modules.
5. Due to V8's memory limits, we can't directly use fs.readFile() and fs.writeFile() for large file operations. Instead, use fs.createReadStream() and fs.createWriteStream() for stream-based large file operations.

# Chapter 6

1. Buffers exceeding 8 KB directly allocate a SlowBuffer object as the slab unit, exclusively used by that large Buffer.
2. Buffer objects mentioned above are at the JavaScript level and can be marked and collected by V8's garbage collector. But the parent property pointing to SlowBuffer comes from Node's C++ level Buffer objects, using memory outside V8's heap.
3. For small, frequent Buffer operations, the slab mechanism pre-allocates and post-distributes, reducing system calls between JavaScript and the OS. For large Buffers, C++ level memory is used directly without fine-grained allocation.
4. `buffer += chunk;` hides a toString() operation, equivalent to: `buffer = buffer.toString() + chunk.toString();`
5. Pre-converting static content to Buffer objects effectively reduces CPU reuse, saving server resources. In Node web applications, separate dynamic and static content. Static content can be pre-converted to Buffers for performance gains. Since files are binary data, when content doesn't need modification, read only Buffers and transmit directly without extra conversion.

# Chapter 7

1. TCP optimizes small packets with the Nagle algorithm, which requires buffered data to reach a certain amount or time before sending. This optimizes bandwidth but may delay data transmission.
2. In Node, TCP has Nagle enabled by default. Call socket.setNoDelay(true) to disable it. Note: even with Nagle off, the receiving end may combine multiple small packets and trigger only one data event.
3. UDP and TCP both belong to the transport layer. TCP connections are persistent; to communicate with another TCP service, a new socket is needed. UDP allows one socket to communicate with multiple UDP services. It's commonly used where losing a few packets doesn't matter significantly, like audio and video. DNS is based on UDP.
4. The message body is abstracted as a read-only stream. Business logic must wait for the stream to end before operating on the data.
5. HTTP response objects wrap low-level connection writes and can be viewed as writable streams. Use res.setHeader() and res.writeHead() for headers. Headers are only written to the connection after writeHead() is called.
6. The body is sent via res.write() and res.end(). res.end() calls write() first, then signals the response is complete.
7. After response ends, HTTP server may reuse the connection for the next request or close it. Headers must be sent before the body—once data sending begins, writeHead() and setHeader() have no effect. Always call res.end() to finish, or the client hangs forever.

# Chapter 8

### Basic Functionality & Data Upload

1. RESTful Web service request methods: PUT (create), POST (update), GET (view), DELETE (remove)
2. Query string parsing with url and querystring modules
3. When query string keys appear multiple times, values become arrays—always check for arrays vs strings
4. Cookie processing: server sends to client, browser saves, browser sends on every subsequent request
5. Session solves Cookie security issues by keeping data server-side only
6. For performance and cross-process sharing, Sessions are typically centralized using Redis, Memcached, etc.

### Route Resolution & Middleware

1. MVC: Controller (action collection), Model (data operations), View (rendering)
2. require caching ensures only the first require blocks
3. RESTful: treat server content as resources, operations reflected in HTTP methods
4. Connect middleware uses next() for tail triggering
5. Middleware performance: write efficient middleware (call next() early, cache results, avoid unnecessary computation); use routes wisely to limit middleware scope

# Chapter 9

1. Creating child processes: child_process module's four methods: spawn(), exec(), execFile(), fork()
2. send() supports five handle types: net.Socket, net.Server, net.Native, dgram.Socket, dgram.Native
3. Multiple apps on the same port: file descriptors are preemptive—only one process gets the connection
4. kill() sends system signals to child processes, triggering agreed behaviors
5. Suicide signal: before a child process exits, it proactively notifies the parent to create a replacement, ensuring no request gap
6. Rate-limited restarts: when restarts are too frequent, actively stop restarting
7. State sharing via third-party storage (DB, disk, Redis) with polling or active notification

# Chapter 10

1. Unit test principles: Single responsibility, Interface abstraction, Layer separation
2. TDD (Test-Driven Development) vs BDD (Behavior-Driven Development): TDD focuses on correct implementation; BDD focuses on expected behavior
3. BDD: before/after trigger on entering/exiting describe; beforeEach/afterEach trigger around each test case
4. Performance testing: Benchmarks (operations per time unit); Stress testing (throughput, response time, concurrency)
