---
title: git checkout and git reset Cheatsheet
toc: true
date: 2016-10-04 11:32:51
categories: Development Tools
tags:
- Git

---

I never fully understood git checkout and git reset, so last night I set up a repository to experiment. Here are my notes for future reference.

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
<i class="fas fa-globe-asia mr-2"></i>This article is also available in
<a href="/2016/10/04/git%20checkout%20%E4%B8%8E%20git%20reset%20%E5%A4%87%E5%BF%98%E5%BD%95/">简体中文</a>.
</div>
</article>

# The Three Areas in Git and the Repository

1. Working Directory

> The area where the files you are currently editing reside.

2. Staging Area (Stage Index)

> When you run git add <path>, the corresponding files are added to the staging area.

3. History

> When you run git commit, the changes in the staging area become a commit record stored in the history.

All of the above happens in the local repository. Only after running git push are the local repository changes (history) pushed to the remote repository.

There is also the concept of HEAD, which by default points to the latest commit on the current branch.

# git checkout

1. git checkout

> Primarily used for switching branches.

2. git checkout -- <path>

> Used to discard changes in the working directory.

> The '--' is used to distinguish this from the branch-switching git checkout. Consider the following scenario: there is a branch called 'master', and there is also a file called 'master' in the current directory. If you want to undo changes to the 'master' file in the working directory, running git checkout master would only switch you to the 'master' branch.

As shown below, after modifying a file and running git status, you get the following prompt: either use git add to stage the modified file, or use git checkout -- to discard the changes in the working directory. You can see that after running git checkout --, the README.md file is restored to its state before modification.

![git](/post-img/git-0.png)

# git reset

1. git reset HEAD

> Unstages changes from the staging area, moving them back to the working directory.

As shown below, after adding 'second modify' to the README.md file and staging the change with git add, the terminal suggests using git reset HEAD <path> to unstage the changes. Here, git reset HEAD resets the current HEAD to point to the current commit.

> HEAD can be omitted, as it defaults to the current commit.

![git](/post-img/git-1.png)

As shown below, continuing to modify README.md by appending 'third modify', then checking git status reveals both the original staged change (green text) and the new working directory change (red text). After running git reset HEAD, the terminal shows 'Unstaged changes after reset'. Checking git status again shows that the staging area is cleared, leaving only the working directory changes. Examining the README.md file in the working directory shows that the previously staged change has been unstaged without affecting the working directory files.

![git](/post-img/git-2.png)

## 'Unstaged changes after reset'

What if you run git reset 'commitID' <path>? In this case, 'reset' means pointing the current pointer to the specified 'commitID', and 'unstaged changes' refers to undoing the most recent 'git add'. Understanding these two parts separately makes it much clearer.

# git reset --soft/--mixed/--hard

As shown, git reset with flags cannot (or should not) be applied to a specific path, so it is mainly used to operate on commitIDs.

![git](/post-img/git-3.png)

## --soft

Resets the HEAD pointer to the specified commitID while keeping both the staging area and working directory unchanged.

As shown, after resetting the HEAD pointer to two commits prior, the current branch is behind the remote branch by two commits. Checking the staging area (git diff --cached) and the working directory (cat README.md) shows that both areas remain unchanged compared to before the git reset --soft.

![git](/post-img/git-4.png)

## --mixed

Resets the HEAD pointer to the specified commitID while clearing the staging area, but leaving the working directory unchanged.

As shown, the behavior here differs from what is described in [Understanding git reset soft, hard, mixed](http://www.cnblogs.com/kidsitcn/p/4513297.html) regarding --mixed, as it does not 'reset the index to match HEAD'.

![git](/post-img/git-5.png)

## --hard

Resets the HEAD pointer to the specified commitID while resetting both the staging area and working directory to match the specified commitID.

As shown, after a --hard reset, both the staging area and working directory are cleared. At this point, you can choose git pull to sync with the remote branch, or use git push --force to forcefully update the remote branch's commit history to match the local repository. However, it is generally recommended to use git revert, which rolls back while preserving the commit history.

![git](/post-img/git-6.png)

## Which One Is the Default?

Some articles say --mixed is the default, while others say --soft is the default.

As shown, the default is --mixed.

![git](/post-img/git-7.png)
