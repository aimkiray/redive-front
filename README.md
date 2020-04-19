ReDive 是一个支持音乐播放，嘤语学习的多功能复读机（CAI不是什么高级焊工养成游戏= =），使用前后端分离架构，前端基于 Vue.js 全家桶，后端基于 Golang 编写。

## Feature

音频上传
音频/歌单管理
导入网易歌单（物理保存免费歌曲的 MP3/封面/歌词/翻译 到服务器，永久可用）

音乐播放器
滚动歌词和翻译
显示音频波形

AB 复读
选区复读
自动断句
洗脑循环

选区文字（可记录 笔记/翻译 等相关信息）
选区保存/读取

Docker 部署

简~~陋~~洁的 UI 设计

华丽的 UI 设计
移动端完整适配（现在是丢了个 aplayer，其实也能用）
Native app


## 食用方法

> 餐具：1核2G, CentOS 7.3

### 1. 编译打包（可选）

对于开发者来说，使用 Docker 编译源代码显然更方便。但是对于一般用户而言，编译所依赖的众多工具会占用相当大的空间，漫长的等候也会降低使用体验。如果你不想编译，可以跳过此步骤，去 [release](https://github.com/aimkiray/redive-front/releases) 页面下载编译好的可执行文件和静态文件。

另外，后端配置文件位于`conf/config.ini`，需要修改的有用户名和密码（user 字段），默认都是`admin`，还有`JWT_SECRET`，用于生成`token`的密钥。

新建目录，Clone 前端和后端源代码。

```bash
$ mkdir ~/redive-source && cd ~/redive-source
$ git clone --depth 1 https://github.com/aimkiray/redive-back.git
$ git clone --depth 1 https://github.com/aimkiray/redive-front.git
```

后端程序基于 Golang 开发，可指定使用`cgo`编译器，生成名为`redive-back`的二进制文件`cgo`创建的可执行文件在没有外部依赖时，不包含动态链接，可适应多种生产环境。

```bash
$ cd redive-back
$ CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o redive-back.
```

前端基于开袋即食的 vue-cli，使用 yarn 或 npm 打包，生成的静态文件在`dist`目录中。

```bash
$ cd redive-front
$ yarn install
$ yarn build
```

### 2. 安装 Docker

先装你的 Docker CE，其他环境请看官方文档。

```bash
$ sudo yum install -y yum-utils
$ sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
$ sudo yum install docker-ce docker-ce-cli containerd.io
$ sudo systemctl start docker
```

使用国内的 Docker Hub 加快镜像下载，创建 daemon 的配置文件。

```bash
$ sudo vim /etc/docker/daemon.json
```

使用网易的镜像源，写入如下内容。

```json
{
  "registry-mirrors": [
    "https://hub-mirror.c.163.com"
  ]
}
```

安装 Docker Compose（以 1.25.5 版本为例）。

```bash
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
$ sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 准备 Docker 镜像（可选）

> 该部分生成的文件已包含在 release 文件中，普通用户只需解压即可。

~~虽然通常的做法是前后端各用各的容器，使用`docker-compose`统一管理，但为了省去一些麻烦，我们完全可以把它们盛在同一个容器里，这样的吃法也被称为咖喱饭，宛如魔法一般的咖哩，煮上一大锅丢冰箱里可以连吃三天哟！~~

试过上面的方案，感觉不太优雅，还是各用各的容器好一些。

> 这里提供一个通用的方法，如果你的餐桌不够大，请考虑能否吃到 Docker。

新建一个空的工作目录，创建后端的 Dockerfile 文件，写入如下内容。

```dockerfile
FROM scratch

WORKDIR /redive
COPY ./redive-back /redive

ENV RUN_MODE=release

EXPOSE 2333
CMD ["./redive-back"]
```

`scratch` 是一个空镜像，意味着从第一层开始编写指令，Go 编写的程序常用此方法制作镜像节约空间，以适应微服务的需求。

提前将`nginx`和`redis`的官方镜像 pull 下来备用。

```bash
$ sudo docker pull nginx:latest
$ sudo docker pull redis:latest
```

### 4. 工作目录（可选）

> 该部分准备的文件已包含在 release 文件中，普通用户只需解压即可。

找到之前编译的可执行文件`redive-back`，复制到工作目录，尝试构建名为`redive-back`的镜像。

```bash
$ sudo docker build -t redive-back .
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

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

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
      - ./static:/redive/static
      - ./config.ini:/redive/conf/config.ini
  redis:
    image: "redis:latest"
    restart: "always"
    volumes:
      - ./data:/data
    command: redis-server --appendonly yes
```

修改文件所有者，避免一些奇奇怪怪的问题出现。

```bash
$ sudo chown -R $USER:$USER .
```

### 5. 我开动了

进入工作目录或 release 解压后的根目录，执行如下指令后台启动容器。

```bash
$ sudo docker-compose up -d
```

停止和删除容器。

```bash
$ sudo docker-compose stop
$ sudo docker-compose rm
```

Enjoy yourself~

## 料理指南

> 炊具（默认最新）：node, vue-cli, golang

To Be Continued...后端部分你可以先参考[这个](https://github.com/EDDYCJY/blog)

## Tips

Alpha 版本由于时间紧迫没有完全测试~~完全没有测试~~，但本人师承育碧，尝试中发现什么 feature 或有什么想法欢迎提 issue 或 PR，以便改进。
Demo 服务器是个土豆，不仅慢还屏蔽了 上传/导入 功能，请给土豆多一点理解和包容。

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

## 以下是复读 time

如果这个项目对您有所帮助，欢迎~~一键三连~~点个🌟支持一下哟！

如果这个项目对您有所帮助，欢迎~~一键三连~~点个🌟支持一下哟！

如果这个项目对您有所帮助，欢迎~~一键三连~~点个🌟支持一下哟！

如果这...(╯°Д°)╯ ┻━┻



------

***注意：ReDive 仅能用于 Golang/Vue.js/English 等相关技术的学习和在法律允许范围内的使用，任何个人或集体不得使用 ReDive 进行任何违反相关法律法规的活动。***

Note: ReDive can **ONLY** be used for learning related technologies such as Golang/Vue.js/English and use within the scope permitted by law. Any individual or group **MAY NOT** use ReDive for any violation of relevant laws and regulations.

***任何尝试下载或下载 ReDive 任意分支或发行版即代表您同意本项目作者及贡献者不承担任何由于您违反以上准则所带来的任何法律责任。***

Any attempt to download of any branch or distribution of ReDive constitutes your agreement that the author and the contributor of the project **will not be** liable for any legal liability arising from your breach of the above guidelines.