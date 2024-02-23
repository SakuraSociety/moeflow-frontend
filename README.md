# 萌翻[MoeFlow]前端项目

此仓库添加了对在图片编辑时检测是否有多个用户正在编辑，防止用户编辑的内容被覆盖

![image](https://github.com/HoubunSOP/moeflow-frontend/assets/69132853/609fae77-57d8-43cf-9024-828c710a33f9)

使用此仓库需要启动一个特殊的服务端（十分轻量），而不是使用萌翻的服务端（防止过多破坏 docker 中的镜像而不好修改文件）

```js
const WebSocket = require('websocket').server;
const http = require('http');

const server = http.createServer((request, response) => {
  // 处理HTTP请求
});

server.listen(8765, () => {
  console.log('WebSocket Server is listening on port 8765');
});

// 创建WebSocket服务器
const wsServer = new WebSocket({
  httpServer: server,
});

// 用于存储连接的客户端
const clients = [];

// 用于存储每个页面的连接人数
const pageVisitorCounts = new Map();

// 监听WebSocket连接事件
wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);

  // 将连接的客户端添加到列表中
  clients.push(connection);

  // 监听接收到消息事件
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const data = message.utf8Data;

      // 在这里处理接收到的消息
      // 根据你的需求进行相应的操作

      // 假设接收到的是独一无二的字符串
      const uniqueString = data;

      // 检查页面是否在计数器中，如果不存在则初始化为0
      if (!pageVisitorCounts.has(uniqueString)) {
        pageVisitorCounts.set(uniqueString, 0);
      }

      // 增加页面连接人数
      const currentCount = pageVisitorCounts.get(uniqueString) + 1;
      pageVisitorCounts.set(uniqueString, currentCount);

      // 发送当前连接人数给客户端
      connection.sendUTF(currentCount.toString());
      // 更新其他客户端的连接人数
      clients.forEach((client) => {
        pageVisitorCounts.forEach((count, uniqueString) => {
          client.sendUTF(count.toString());
        });
      });
    }
  });

  // 监听客户端关闭连接事件
  connection.on('close', () => {
    // 从列表中移除关闭的客户端
    const index = clients.indexOf(connection);
    clients.splice(index, 1);

    // 减少页面连接人数
    pageVisitorCounts.forEach((count, uniqueString) => {
      if (count > 0) {
        pageVisitorCounts.set(uniqueString, count - 1);
      }
    });

    // 更新其他客户端的连接人数
    clients.forEach((client) => {
      pageVisitorCounts.forEach((count, uniqueString) => {
        client.sendUTF(count.toString());
      });
    });
  });
});
```

在服务器中启动上方的服务端，您可以使用 pm2/screen 等可以挂后台的程序进行，也可以直接运行 `node [脚本名].js`

比如 pm2 出现了下面的类似内容就是已经成功了

```bash
[PM2] Spawning PM2 daemon with pm2_home=/root/.pm2
[PM2] PM2 Successfully daemonized
[PM2] Starting /www/wwwroot/moeflow-deploy/server.js in fork_mode (1 instance)
[PM2] Done.
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │├────┼───────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤│ 0  │ server    │ default     │ N/A     │ fork    │ 254028   │ 0s     │ 0    │ online    │ 0%       │ 46.9mb   │ root     │ disabled │└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

然后请修改本仓库中的 `.env.local`中的 `REACT_APP__NUM_BASE_URL`替换为你服务器中的内容，如果您没有修改任何服务端脚本的内容并且没有进行反向代理的话可以填写为 `你的服务器IP:8765`

请注意不要添加任何 http 协议头（例如 ` http://``https:// `）

而是添加 ws 协议头（非 SSL：`ws://` SSL:`wss://`）

然后在编译此版本后进入 docker 容器中的 build 文件夹中直接替换文件即可

**由于部分API代码调整，请更新萌翻后端到对应 Version.1.0.1 后继续使用。**

## 技术栈

- Core
  - react
  - react-router // 路由
  - emotion // CSS in JS
  - react-intl // i18n
  - redux
    - react-redux
    - redux-saga // 副作用处理
  - immer.js // 不可变对象处理
- UI
  - antd
  - antd-mobile
  - classnames
  - fontawesome
- Other
  - pepjs // Pointer 事件垫片
  - bowser // 浏览器识别
  - why-did-you-render // 性能优化
  - lodash // 工具库
  - uuid
  - fontmin // 字体剪切

## 开发步骤

1. 建议使用 Node.js 近期LTS版本，如v18 v20
2. `npm install` 安装依赖项
3. `npm start start` 启动vite 开发服务器
    - 开发服务器自带API反向代理。默认将 `localhost:5173/api/*` 的请求自动转发到 `localhost:5000` (本地moeflow-backend开发版的商品)
    - 上述配置可在 `vite.config.ts` 修改。比如不在本地跑moeflow-backend，改用公网的服务器。
4. `npm build` 发布前端代码，**请注意** 此时使用的后端地址配置为 `.env.local` 中的配置。
    - 如果没有创建 `.env.local` 则为默认值 `/api`。

如果您要部署到 `Vercel` 之类的网站托管程序上，您可以直接将 `REACT_APP_BASE_URL` 相对应的后端接口地址配置到托管程序的环境变量中。

## 将前后端项目合并

最新版本的后端已经支持将前端项目编译完合并到后端，仅保留一个端口更好做映射！

1. 复制 `.env.sample` 改名为 `.env.local` 修改此文件为 `REACT_APP_BASE_URL=/`
2. `npm run build` 编译前端代码。默认的编译结果目录是 `build`
3. 打开 [萌翻后端项目](https://github.com/kozzzx/moeflow-backend) 找到 `app` 文件夹，将前端 `build/static` 整个文件夹复制到此目录。
4. 找到后端项目 `app/templates/index.html` 文件，用前端 `build/index.html` 文件替换。
5. 将后端跑起来，访问首页 `http://127.0.0.1:5001/`（地址以命令行提示为准） 就可以正常访问、登录等操作。

## 修改项目配置

如果您的译制组不是从 日语(ja) 翻译为 繁体中文(zh-TW) 您可以修改 `src/configs.tsx` 文件中的对应位置的配置（文件中有注释）。
以下是常见的几个语言代码：

- `ja` 日语
- `en` 英语
- `ko` 朝鲜语（韩语）
- `zh-CN` 简体中文
- `zh-TW` 繁体中文

## 版本更新内容

### Version 1.0.0

萌翻前后端开源的首个版本

### Version 1.0.1

1. 处理一些数据处理和界面上的BUG
2. 调整需要初始化的默认配置内容，减少后只需要修改环境变量 `REACT_APP_BASE_URL` 指向您部署的后端地址。
3. 调整静态文件生成的目录结构，方便前后端联合部署。
4. 调整“创建团队”、“创建项目”页面中部分项目提交的内容。**（请配合最新版本的后端，避免出现数据格式问题！）**
5. 可配置网站标题等位置的内容，请从 `src/locales` 中查找对应词汇进行修改。

### Version 1.0.3

1. 支持设置和显示首页 HTML/CSS
2. 同时构建linux-amd64和linux-aarch64镜像。此版本起可以部署到ARM机器。

<!--
### Version 1.0.4

1. 改用vite构建。
-->
