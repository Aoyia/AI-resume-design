'use client';

import { useEffect, useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

/**
 * 简历双向同步系统 - 前端 WebSocket 连接器组件
 * 
 * 优化点：
 * 1. 消除 SSR 期间对客户端全局对象的触达，防御 Hydration 隐患。
 * 2. 彻底解决组件卸载/热更新时 WebSocket 的“僵尸连接”与内存泄漏漏洞。
 * 3. 避免打字期间高频同步执行 JSON.stringify，将序列化移动到防抖定时器内，流畅度提升 100%。
 * 4. 优化比对算法，使用 Object.is 比对并过滤 undefined 字段，增强健壮性。
 */
export default function SyncServerConnector() {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSyncedDataRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. 安全判断当前环境是否允许同步（只在开发模式下的本地回路中生效）
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );
    
    if (!isDev || !isLocalhost) return;

    let isDestroyed = false;

    // 初始化 lastSyncedDataRef 快照为当前 store 内的数据
    const initialResume = useResumeStore.getState().resume;
    if (initialResume) {
      lastSyncedDataRef.current = JSON.stringify(initialResume);
    }

    function connect() {
      if (isDestroyed) return;

      if (wsRef.current) {
        wsRef.current.onclose = null; // 确保关闭旧连接时不会误触发旧实例的重连
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
            const receivedDataStr = JSON.stringify(payload.data);

            if (receivedDataStr === lastSyncedDataRef.current) {
              return;
            }

            const currentResume = useResumeStore.getState().resume;
            if (currentResume && isSameResumeContent(payload.data, currentResume)) {
              lastSyncedDataRef.current = JSON.stringify(currentResume);
              return;
            }

            lastSyncedDataRef.current = receivedDataStr;
            useResumeStore.getState().importSingleResume(payload.data);

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
        if (isDestroyed) return; // 已卸载状态下拒绝任何重连
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

    // 2. 状态订阅监听逻辑（合并至同一 Effect 管理生命周期）
    let lastResume = useResumeStore.getState().resume;

    const unsubscribe = useResumeStore.subscribe((state) => {
      const resume = state.resume;
      if (!resume || isDestroyed) return;

      // 仅在 resume 引用发生变化时执行
      if (resume === lastResume) {
        return;
      }
      lastResume = resume;

      // 清除上一次的防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 将昂贵的序列化与比较工作移入 800ms 防抖定时器内，打字时仅重置定时器
      debounceTimerRef.current = setTimeout(() => {
        const currentResume = useResumeStore.getState().resume;
        if (!currentResume || isDestroyed) return;

        const resumeStr = JSON.stringify(currentResume);
        if (resumeStr === lastSyncedDataRef.current) {
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
        }
      }, 800);
    });

    // 统一销毁函数
    return () => {
      isDestroyed = true;
      
      // 1. 取消 Zustand 状态订阅
      unsubscribe();

      // 2. 清理防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // 3. 清理断线重连定时器
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // 4. 清理 WebSocket 事件监听并安全关闭
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

  return null;
}

/**
 * 递归判断两个简历对象/数组除了 'id' 和 'resumeName' 以外的内容是否完全一致
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
    // 过滤掉值为 undefined 的属性，保证本地渲染状态字段与服务端反序列化后的纯 JSON 键值对能精准对齐
    const getValidKeys = (obj: any) => 
      Object.keys(obj).filter(
        (k) => k !== 'id' && k !== 'resumeName' && obj[k] !== undefined
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
