# Taste Guide

ReDive 是一个可以管理音乐，学习嘤语的多功能复读机（cai不是什么高级焊工养成游戏= =），采用前后端分离架构，前端基于 Vue.js 全家桶，后端基于 Golang 编写，支持 Docker 部署。

## 目录

* [目录](#目录)
* [Demo](#demo)
* [To Do](#to-do)
* [食用方法](#食用方法)
   * [编译打包（可选）](#编译打包可选)
   * [安装 Docker](#安装-docker)
   * [准备 Docker 镜像（可选）](#准备-docker-镜像可选)
   * [工作目录（可选）](#工作目录可选)
   * [我开动了](#我开动了)
* [料理指南](#料理指南)
   * [Front-end](#front-end)
   * [Back-end](#back-end)
* [图片展示](#图片展示)
* [碎碎念](#碎碎念)
* [Reference](#reference)

## Demo

http://re.debuff.top:8000

用户名和密码都是 admin。

Demo 服务器是个土豆，不仅慢还 **404** 了 **上传/导入/更新** 功能，请给土豆多一点理解和包容～

波形需要等待音频完全加载，已有存档的除外。

移动端没有完全适配，目前只是能用的程度，如有需要请等待后续开发。

## To Do

- [x] 管理
	- [x] 音频上传
	- [x] 音频/歌单管理
	- [x] 导入网易歌单（下载 MP3/封面/歌词/翻译 到服务器，避免下架。此功能也可作为下载器）
- [x] 播放器
	- [x] 滚动歌词和翻译
	- [x] 显示音频波形
- [x] 复读机
	- [x] AB 复读
	- [x] 选区复读（在波形上选区）
	- [x] 自动断句
	- [x] 洗脑循环
	- [x] 选区文字（可记录 笔记/翻译 等相关信息）
	- [x] 选区保存/读取
- [x] Docker 部署
- [x] 简~~陋~~洁的 UI
- [x] 响应式布局（移动端有另外的设计）
- [ ] 华丽的 UI
- [ ] 移动端完整适配（现在是个 aplayer，其实也能用）
- [ ] Native app


## 食用方法

> 餐具：1核2G, CentOS 7.3（阿里云轻量）

### 编译打包（可选）

对于开发者来说，使用 Docker 编译源代码显然更方便。但是对于一般用户而言，编译所依赖的众多工具会占用相当大的空间，漫长的等候也会降低使用体验。[release](https://github.com/aimkiray/redive-front/releases) 页面有编译好的可执行文件和静态文件，下载解压即可。

另外，后端配置文件位于`conf/config.ini`，需要修改的部分有用户名和密码（user 字段），默认都是`admin`，还有`JWT_SECRET`，用于生成`token`的密钥。

新建目录，Clone 前端和后端源代码。

```bash
$ mkdir ~/redive-source && cd ~/redive-source
$ git clone --depth 1 https://github.com/aimkiray/redive-back.git
$ git clone --depth 1 https://github.com/aimkiray/redive-front.git
```

后端程序基于 Golang 开发，编译时指定`cgo`，生成名为`redive-back`的二进制文件，通过`cgo`创建的可执行文件不包含动态链接，可适应多种生产环境。

```bash
$ cd redive-back
$ CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o redive-back .
```

前端基于开袋即食的 vue-cli，使用 yarn 或 npm 打包，生成的静态文件在`dist`目录中。

```bash
$ cd redive-front
$ yarn install
$ yarn build
```

### 安装 Docker

测试环境为 CentOS 7，如需定制请参阅[官方文档](https://docs.docker.com/engine/install/centos/)。

```bash
$ curl -fsSL https://get.docker.com -o get-docker.sh
$ sudo sh get-docker.sh
$ sudo systemctl start docker
```

使用国内的 Docker Hub 加快镜像下载，创建 daemon 的配置文件。

```bash
$ vim /etc/docker/daemon.json
```

配置 daemon，通过国内的 Docker Hub 加快镜像下载。

```bash
$ vim /etc/docker/daemon.json
```

内容如下。

```json
{
  "registry-mirrors": [
    "https://kohnnhik.mirror.aliyuncs.com",
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

安装 Docker Compose（以 1.25.5 版本为例）。

```bash
$ curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ chmod +x /usr/local/bin/docker-compose
# optional
$ ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### 准备 Docker 镜像（可选）

> 该部分生成的文件已包含在 release 文件中，普通用户只需解压即可。

~~虽然通常的做法是前后端各用各的容器，使用`docker-compose`统一管理，但为了省去一些麻烦，我们完全可以把它们盛在同一个容器里，这样的吃法也被称为咖喱饭，宛如魔法一般的咖哩，煮上一大锅丢冰箱里可以连吃三天哟！~~

上面的方法显然不太优雅，还是各用各的容器好一些。

> 这里提供一个通用的方法，如果你的餐桌不够大，请考虑能否吃到 Docker。

新建一个空的工作目录，创建后端 Dockerfile 文件，写入如下内容。

```dockerfile
FROM alpine:latest

WORKDIR /redive
COPY ./redive-back /redive

ENV GIN_MODE=release

EXPOSE 2333
CMD ["./redive-back"]
```

~~基础镜像`scratch`是空的，意味着从第一层开始编写指令。Go 后端编译后生成一个二进制文件，常用此方法制作镜像节省空间。~~

由于`scratch`镜像缺少部分必要依赖，换用同样很小的`alpine linux`。

提前将`nginx`和`redis`等官方镜像 pull 下来备用。

```bash
$ docker pull alpine:latest
$ docker pull nginx:latest
$ docker pull redis:latest
```

### 工作目录（可选）

> 该部分准备的文件已包含在 release 文件中，普通用户只需解压即可。

找到之前编译的可执行文件`redive-back`，复制到工作目录，尝试构建名为`redive-back`的镜像。

```bash
$ docker build -t redive-back .
```

将前端静态文件目录`dist`也复制过来。

配置 Nginx 反向代理后端 REST API，执行`vim nginx.conf`，在新文件中写入如下内容。

```
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile             on;
    tcp_nopush           on;
    tcp_nodelay          on;
    keepalive_timeout    65;
    types_hash_max_size  2048;
    client_max_body_size 100m;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;
        
        # 反向代理后端 API
        location /api {
            proxy_pass http://redive-back:2333;
        }

        error_page 404 /404.html;
            location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
            location = /50x.html {
        }
    }
}
```

使用`vim docker-compose.yml`在工作目录建立`Compose`的配置文件，定义和运行 3 个 Docker 容器负责的应用。`redive-front`中的`ports`默认是`80:80`，前一个`80`是外部端口。后端配置文件`config.ini`也复制到工作目录下，根据需要修改。

```yaml
version: "3.8"
services:
  redive-front:
    image: "nginx:latest"
    restart: "always"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
    ports:
      - "80:80"
  redive-back:
    build: .
    restart: "always"
    volumes:
      - ./data/files:/redive/static
      - ./config.ini:/redive/conf/config.ini
  redis:
    image: "redis:latest"
    restart: "always"
    volumes:
      - ./data/db:/data
    command: redis-server --appendonly yes
```

修改文件所有者，避免一些奇奇怪怪的问题出现。

```bash
$ chown -R $USER:$USER .
```

### 我开动了

进入工作目录或 release 解压后的 redive 目录，修改`docker-compose.yml`中的端口，`config.ini`中的用户信息。执行如下指令启动容器。

```bash
$ docker-compose build --no-cache
$ docker-compose up -d
```

停止和删除容器。

```bash
$ docker-compose stop
$ docker-compose rm
```

Enjoy yourself~

## 料理指南

### Front-end

ReDive 通过 Vue CLI 搭建前端脚手架，并且尽可能的采用默认配置快速开发，代码使用 ES2015 语法。

ReDive 是单页面应用，路由使用 Vue Router 实现，全局数据交由 Vuex 管理。

音频波形生成功能使用了 [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)，进行了一些修改以适应特殊需求。

为了加快开发速度，音频播放器基于 [vue-aplayer](https://github.com/MoePlayer/vue-aplayer) 二次开发适配了桌面端，移动端暂时还是原本的样子，另外新增了歌词翻译和滚动功能。修改后的代码仓库已在下方列出。

### Back-end

后端基于 Golang 开发，通过 Gin 框架搭建 REST API，爬虫和文件下载使用原生方法实现。

根据需求，使用 Redis 作为 Key/Value 数据库，并通过 AOF 机制持久化数据，下面是数据结构示意图（不是E-R图，箭头也没有特别的意思）。数据库操作由 [go-redis](https://github.com/go-redis/redis) 提供，项目中的 model 文件实际上没有用到，但是能用来查阅字段名称。

![](https://github.com/aimkiray/redive-front/raw/master/docs/redis_mod.png)

## 图片展示

- 音乐播放

![](https://github.com/aimkiray/redive-front/raw/master/docs/music-player-mod.png)

- 嘤语学习

![](https://github.com/aimkiray/redive-front/raw/master/docs/english-player-mod.png)

- 音频列表

![](https://github.com/aimkiray/redive-front/raw/master/docs/audio-table.png)

- 歌单管理

![](https://github.com/aimkiray/redive-front/raw/master/docs/playlist.png)

- 新增歌曲

![](https://github.com/aimkiray/redive-front/raw/master/docs/audio-editor.png)

- 导入歌曲

![](https://github.com/aimkiray/redive-front/raw/master/docs/batch-import.png)

## 碎碎念

- Alpha 版本由于时间关系~~完全没有测试~~没有完全测试，但本人师承育碧，品质保证，尝试中发现什么 feature 或有什么想法欢迎提 issue 或 PR，以便改进。
- 例如，某个 feature 是在某些情况下音频跟不上波形，然后你就可以计算你的无线音频设备（点名 Chromecast）输出延迟了（有时间会修的咕）。
- 项目仍在开发中，近期忙着毕业，只会修 bug，后续再完善功能。
- 至于为何叫这个名字，当然是因为它本来就是个~~缝合~~焊接怪呀～
- 如果这个项目对您有所帮助，欢迎~~一键三连~~点个🌟支持一下哟！

## Reference

暂时想到了这些，排名不分先后。

后端

[Golang](https://github.com/golang)

[Gin](https://github.com/gin-gonic/gin)

[go-redis](https://github.com/go-redis/redis)

[jwt-go](https://github.com/dgrijalva/jwt-go)

前端

[Vue.js](https://github.com/vuejs)

[vue-aplayer](https://github.com/aimkiray/vue-aplayer)

[wavesurfer.js](https://github.com/aimkiray/wavesurfer.js)

[element-ui](https://element.eleme.cn/)

[marked](https://github.com/markedjs/marked)

参考

[煎鱼的博客](https://github.com/EDDYCJY/blog)

[LabAC](https://github.com/yangsoon/LabAC)

------

***注意：ReDive 仅能用于 Golang/Vue.js/Language 等相关技术的学习和在法律允许范围内的使用，任何个人或集体不得使用 ReDive 进行任何违反相关法律法规的活动。***

Note: ReDive can **ONLY** be used for learning related technologies such as Golang/Vue.js/English and use within the scope permitted by law. Any individual or group **MAY NOT** use ReDive for any violation of relevant laws and regulations.

***任何尝试下载或下载 ReDive 任意分支或发行版即代表您同意本项目作者及贡献者不承担任何由于您违反以上准则所带来的任何法律责任。***

Any attempt to download of any branch or distribution of ReDive constitutes your agreement that the author and the contributor of the project **will not be** liable for any legal liability arising from your breach of the above guidelines.
