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

// 用于存储连接的客户端分组
const clientGroups = new Map();

// 监听WebSocket连接事件
wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);

  // 监听接收到消息事件
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const data = message.utf8Data;

      // 在这里处理接收到的消息
      // 根据你的需求进行相应的操作

      // 假设接收到的是独一无二的字符串
      const uniqueString = data;

      // 检查独一无二的字符串是否存在于客户端分组中，如果不存在则初始化为空数组
      if (!clientGroups.has(uniqueString)) {
        clientGroups.set(uniqueString, []);
      }

      // 获取当前独一无二字符串对应的客户端分组
      const group = clientGroups.get(uniqueString);

      // 将连接的客户端添加到分组中
      group.push(connection);

      // 发送当前分组连接人数给客户端
      const currentCount = group.length;
      connection.sendUTF(currentCount.toString());

      // 更新其他分组的连接人数
      clientGroups.forEach((clients) => {
        const count = clients.length;
        clients.forEach((client) => {
          client.sendUTF(count.toString());
        });
      });
    }
  });

  // 监听客户端关闭连接事件
  connection.on('close', () => {
    // 从分组中移除关闭的客户端
    clientGroups.forEach((clients, uniqueString) => {
      const index = clients.indexOf(connection);
      if (index !== -1) {
        clients.splice(index, 1);

        // 更新分组的连接人数
        const count = clients.length;
        clients.forEach((client) => {
          client.sendUTF(count.toString());
        });
      }
    });
  });
});