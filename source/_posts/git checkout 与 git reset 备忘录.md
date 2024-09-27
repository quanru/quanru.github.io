---
title: git checkout 与 git reset 备忘录
toc: true
date: 2016-10-04 11:32:51
categories: 开发工具
tags:
- Git

---

一直没搞清 git checkout 与 git reset, 昨晚特地建了一个仓库进行实验, 特此备忘.

<!-- more -->

# git 的三块区域与仓库

1. 工作区 (working directory)

> 即当前编辑的文件所处的区域

2. 暂存区 (stage index)

> 即当你执行 git add <path> 命令之后, 对应的文件便加入暂存区

3. 历史记录区 (history)

> 即当你执行 git commit 之后, 暂存区的修改便会作为一个 commit 记录, 存入历史记录区

以上都发生在本地仓库, 直到执行 git push 之后, 便将本地仓库的修改 (历史记录区) 推送到远程仓库.

此外还有个 HEAD 的概念, 它默认指向当前分支的最新的一个 commit.

# git checkout

1. git checkout

> 平时主要用于切换分支

2. git checkout -- <path>

> 用于丢弃工作区的改动.

>其中 '--' 用于区分切换分支的 git checkout, 假设如下一种情况: 当前有个分支叫做 ' master', 此时当前目录下也有一个叫做 'master' 的文件, 此时你想撤销对工作区中对 'master' 文件的修改, 便执行 git checkout master, 但是该命令只是让你切换到 'master' 分支.

如图, 当我们修改一个文件后, 查看 git status, 给出了如下提示, 要么使用 git add 将修改过的文件提交到暂存区, 要么使用 git checkout -- 丢弃当前工作区对该文件的修改. 可以发现执行 git checkout -- 之后, README.md 恢复到修改之前.

![git](/post-img/git-0.png)

# git reset

1. git reset HEAD

> 丢弃暂存区的修改, 使改动退回到工作区

如下图, 当在添加 'second modify' 到 README.md 文件后, 将此次修改通过 git add 命令将其添加到暂存区, 终端提示使用 git reset HEAD <path> 用于取消暂存区的修改, 其中 git reset HEAD 代表将当前 HEAD 指向当前 commit.

> 其中 HEAD 可省略, 即默认指向当前 commit.

![git](/post-img/git-1.png)

如下图, 继续修改 README.md, 在文件中追加 ' third modify', 此时查看 git status, 发现除了原有的暂存区修改 (绿色文字) 之外, 还有第二次修改的当前工作区修改 (红色文字), 接着执行 git reset HEAD, 终端提示 '重置后取消暂存的变更', 此时查看 git status, 发现暂存区不见了, 只剩当前工作区, 查看工作区中的 README.md 文件, 发现原有的暂存区修改被撤销了, 且不影响工作区文件.

![git](/post-img/git-2.png)

## '重置后取消暂存的变更'

如果 git reset 'commitID' <path> 呢, 此时所谓 '重置' 指的是将当前指针指向对应的 'commitID', 而 '取消暂存的变更' 指的是撤销最近一次 'git add'; 这样分开看, 就很好理解了.

# git reset --soft/--mixed/--hard

如图, 带参数的 git reset 不能 (或不建议) 作用于某个路径, 因此只要用于操作 commitID.

![git](/post-img/git-3.png)

## --soft

重置 HEAD 的指针到指定的 commitID, 同时保持暂存区与工作区不变;

如图, 将 HEAD 指针重置到两个 commit 之前, 发现当前分支落后远程分支两个 commit, 此时查看暂存区 (git diff --cached) 和 工作区 (cat README.md), 可以发现这两个区域的文件相比 git reset --soft 之前都没有变化.

![git](/post-img/git-4.png)

## --mixed

重置 HEAD 的指针到指定的 commitID, 同时撤销暂存区, 而工作区则不变;

如图, 此处与 [git reset soft,hard,mixed之区别深解](http://www.cnblogs.com/kidsitcn/p/4513297.html) 中所述的 --mixed 有出入, 并没有 '并且重置index以便和HEAD相匹配';

![git](/post-img/git-5.png)

## --hard

重置 HEAD 的指针到指定的 commitID, 同时重置暂存区与工作区与其对应的 commitID 相匹配;

如图, 执行 --hard 重置之后, 暂存区与工作区全都消失了, 此时可以选择 git pull, 重新与远程分支一致, 也可使用 git push --force, 强行将远程分支的 commit 记录与本地仓库保持一致. 不过一般建议使用 git revert, 回退的同时保存 commit 的历史记录.

![git](/post-img/git-6.png)

## 到底哪个才是默认参数

有些文章说 --mixed 是默认参数, 也有些说 --soft 是默认参数

如图, 可知默认参数是 --mixed

![git](/post-img/git-7.png)
