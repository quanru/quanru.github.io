---
title: 使用 Linux 系统开发Web前端
toc: true
date: 2016-04-17 13:15:08
categories: 开发工具
tags:
- Linux
---

为什么使用 Linux? Mac纵有千千万万的好，作为学生党来说，毕竟其较高的价格让的确让许多我”党“人士望而却步，去年刚进公司实习的时候，使用的是Win7，对于Windows下的命令行体验真是无力吐槽，特别是对于Web前端来说，非常多的工具都运行在终端内，比如不计其数的Node.js工具，后来改用Linux就舒畅多了。

<!-- more -->

## 为什么使用 Linux

Mac纵有千千万万的好，作为学生党来说，毕竟其较高的价格让的确让许多我”党“人士望而却步，去年刚进公司实习的时候，使用的是Win7，对于Windows下的命令行体验真是无力吐槽，特别是对于Web前端来说，非常多的工具都运行在终端内，比如不计其数的Node.js工具，后来改用Linux就舒畅多了。

## 发行版本选择

发行版本个人还是推荐主流之一的Ubuntu，建议使用[Gnome Flavor](https://ubuntugnome.org/)版本，简洁优雅的Gnome3桌面，使用起来相当顺手，Ubuntu自带的Unity界面丑到我想哭。也可使用Fedora，它默认就是Gnome3，二者主要是包管理器不一样，前者使用apt-get，后者使用yum。

## 系统安装

建议使用U盘刻录安装，推荐刻录软件[UNetbootin](https://unetbootin.github.io/)，将下载好的ISO文件通过UNetbootin烧进U盘，安装前记得空出一块磁盘，系统本身占用很小，10G虽然够，还是建议20G吧。安装过程不细说了，网上教程一大堆，建议第一次安装还是对着教程来吧，记得备份重要文件。这是我安装后的桌面：
![Gnome-shell](./post-img/gnome-shell.png)

## 开发软件
前端开发所需的软件大都有对应的Linux版本，比如Sublime、Atom、Charles、WebStorm、Chrome，大家可自行Google下载。

#### 安装Git：

    sudo apt-get install git

配置github(如果你使用的话，否则可略过)：

1. 配置git用户名和邮箱

        git config user.name "用户名"
        git config user.email "邮箱"

在config后加参数 --global 可设置全局用户名和邮箱。

2. 生成ssh key

        ssh-keygen -t rsa -C "邮箱"

然后根据提示连续回车即可在~/.ssh目录下得到id_rsa和id_rsa.pub两个文件，id_rsa.pub文件里存放的就是公钥。

3. 上传公钥到github

复制公钥内容，接着登录github，进入Settings，选择 SSH and GPG keys，点击 New SSH key。

4. 测试是否配置成功

        ssh -T git@github.com

如果配置成功，则会显示：

    Hi username! You’ve successfully authenticated, but GitHub does not provide shell access.

#### 安装Node.js：

方法零：使用apt安装

        sudo apt-get install nodejs npm
        ln -s nodejs /usr/bin
        sudo apt-get install openjdk-9-jdk
        sudo npm i -g wnpm
        sudo wnpm i -g wac-cli

方法一：使用包管理器安装（推荐新手使用）
安装 5.x 版本：

        sudo apt-get install curl
        curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
        sudo apt-get install nodejs

方法二：使用 NVM 安装并管理 node，建议有一定 Linux 命令行和 Node.js 经验的人使用：

        https://github.com/creationix/nvm

方法三：也可采用编译源码的方式安装，打开终端，其步骤如下。

0. 安装 build-essential，即软件编译工具集，用于从源代码编译和安装软件。

        sudo apt-get update
        sudo apt-get install build-essential

1. 克隆分支并进入node目录：

        git clone https://github.com/nodejs/node.git && cd node

2. 切换到一个你需要的稳定分支：

        git checkout v4.0.0-rc  

3. 编译并安装：

        ./configure
        make
        sudo make install

4. 查看node安装位置并添加软连接：

        whereis node
        sudo ln -s /usr/local/bin/node /usr/bin/node
        sudo ln -s /usr/local/bin/npm /usr/bin/npm

5. 查看node版本

    node -v

#### PlayOnLinux && PhotoShop
令人头疼的PhotoShop，Adobe没有对应的Linux版本，此处使用Wine方案，推荐安装PlayOnLinux，你只要有exe文件就好了，Wine的环境配置不需要你操心，PlayOnLinux帮你搞定。安装PlayOnLinux只需输入一条命令搞定：

    sudo apt-get install playonlinux

装好后，打开PlayOnLinux，如何安装请看下图：

![PlayOnLinux](./post-img/playonlinux.png)

再往后就是下一步、下一步、下一步、完成。

![PhotoShop](./post-img/photoshop.png)

wine软件可能出现中文乱码，可参看[彻底消除wine中文乱码](http://www.wuwenhui.cn/2692.html)

#### Zsh终端：

1. 首先安装zsh：

    sudo apt-get install zsh

2. 切换shell：

    chsh -s `which zsh`

3. 重启系统即可生效

4. 安装主题，本人推荐主题[bullet-train-oh-my-zsh-theme](https://github.com/caiogondim/bullet-train-oh-my-zsh-theme)

![bullet-train-oh-my-zsh-theme](./post-img/zsh.png)

## 其它软件

[越过长城](https://github.com/XX-net/XX-Net)

[搜狗输入法](http://pinyin.sogou.com/linux/?r=pinyin)

[WPS](http://linux.wps.cn/)

[QQ](http://www.longene.org/forum/viewtopic.php?f=6&t=30516)

easystroke鼠标手势：

        sudo apt-get install easystroke

audacious听歌：

    sudo apt-get install audacious
