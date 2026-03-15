---
title: "Monitoring and Alerting for CLI Tools"
toc: true
date: 2021-12-05 12:42:31
categories: Work Notes
tags:
- JavaScript
- Node.js
- Monitoring and Alerting
---

Over five years of work experience across three jobs, I've developed and maintained frontend CLI tools at every single one of them. While monitoring and alerting for frontend pages and server-side applications is taken for granted, these tools need it too. This article covers everything from error handling to reporting and troubleshooting.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2021/12/05/%E5%91%BD%E4%BB%A4%E8%A1%8C%E5%B7%A5%E5%85%B7%E7%9A%84%E7%9B%91%E6%8E%A7%E5%91%8A%E8%AD%A6%E5%BB%BA%E8%AE%BE/">简体中文</a>.
</div>
</article>

---
## Background
As frontend developers, we're all accustomed to having Sentry-like applications for error monitoring on frontend pages; Node.js applications print logs, and when needed, tools like Kibana are used for log querying, often with accompanying monitoring and alerting. Yet the CLI tools that frontend developers interact with daily typically only get attention when they crash — users either contact the developer directly or ask in a user group.

## Purpose

Let's first look at several characteristics of CLI tools:
1. They execute in the user's terminal, behaving like a client application
2. They run in a Node.js environment, behaving like a server-side application
3. Their users are developers, so they often can't be operated like a real consumer product

Based on these characteristics, CLI tool monitoring and alerting needs reporting capabilities; error handling should draw from Node.js application practices; developers have a higher tolerance for bugs and are adept at self-troubleshooting, so CLI tool maintainers should proactively address categories of issues to save developers time during troubleshooting; and there should be a feedback mechanism so the tool can become increasingly bug-free.

As CLI maintainers, the main purposes of monitoring and alerting are:

1. Proactively discover anomalies and intervene early, rather than waiting until issues accumulate and users come knocking
2. Most users won't proactively report issues — if alternatives exist or the tool isn't mandatory, users will simply churn
3. Even without churn, a frequently broken CLI tool erodes user trust
4. The key focus of monitoring and alerting is discovering "recurring" errors — solving classes of errors rather than sporadic ones, thus rapidly converging the error rate

## Error Handling
Before discussing monitoring and alerting, it's essential to explain how to handle program errors properly. If the program side can't handle and report errors effectively, monitoring and alerting will be ineffective.

### Error Classification
Correctly classifying errors helps us adopt different handling strategies. Errors are mainly divided into:

1. Operational errors (expected)
2. Programmer errors (unexpected)

The difference between these two types:

1. "Operational errors" are a normal part of program operation
2. "Programmer errors" are bugs, typically caused by programmer mistakes

Some examples:

- **Operational errors**
  - Unable to connect to server
  - Unable to resolve hostname
  - Invalid user input
  - Request timeout
  - Server returns 500
  - Socket hang-up

- **Programmer errors**
  - Reading a property of undefined
  - Calling an async function without specifying a callback
  - Passing a string where an object is expected
  - Passing an object where an IP address is expected

### How to Handle Different Error Types?

#### Operational Errors
- Handle directly (continue execution after handling)
- Propagate upward (throw the error up for the caller to handle)
- Retry the operation (e.g., retry the request)
- Crash directly (exit the process, e.g., out of memory)
- Log the error (only log or report the error)

#### Programmer Errors
- Cannot be handled (log & crash)

## Error Reporting

We can usually handle most "operational errors" properly, but when we encounter "operational errors" we can't handle or "programmer errors," typically all we can do is print the error to inform the user, exit the application, and report the error. The server side then classifies the errors into monitoring and alerting based on this information. So what kind of errors qualify as alerts, and what kind qualify as monitoring?

**Alerting**
- When the program encounters a "programmer error" requiring urgent intervention, e.g., the process crashes unexpectedly during template initialization
- When the program encounters an "operational error" that ultimately cannot be handled, e.g., retry limit reached when creating a GitLab project and it still fails

**Monitoring**
- When the program encounters an "operational error" that deserves attention, e.g., user entered an invalid path, or GitLab project creation frequently requires 2 retries
- When the program enters logic that deserves attention (not necessarily an error), e.g., a new user, new department, or new project appears

### Where to Report
#### Unexpected Errors

```js
process.on('unhandledRejection', error => {
  reportAlarm({ error });
  console.error('Unhandled Rejection Error: ', error);
  setTimeout(() => process.exit(1), 1000);
});
process.on('uncaughtException', error => {
  reportAlarm({ error });
  console.error('Unhandled Exception Error: ', error);
  setTimeout(() => process.exit(1), 1000);
});
```

#### Expected Errors

```js
try {
  // CLI processing logic
} catch (error) {
  console.error('Handled Error: ', error);
  await reportAlarm({ error });
  process.exit(1);
}
```

## Error Troubleshooting

Effective error reporting plays a decisive role in monitoring and alerting. Let's look at two examples of reported messages:

### Bad case
```js
Error Module: Template initialization
Error Message: Invalid input path
Error Stack: /Users/linleyang/code/temp/case.js:2
  throw new Error('Invalid input path');
  ^
Error: Invalid input path
    at init (/Users/linleyang/code/temp/case.js:2:9)
    at Object.<anonymous> (/Users/linleyang/code/temp/case.js:5:1)
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    at Module.load (internal/modules/cjs/loader.js:863:32)
    at Function.Module._load (internal/modules/cjs/loader.js:708:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)
    at internal/main/run_main_module.js:17:47
```

### Good case

```js
Error Module: Template initialization
Error Message: Invalid input path
Error Stack: /Users/linleyang/code/temp/case.js:2
  throw new Error('Invalid input path');
  ^
Error: Invalid input path
    at init (/Users/linleyang/code/temp/case.js:2:9)
    at Object.<anonymous> (/Users/linleyang/code/temp/case.js:5:1)
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    at Module.load (internal/modules/cjs/loader.js:863:32)
    at Function.Module._load (internal/modules/cjs/loader.js:708:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)
    at internal/main/run_main_module.js:17:47
Input Value: $/home/linleyang
Triggered By: Lin Yibing
```

The second example, beyond reporting the error message and stack trace, also reports sufficient error context — what we call the "error scene." With the error scene, we can potentially reproduce the issue ourselves, or solve it by reading the source code. Since the error scene is so important, let's see what contextual information can typically be reported:

1. Input parameters at the time of error
2. State at the time of error (key variables)
3. Triggering user
4. Error message/stack trace
5. Environment information (SCM, CI, local)
......

After properly handling errors and correctly reporting the context, the server can distribute errors to the responsible module owners. Here's an example:

```
  Template Initialization | Failed to Load Template | Error Alert

  Module Owner
  @Lin Yibing

  Basic Information
  Version: 1.0.1 Node: v12.22.5 Env: local
  Project: https://github.com/quanru/bagu

  User Information
  Name: @Lin XX
  First Usage: 2021-08-31 05:00:29
  Last Usage: 2021-11-23 06:00:00
  Historical Executions: 111

  Department Information
  Name: XX Department
  First Usage: 2021-05-24 04:03:43
  Total Users: 21
  Info Link: https://quanru.github.io/

  Error Information
  Level: Not Set
  Message:
  Cannot read property 'replace' of undefined
  Occurrences of this error by this user in last 24 hours: 4
  Total errors by this user in last 24 hours: 4
  Occurrences of this error by this user in last 3 months: 4
  Occurrences of this error by all users in last 3 months: 26

  Error Stack:
  Error: Invalid input path
      at init (/Users/linleyang/code/temp/case.js:2:9)
      at Object.<anonymous> (/Users/linleyang/code/temp/case.js:5:1)
      at Module._compile (internal/modules/cjs/loader.js:999:30)
      at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
      at Module.load (internal/modules/cjs/loader.js:863:32)
      at Function.Module._load (internal/modules/cjs/loader.js:708:14)
      at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)
      at internal/main/run_main_module.js:17:47

  Context Information
  Input Value: $/home/linleyang

  Additional Information
  command: cra init hello-world

```

## Reporting Strategy
To help CLI maintainers focus on handling errors, keep in mind about "monitoring and alerting":

1. Only provide one channel — users should report judiciously
2. Reporting everything is no different from reporting nothing

The server side should provide default reporting strategies:
> These strategies provide parameters for the reporting side to configure

1. Same person, report only once within 30 minutes
2. Same person, no report on first occurrence
3. Reports without context or additional information are downgraded to monitoring

The reporting side should consider:

- Don't report debug traffic/test versions
- The reporting side should proactively distinguish between monitoring and alerting (e.g., npm start)
  - Code changes in the user's directory can be monitoring
  - Errors in our module code should be alerts
- Proactively handle expected errors to reduce fallthrough to catch-all handlers (e.g., a missing npm package)
- Configure "reporting strategies" as needed
- When actively exiting with an error (process.exit(1)), use console.error instead of console.log, so the parent process can capture stderr
- When using spawnSync for child processes, pipe stderr to the parent process for handling

---

## References

- https://www.joyent.com/node-js/production/design/errors
