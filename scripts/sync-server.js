const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const FILE_PATH = path.resolve(__dirname, '../src/data/defaultResume.json');

// 锁和防抖变量
let isWriting = false;
let watchTimeout = null;
let writeUnlockTimeout = null; // 新增：全局写锁释放定时器引用

// 初始化服务器
const wss = new WebSocket.Server({ port: PORT });

console.log(`[Sync Server] Listening on port ${PORT}`);

// 读取简历数据的辅助函数
function readResumeData() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      console.error(`[Sync Server] Resume file not found at: ${FILE_PATH}`);
      return null;
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Sync Server] Error reading resume file:', error.message);
    return null;
  }
}

// 广播给所有连入的客户端
function broadcast(data, excludeWs = null) {
  try {
    const message = JSON.stringify({ type: 'server_changed', data });
    let count = 0;
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        // 增加单次发送错误处理，确保网络出现局部异常时不影响其他客户端
        client.send(message, (err) => {
          if (err) {
            console.error('[Sync Server] Broadcast send failed:', err.message);
          }
        });
        count++;
      }
    });
    console.log(`[Sync Server] Broadcasted update to ${count} client(s)`);
  } catch (e) {
    console.error('[Sync Server] Broadcast serialization failed:', e.message);
  }
}

// 保存上次读取的内容哈希/内容，防止重复广播
let lastFileContent = '';
try {
  if (fs.existsSync(FILE_PATH)) {
    lastFileContent = fs.readFileSync(FILE_PATH, 'utf-8');
  }
} catch (e) {
  console.error('[Sync Server] Failed to read initial file for caching:', e.message);
}

// 监听文件变化
const watcher = fs.watch(FILE_PATH, (eventType, filename) => {
  // 检查是否处于 isWriting 锁状态
  if (isWriting) {
    console.log('[Sync Server] File watch event ignored due to isWriting lock');
    return;
  }

  // 100ms 文件监控防抖
  if (watchTimeout) {
    clearTimeout(watchTimeout);
  }

  watchTimeout = setTimeout(() => {
    // 双重校验：如果在防抖等待的 100ms 内触发了客户端写锁，则丢弃本次 watch 触发
    if (isWriting) {
      console.log('[Sync Server] Debounced file watch execution ignored due to isWriting lock');
      return;
    }

    try {
      if (!fs.existsSync(FILE_PATH)) return;
      const currentContent = fs.readFileSync(FILE_PATH, 'utf-8');
      
      // 内容真的改变了才广播
      if (currentContent !== lastFileContent) {
        console.log('[Sync Server] File changed on disk, broadcasting...');
        lastFileContent = currentContent;
        const data = JSON.parse(currentContent);
        broadcast(data);
      } else {
        console.log('[Sync Server] File watch triggered but content is unchanged');
      }
    } catch (error) {
      console.error('[Sync Server] Error during debounced watch execution:', error.message);
    }
  }, 100);
});

// 新增：捕获监控器底层的系统级错误（防崩溃）
watcher.on('error', (error) => {
  console.error('[Sync Server] FSWatcher error:', error.message);
});

// 处理客户端连接
wss.on('connection', (ws) => {
  console.log('[Sync Server] Client connected');

  // 连接初始同步：客户端一连入，立即向其发送一次最新的简历内容
  const initialData = readResumeData();
  if (initialData) {
    ws.send(JSON.stringify({ type: 'server_changed', data: initialData }), (err) => {
      if (err) {
        console.error('[Sync Server] Failed to send initial data:', err.message);
      }
    });
    console.log('[Sync Server] Sent initial data to newly connected client');
  }

  // 监听来自客户端的消息
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'client_changed') {
        console.log('[Sync Server Trace] Received client_changed. client updatedAt:', parsed.data.updatedAt);
        
        // 启用/重置写锁，清除之前的解锁延时
        isWriting = true;
        if (writeUnlockTimeout) {
          clearTimeout(writeUnlockTimeout);
        }
        
        const newContent = JSON.stringify(parsed.data, null, 2);
        
        // 覆写本地 defaultResume.json
        fs.writeFileSync(FILE_PATH, newContent, 'utf-8');
        
        // 更新缓存以防 watch 比较失效
        lastFileContent = newContent;
        
        const stats = fs.statSync(FILE_PATH);
        console.log('[Sync Server Trace] Successfully wrote client_changed data to disk. File mtimeMs:', Math.floor(stats.mtimeMs));
        
        // 广播给其他客户端，排除当前客户端
        broadcast(parsed.data, ws);

        // 延迟 200ms 后释放锁，全局统一管理
        writeUnlockTimeout = setTimeout(() => {
          isWriting = false;
          writeUnlockTimeout = null;
          console.log('[Sync Server] isWriting lock released');
        }, 200);
      }
    } catch (error) {
      console.error('[Sync Server] Error processing client message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('[Sync Server] Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('[Sync Server] WebSocket client error:', err.message);
    // 发生网络错误时，强制断开并销毁客户端套接字以释放系统资源
    try {
      ws.terminate();
    } catch (e) {}
  });
});

wss.on('error', (err) => {
  console.error('[Sync Server] Server error:', err.message);
});

// 优雅退出处理
const cleanup = () => {
  console.log('[Sync Server] Shutting down gracefully...');
  try {
    watcher.close();
    wss.close(() => {
      console.log('[Sync Server] Server closed');
      process.exit(0);
    });
  } catch (e) {
    process.exit(0);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
