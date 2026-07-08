'use client';

import { useEffect, useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

/**
 * 简历双向同步系统 - 前端 RESTful HTTP 同步调度器 (无物理 DOM UI)
 * 
 * 优化与架构改进：
 * 1. 采用 Next.js API 路由 + 150ms HTTP POST 防抖写入 + 1.5 秒轻量 HTTP GET 时间戳轮询，彻底废除独立的 WebSocket。
 * 2. 只有在用户静止且磁盘上的物理修改时间 mtime 大于客户端最后同步时间时，才拉取最新内容并覆盖，完美解决打字覆盖的 Race Condition。
 * 3. 剥离了多余的右下角悬浮球渲染，将连接状态以 synced / saving / offline 映射直接驱动 Zustand Store 的全局状态，从而活化左上角原生的“草稿保存/云同步”指示器。
 */
export default function SyncServerConnector() {
  const lastSyncedDataRef = useRef<string>('');
  const lastSyncedMtimeRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 标志位：当前是否正有写入请求处于 Pending 状态
  const isWritingRef = useRef<boolean>(false);
  // 标志位：本地是否有最新的编辑尚未同步到服务端 (打字中/防抖挂起)
  const isDirtyRef = useRef<boolean>(false);

  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );
    const hasSyncParam = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).has('sync');
    
    if (!isLocalhost && !hasSyncParam) return;

    let isDestroyed = false;

    // 将内部的连通性状态映射到 Zustand 状态层
    const setGlobalSyncStatus = (status: 'connected' | 'syncing' | 'disconnected') => {
      if (isDestroyed) return;
      const mapped = 
        status === 'connected' ? 'synced' :
        status === 'syncing' ? 'saving' : 'offline';
      useResumeStore.getState().setSyncStatus(mapped);
    };

    // 拦截刷新或关闭网页的 beforeunload 监听
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current || isWritingRef.current) {
        e.preventDefault();
        e.returnValue = '简历数据正在保存至本地文件中，请稍候离开...';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // 1. 首屏加载：从服务端获取最新最权威的内容来覆盖本地草稿
    async function loadInitialData() {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const { data, mtime } = await res.json();
          const receivedDataStr = JSON.stringify(data);
          
          const currentResume = useResumeStore.getState().resume;
          
          // 如果本地内容为空，或者与服务端有真实差异，无条件以服务端为准覆盖
          if (!currentResume || !isSameResumeContent(data, currentResume)) {
            console.log('[SyncServerConnector] Initial load: Disk content differs. Overwriting local Zustand Store.');
            useResumeStore.getState().overwriteActiveResume(data);
          }
          
          lastSyncedDataRef.current = receivedDataStr;
          lastSyncedMtimeRef.current = mtime;
          setGlobalSyncStatus('connected');
        } else {
          setGlobalSyncStatus('disconnected');
        }
      } catch (err) {
        console.warn('[SyncServerConnector] Failed to fetch initial data:', err);
        setGlobalSyncStatus('disconnected');
      }
    }

    loadInitialData();

    // 2. HTTP 轮询检测 (每 1.5 秒一次)
    function startPolling() {
      if (isDestroyed) return;

      pollingTimerRef.current = setTimeout(async () => {
        // 如果本地正在发生修改（打字防抖中）或正在执行 POST 写入，直接跳过本次时间戳 check，严防打字被覆盖
        if (isDirtyRef.current || isWritingRef.current) {
          scheduleNextPolling();
          return;
        }

        try {
          const res = await fetch('/api/sync?action=check');
          if (res.ok) {
            const { mtime } = await res.json();
            setGlobalSyncStatus('connected');

            // 如果磁盘上的修改时间戳大于我们最后一次同步记录的时间戳，证明外部（如 AI）修改了文件
            if (mtime > lastSyncedMtimeRef.current) {
              console.log('[SyncServerConnector] Newer modifications found on disk. Fetching update...');
              
              const dataRes = await fetch('/api/sync');
              if (dataRes.ok) {
                const { data, mtime: newMtime } = await dataRes.json();
                const receivedDataStr = JSON.stringify(data);

                const currentResume = useResumeStore.getState().resume;
                
                // 仅在简历内容有实际不同时才覆盖
                if (currentResume && !isSameResumeContent(data, currentResume)) {
                  console.log('[SyncServerConnector] Content updated externally. Overwriting local store.');
                  useResumeStore.getState().overwriteActiveResume(data);
                  lastSyncedDataRef.current = receivedDataStr;
                }
                lastSyncedMtimeRef.current = newMtime;
              }
            }
          } else {
            setGlobalSyncStatus('disconnected');
          }
        } catch (err) {
          console.warn('[SyncServerConnector] Polling check failed:', err);
          setGlobalSyncStatus('disconnected');
        }

        scheduleNextPolling();
      }, 1500);
    }

    function scheduleNextPolling() {
      if (isDestroyed) return;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      startPolling();
    }

    startPolling();

    // 3. Zustand Store 变更订阅监听
    let lastResume = useResumeStore.getState().resume;

    const unsubscribe = useResumeStore.subscribe((state) => {
      const resume = state.resume;
      if (!resume || isDestroyed) return;

      // 3.1 简历切换保底：如果检测到简历 ID 改变（切换简历动作）
      if (lastResume && resume.id !== lastResume.id) {
        // 如果被替换的旧简历尚有未同步的修改，立刻瞬时写入磁盘，确保旧简历完美落盘
        if (isDirtyRef.current) {
          console.log('[SyncServerConnector] Switch resume detected with dirty changes. Instantly saving old resume...');
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          const oldResumeStr = JSON.stringify(lastResume);
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: oldResumeStr,
          }).catch((err) => console.warn('[SyncServerConnector] Silent save on switch failed:', err));
        }

        // 对齐为新简历的状态缓存，重置 Dirty 并将其直接置为已同步
        lastResume = resume;
        isDirtyRef.current = false;
        lastSyncedDataRef.current = JSON.stringify(resume);
        useResumeStore.getState().setSyncStatus('synced');
        return;
      }

      if (resume === lastResume) {
        return;
      }
      lastResume = resume;
      isDirtyRef.current = true;
      setGlobalSyncStatus('syncing');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 150ms 极速防抖同步，打字时仅重置定时器
      debounceTimerRef.current = setTimeout(async () => {
        const currentResume = useResumeStore.getState().resume;
        if (!currentResume || isDestroyed) return;

        const resumeStr = JSON.stringify(currentResume);
        if (resumeStr === lastSyncedDataRef.current) {
          isDirtyRef.current = false;
          setGlobalSyncStatus('connected');
          return;
        }

        // 发起 HTTP POST 写入
        isWritingRef.current = true;
        try {
          console.log('[SyncServerConnector] Syncing local changes to disk via REST API...');
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: resumeStr,
          });

          if (res.ok) {
            const { mtime } = await res.json();
            lastSyncedDataRef.current = resumeStr;
            lastSyncedMtimeRef.current = mtime;
            setGlobalSyncStatus('connected');
          } else {
            setGlobalSyncStatus('disconnected');
          }
        } catch (err) {
          console.warn('[SyncServerConnector] HTTP POST sync failed:', err);
          setGlobalSyncStatus('disconnected');
        } finally {
          isWritingRef.current = false;
          isDirtyRef.current = false;
        }
      }, 150);
    });

    return () => {
      isDestroyed = true;
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  return null;
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
