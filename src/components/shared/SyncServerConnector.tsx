'use client';

import { useEffect, useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

/**
 * 简历双向同步系统 - 前端 RESTful HTTP 同步调度器 (无物理 DOM UI)
 * 
 * 优化与架构改进：
 * 1. 采用 Next.js API 路由 + 150ms HTTP POST 防抖写入 + 1.5 秒 light-weight HTTP GET 时间戳轮询，彻底废除独立的 WebSocket。
 * 2. 只有在用户静止（Synced 状态）且磁盘上的物理修改时间 mtime 大于客户端最后同步时间时，才拉取最新内容并覆盖，完美解决打字覆盖的 Race Condition。
 * 3. [Fail-Safe 双保险]：
 *    - 版本号对齐 (Version LWW)：引入 version 自增版本。首屏加载若 clientVersion > serverVersion，拒绝被旧磁盘数据覆盖，主动向服务端 POST 同步；
 *    - 临终同步守卫 (Unload Guardian)：绑定 beforeunload 挂载。在刷新/关闭浏览器且本地有脏数据未写入时，使用 fetch keepalive: true 强制在后台完成最后一次写盘。
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

    // 辅助同步函数
    async function syncToDisk(resumeData: any) {
      isWritingRef.current = true;
      try {
        console.log('[SyncServerConnector] Syncing local changes to disk via REST API...');
        const resumeStr = JSON.stringify(resumeData);
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
    }

    // 1. 首屏加载：从服务端获取最新最权威的内容来覆盖本地草稿
    async function loadInitialData() {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const { data, mtime } = await res.json();
          const receivedDataStr = JSON.stringify(data);
          
          const currentResume = useResumeStore.getState().resume;
          const clientVersion = currentResume?.version || 0;
          const serverVersion = data?.version || 0;

          if (clientVersion > serverVersion) {
            // 客户端版本更新，说明可能在防抖内刷新了页面，或者离线做了修改还没来得及发。
            // 此时拒绝用服务端旧的覆盖本地，而是主动把本地数据 POST 过去。
            console.log(`[SyncServerConnector] Initial load check: clientVersion (${clientVersion}) > serverVersion (${serverVersion}). Syncing local to disk.`);
            await syncToDisk(currentResume);
          } else {
            // 服务端版本更新，或者版本一致但文字内容发生实际变化，覆盖本地
            if (!currentResume || !isSameResumeContent(data, currentResume)) {
              console.log('[SyncServerConnector] Initial load: Disk content differs. Overwriting local Zustand Store.');
              useResumeStore.getState().overwriteActiveResume(data);
            }
            lastSyncedDataRef.current = receivedDataStr;
            lastSyncedMtimeRef.current = mtime;
            setGlobalSyncStatus('connected');
          }
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

        await syncToDisk(currentResume);
      }, 150);
    });

    // 4. [Fail-Safe] Unload 临终同步守卫：监听刷新与关闭动作
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        const currentResume = useResumeStore.getState().resume;
        if (currentResume) {
          // 使用 keepalive: true 发送 POST 请求，确保即使页面在几毫秒内销毁，请求也会在系统底层后台被安全发送和写盘
          console.log('[SyncServerConnector] Beforeunload: triggers keepalive push to save final changes.');
          fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentResume),
            keepalive: true,
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

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
 * 递归判断两个简历对象/数组除了 'id'、'resumeName'、'updatedAt' 和 'version' 以外的内容是否完全一致
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
        (k) => k !== 'id' && k !== 'resumeName' && k !== 'updatedAt' && k !== 'version' && obj[k] !== undefined
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
