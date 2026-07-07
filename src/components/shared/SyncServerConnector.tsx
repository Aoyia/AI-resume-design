'use client';

import { useEffect, useRef, useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

/**
 * 简历双向同步系统 - 前端 WebSocket 连接器组件与状态诊断浮层
 * 
 * 优化与架构改进：
 * 1. 采用以本地磁盘文件 defaultResume.json 为主权威源的极简单向同步流。
 * 2. 将数据同步防抖时间缩短到 150ms，打字几乎无延迟瞬时同步，避免页面刷新数据丢失。
 * 3. 彻底删除不精确的系统时间戳，在 server_changed 推送到达时，只对“文字内容实际不一致”的数据触发 overwriteActiveResume，杜绝数据竞态覆盖。
 * 4. 常驻右下角极简半透明诊断悬浮球，直观指示当前的 WebSocket 状态与数据同步阶段。
 */
export default function SyncServerConnector() {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSyncedDataRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 可视化同步状态
  const [wsStatus, setWsStatus] = useState<'connected' | 'syncing' | 'disconnected'>('disconnected');

  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );
    const hasSyncParam = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).has('sync');
    
    if (!isLocalhost && !hasSyncParam) return;

    let isDestroyed = false;

    // 初始化快照
    const initialResume = useResumeStore.getState().resume;
    if (initialResume) {
      lastSyncedDataRef.current = JSON.stringify(initialResume);
    }

    function connect() {
      if (isDestroyed) return;

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      console.log('[SyncServerConnector] Connecting to ws://localhost:3001...');
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        if (isDestroyed) {
          ws.close();
          return;
        }
        console.log('[SyncServerConnector] WebSocket connected successfully.');
        setWsStatus('connected');
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (isDestroyed) return;
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'server_changed') {
            const receivedData = payload.data;
            const receivedDataStr = JSON.stringify(receivedData);

            if (receivedDataStr === lastSyncedDataRef.current) {
              return;
            }

            const currentResume = useResumeStore.getState().resume;
            
            // 1. 递归内容比对（排除 id、resumeName 和 updatedAt 影响）
            if (currentResume && isSameResumeContent(receivedData, currentResume)) {
              // 实际内容完全一致（通常是自己刚才推送写盘引起的服务端广播），仅对齐缓存并忽略覆盖
              lastSyncedDataRef.current = JSON.stringify(currentResume);
              return;
            }

            // 2. 否则说明是本地文件被外部（例如 AI）修改了，客户端直接覆盖本地页面
            console.log('[SyncServerConnector] External file change detected. Overwriting active resume on page.');
            lastSyncedDataRef.current = receivedDataStr;
            useResumeStore.getState().overwriteActiveResume(receivedData);

            const updatedResume = useResumeStore.getState().resume;
            if (updatedResume) {
              lastSyncedDataRef.current = JSON.stringify(updatedResume);
            }
          }
        } catch (err) {
          console.warn('[SyncServerConnector] Failed to process message from WebSocket server:', err);
        }
      };

      ws.onclose = () => {
        if (isDestroyed) return;
        setWsStatus('disconnected');
        console.warn('[SyncServerConnector] WebSocket disconnected. Reconnecting in 5 seconds...');
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        if (isDestroyed) return;
        console.warn('[SyncServerConnector] WebSocket connection error:', err);
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (isDestroyed || reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, 5000);
    }

    // 启动物理连接
    connect();

    let lastResume = useResumeStore.getState().resume;

    // 监听 Zustand Store 状态更改进行推送
    const unsubscribe = useResumeStore.subscribe((state) => {
      const resume = state.resume;
      if (!resume || isDestroyed) return;

      if (resume === lastResume) {
        return;
      }
      lastResume = resume;
      setWsStatus('syncing');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 150ms 极速防抖同步，打字时仅重置定时器
      debounceTimerRef.current = setTimeout(() => {
        const currentResume = useResumeStore.getState().resume;
        if (!currentResume || isDestroyed) return;

        const resumeStr = JSON.stringify(currentResume);
        if (resumeStr === lastSyncedDataRef.current) {
          setWsStatus('connected');
          return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('[SyncServerConnector] Local changes detected, syncing to server...');
          wsRef.current.send(
            JSON.stringify({
              type: 'client_changed',
              data: currentResume,
            })
          );
          lastSyncedDataRef.current = resumeStr;
          setWsStatus('connected');
        } else {
          setWsStatus('disconnected');
        }
      }, 150);
    });

    return () => {
      isDestroyed = true;
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      id="sync-diag-indicator"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(4px)',
        color: '#ffffff',
        fontSize: '11px',
        fontFamily: 'system-ui, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none',
        userSelect: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <span 
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 
            wsStatus === 'connected' ? '#10B981' : 
            wsStatus === 'syncing' ? '#F59E0B' : '#EF4444',
          boxShadow: 
            wsStatus === 'connected' ? '0 0 8px #10B981' : 
            wsStatus === 'syncing' ? '0 0 8px #F59E0B' : '0 0 8px #EF4444',
        }}
      />
      <span>
        {wsStatus === 'connected' ? 'Synced' : 
         wsStatus === 'syncing' ? 'Saving...' : 'Offline'}
      </span>
    </div>
  );
}

/**
 * 递归判断两个简历对象/数组除了 'id'、'resumeName' 和 'updatedAt' 以外的内容是否完全一致
 */
function isSameResumeContent(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  // 1. 数组类型校验
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isSameResumeContent(a[i], b[i])) return false;
    }
    return true;
  }

  // 2. 确保一个是数组而另一个不是数组时返回 false
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // 3. 普通对象类型校验
  if (typeof a === 'object') {
    // 过滤掉特定属性与值为 undefined 的属性，保证内容比对能够对齐
    const getValidKeys = (obj: any) => 
      Object.keys(obj).filter(
        (k) => k !== 'id' && k !== 'resumeName' && k !== 'updatedAt' && obj[k] !== undefined
      );

    const keysA = getValidKeys(a);
    const keysB = getValidKeys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isSameResumeContent(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}
