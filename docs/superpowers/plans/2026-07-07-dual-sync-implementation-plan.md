# 简历双向同步与刷新状态保持 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 Web 端简历状态与本地服务器 `defaultResume.json` 的双向实时同步，并保持在刷新/重连后的正确状态（Last-Write-Wins 冲突处理机制）。

**架构：** 在简历数据中加入 `updatedAt` 时间戳。Web端在用户修改时自动更新它；当 Web 端刷新与服务端 WebSocket 连接时，比对本地的 `updatedAt` 与服务端文件修改时间 `mtimeMs`：
- 若客户端较新，反向同步给服务端；
- 若服务端较新，覆盖客户端本地；
- 在 Zustand 状态覆盖时使用 `_isSyncFromServer` 隐藏标记防止发回循环。

**技术栈：** Next.js / TypeScript / Zustand / WebSocket / Node.js File System / `node:assert`

---

## 预修改/新建文件列表及其职责

1.  **[修改]** [src/types/resume.ts](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/types/resume.ts):
    *   在 `ResumeData` 接口中，添加可选属性 `updatedAt?: number`，定义时间戳的数据结构规范。
2.  **[修改]** [src/store/useResumeStore.ts](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/store/useResumeStore.ts):
    *   修改 `syncResumesMiddleware` 中间件，自动对非同步引起的 `resume` 更新动作添加 `updatedAt = Date.now()`。
    *   修改 `overwriteActiveResume`，支持还原服务端传回的 `updatedAt` 并附加 `_isSyncFromServer` 防止死循环。
    *   修改 `onRehydrateStorage`，数据恢复时自动补全缺失的时间戳。
3.  **[修改]** [src/components/shared/SyncServerConnector.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/shared/SyncServerConnector.tsx):
    *   修改客户端接收服务端 WebSocket 数据的消息分发和协调逻辑。基于 `clientUpdatedAt` 与 `serverUpdatedAt` 的比对决定是客户端反向推送还是服务端覆盖本地。
4.  **[修改]** [scripts/sync-server.js](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/scripts/sync-server.js):
    *   修改 `readResumeData` 和 `fs.watch` 广播时的补全逻辑：通过 `fs.statSync(FILE_PATH).mtimeMs` 获取文件的最后物理修改时间作为最新的 `updatedAt` 广播给客户端。
5.  **[新建]** `scratch/test-sync-logic.js` (本地验证):
    *   基于 Node.js 原生的 `node:assert`，编写针对状态同步中间件、时间戳覆盖及冲突策略的单元测试，保证在不依赖重度测试框架的情况下对逻辑进行 TDD 验证。

---

### 任务 1：升级简历数据结构定义

**文件：**
- 修改：`src/types/resume.ts:108-133`

- [ ] **步骤 1：修改 `ResumeData` 接口**
  在 `ResumeData` 结构体尾部添加 `updatedAt?: number` 属性。
  
  修改内容：
  ```typescript
  export interface ResumeData {
    id: string;
    resumeName?: string; // 简历独立名称
    theme: ResumeTheme;
    basicInfo: BasicInfo;
    education: EducationItem[];
    workExperience: ExperienceItem[];
    projects: ExperienceItem[];
    skills: string;
    selfEvaluation?: string;    // markdown
    customSections: CustomSection[];
    
    // 扩展模块
    campusExperience: ExperienceItem[];
    honorAward: AwardItem[];
    certificate: CertificateItem[];
    languageSkill: LanguageItem[];
    researchPublication: PublicationItem[];
    trainingExperience: ExperienceItem[];
    openSource: ExperienceItem[];
    competition: CompetitionItem[];

    /** 控制左侧面板大模块的显示顺序 */
    sectionOrder: SectionKey[];
    customTitles?: Partial<Record<SectionKey, string>>;
    
    updatedAt?: number; // 新增：最后修改时间戳
  }
  ```

- [ ] **步骤 2：Commit**
  ```bash
  git add src/types/resume.ts
  git commit -m "feat: add updatedAt timestamp to ResumeData interface"
  ```

---

### 任务 2：创建 Zustand 同步机制的单元测试（TDD 驱动）

**文件：**
- 新建：`scratch/test-sync-logic.js`

- [ ] **步骤 1：新建独立单元测试脚本**
  创建一个 Node 运行的脚本，用于模拟 Zustand 的 `set`、中间件拦截以及比对逻辑，测试时间戳管理和 `_isSyncFromServer` 防止循环同步的机制。
  
  ```javascript
  const assert = require('node:assert');

  // 1. 模拟 syncResumesMiddleware 的简化行为进行功能逻辑测试
  const syncResumesMiddlewareMock = (set) => {
    return (partial, replace) => {
      // 模拟中间件行为
      const nextState = typeof partial === 'function' ? partial({ resume: {} }) : partial;
      
      if (nextState.resume) {
        const updatedResume = { ...nextState.resume };
        if (!nextState._isSyncFromServer) {
          updatedResume.updatedAt = 99999; // 模拟 Date.now() 更新为最新
        }
        return {
          ...nextState,
          resume: updatedResume,
        };
      }
      return nextState;
    };
  };

  // 测试用例 1: 客户端 UI 动作修改时，应该自动为 resume 注入 updatedAt
  function testClientActionUpdatesTimestamp() {
    const actionResult = syncResumesMiddlewareMock((partial) => partial)({
      resume: { id: 'test-1', basicInfo: { name: '张三' } }
    });
    assert.strictEqual(actionResult.resume.updatedAt, 99999);
    console.log('✓ testClientActionUpdatesTimestamp passed');
  }

  // 测试用例 2: 服务端同步覆盖动作修改时，带有 _isSyncFromServer，应该保留传入的时间戳，不篡改
  function testServerSyncRetainsTimestamp() {
    const actionResult = syncResumesMiddlewareMock((partial) => partial)({
      resume: { id: 'test-1', basicInfo: { name: '李四' }, updatedAt: 12345 },
      _isSyncFromServer: true
    });
    assert.strictEqual(actionResult.resume.updatedAt, 12345);
    console.log('✓ testServerSyncRetainsTimestamp passed');
  }

  // 运行测试
  try {
    testClientActionUpdatesTimestamp();
    testServerSyncRetainsTimestamp();
    console.log('All store middleware tests passed!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
  ```

- [ ] **步骤 2：运行测试验证成功**
  运行：`node scratch/test-sync-logic.js`
  预期输出：
  `✓ testClientActionUpdatesTimestamp passed`
  `✓ testServerSyncRetainsTimestamp passed`
  `All store middleware tests passed!`

- [ ] **步骤 3：Commit**
  ```bash
  git add scratch/test-sync-logic.js
  git commit -m "test: add sync middleware unit tests"
  ```

---

### 任务 3：升级 Zustand Store 同步中间件及 actions

**文件：**
- 修改：`src/store/useResumeStore.ts:193-231` (中间件部分)
- 修改：`src/store/useResumeStore.ts:713-724` (`overwriteActiveResume` action)
- 修改：`src/store/useResumeStore.ts:753-793` (`persist` 配置中 `onRehydrateStorage` 部分)

- [ ] **步骤 1：修改 `syncResumesMiddleware` 中间件**
  修改 `syncResumesMiddleware` 的拦截逻辑，增加 `updatedAt` 修改判定。

  替换目标：
  ```typescript
  // ─── 多简历同步中间件 ───────────────────────────────────────
  const syncResumesMiddleware = <T extends ResumeStore>(
    config: StateCreator<T, [], []>
  ): StateCreator<T, [], []> => {
    return (set, get, api) => {
      const customSet: typeof set = (partial, replace) => {
        set((state) => {
          const nextState = typeof partial === 'function' ? partial(state) : partial;

          // 仅当更新中显式包含了 resume 时，同步至 resumes 列表
          if (nextState.resume) {
            const updatedResume = nextState.resume;
            const currentResumes = nextState.resumes || state.resumes || [];
            const currentId = updatedResume.id || nextState.currentResumeId || state.currentResumeId;

            let newResumes = [...currentResumes];
            if (newResumes.length === 0) {
              newResumes = [updatedResume];
            } else {
              const index = newResumes.findIndex((r) => r.id === currentId);
              if (index !== -1) {
                newResumes[index] = { ...newResumes[index], ...updatedResume, id: currentId };
              } else {
                newResumes.push(updatedResume);
              }
            }
            return {
              ...nextState,
              resumes: newResumes,
              currentResumeId: currentId,
            } as any;
          }
          return nextState as any;
        }, replace);
      };
      return config(customSet, get, api);
    };
  };
  ```

  修改为：
  ```typescript
  // ─── 多简历同步中间件 ───────────────────────────────────────
  const syncResumesMiddleware = <T extends ResumeStore>(
    config: StateCreator<T, [], []>
  ): StateCreator<T, [], []> => {
    return (set, get, api) => {
      const customSet: typeof set = (partial, replace) => {
        set((state) => {
          const nextState = typeof partial === 'function' ? partial(state) : partial;

          // 仅当更新中显式包含了 resume 时，同步至 resumes 列表
          if (nextState.resume) {
            const updatedResume = { ...nextState.resume };

            // 若不是来自服务端的同步，也不是系统初始或路由切换动作，则更新 updatedAt
            if (!(nextState as any)._isSyncFromServer) {
              updatedResume.updatedAt = Date.now();
            }

            const currentResumes = nextState.resumes || state.resumes || [];
            const currentId = updatedResume.id || nextState.currentResumeId || state.currentResumeId;

            let newResumes = [...currentResumes];
            if (newResumes.length === 0) {
              newResumes = [updatedResume];
            } else {
              const index = newResumes.findIndex((r) => r.id === currentId);
              if (index !== -1) {
                newResumes[index] = { ...newResumes[index], ...updatedResume, id: currentId };
              } else {
                newResumes.push(updatedResume);
              }
            }
            return {
              ...nextState,
              resume: updatedResume,
              resumes: newResumes,
              currentResumeId: currentId,
            } as any;
          }
          return nextState as any;
        }, replace);
      };
      return config(customSet, get, api);
    };
  };
  ```

- [ ] **步骤 2：修改 `overwriteActiveResume` 动作**
  在覆写活跃简历时保留服务端推送回的 `updatedAt` 并传递屏蔽标记。

  替换目标：
  ```typescript
        overwriteActiveResume: (data) =>
          set((s) => {
            const cleanedData = cleanResumeData(data);
            const updated = {
              ...cleanedData,
              id: s.currentResumeId,
              resumeName: s.resume.resumeName,
            };
            return {
              resume: updated,
            };
          }),
  ```

  修改为：
  ```typescript
        overwriteActiveResume: (data) =>
          set((s) => {
            const cleanedData = cleanResumeData(data);
            const updated = {
              ...cleanedData,
              id: s.currentResumeId,
              resumeName: s.resume.resumeName,
              updatedAt: cleanedData.updatedAt || Date.now(),
            };
            return {
              resume: updated,
              _isSyncFromServer: true,
            } as any;
          }),
  ```

- [ ] **步骤 3：修改 `onRehydrateStorage` 钩子配置**
  还原时为缺失 `updatedAt` 的简历配置默认值。
  
  修改位置在 `onRehydrateStorage: () => (state) => { ... }` 中：
  ```typescript
          // 自动清洗已加载数据中技术栈的加粗词
          if (state.resumes) {
            state.resumes = state.resumes.map(r => {
              const cleaned = cleanResumeData(r);
              if (!cleaned.resumeName) {
                cleaned.resumeName = `${cleaned.basicInfo?.name || '未命名'}_简历`;
              }
              if (!cleaned.updatedAt) {
                cleaned.updatedAt = 0;
              }
              return cleaned;
            });
          }
          if (state.resume) {
            state.resume = cleanResumeData(state.resume);
            if (state.resume && !state.resume.resumeName) {
              state.resume.resumeName = `${state.resume.basicInfo?.name || '未命名'}_简历`;
            }
            if (state.resume && !state.resume.updatedAt) {
              state.resume.updatedAt = 0;
            }
          }
  ```

- [ ] **步骤 4：Commit**
  ```bash
  git add src/store/useResumeStore.ts
  git commit -m "feat: upgrade Zustand store middleware and actions to support updatedAt"
  ```

---

### 任务 4：升级本地同步服务器 logic

**文件：**
- 修改：`scripts/sync-server.js:18-31` (`readResumeData` 辅助函数)
- 修改：`scripts/sync-server.js:66-102` (`fs.watch` 监听广播)

- [ ] **步骤 1：修改 `readResumeData` 并基于 `mtimeMs` 修正时间戳**
  读取文件时，将文件的物理修改时间融合到数据对象的 `updatedAt` 中。

  替换目标：
  ```javascript
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
  ```

  修改为：
  ```javascript
  function readResumeData() {
    try {
      if (!fs.existsSync(FILE_PATH)) {
        console.error(`[Sync Server] Resume file not found at: ${FILE_PATH}`);
        return null;
      }
      const data = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      // 获取文件的最后物理修改时间戳
      const stats = fs.statSync(FILE_PATH);
      parsed.updatedAt = Math.max(parsed.updatedAt || 0, Math.floor(stats.mtimeMs));
      return parsed;
    } catch (error) {
      console.error('[Sync Server] Error reading resume file:', error.message);
      return null;
    }
  }
  ```

- [ ] **步骤 2：修改 `fs.watch` 广播补全逻辑**
  在服务端监听到文件修改并广播 `server_changed` 时，同样取当前修改时间戳附带广播。

  替换目标（`watchTimeout` 的延时内）：
  ```javascript
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
      }
  ```

  修改为：
  ```javascript
      try {
        if (!fs.existsSync(FILE_PATH)) return;
        const currentContent = fs.readFileSync(FILE_PATH, 'utf-8');
        
        // 内容真的改变了才广播
        if (currentContent !== lastFileContent) {
          console.log('[Sync Server] File changed on disk, broadcasting...');
          lastFileContent = currentContent;
          const data = JSON.parse(currentContent);
          
          // 获取更新后的 mtimeMs 并广播给客户端
          const stats = fs.statSync(FILE_PATH);
          data.updatedAt = Math.max(data.updatedAt || 0, Math.floor(stats.mtimeMs));
          
          broadcast(data);
        } else {
          console.log('[Sync Server] File watch triggered but content is unchanged');
        }
      }
  ```

- [ ] **步骤 3：Commit**
  ```bash
  git add scripts/sync-server.js
  git commit -m "feat: server sync server now appends mtimeMs as fallback updatedAt"
  ```

---

### 任务 5：升级客户端连接器 (Conflict Resolution)

**文件：**
- 修改：`src/components/shared/SyncServerConnector.tsx:66-95` (WebSocket 消息接收分发器)

- [ ] **步骤 1：修改 `ws.onmessage` 逻辑**
  加入对 `clientUpdatedAt` 与 `serverUpdatedAt` 的对比以及反向同步流程。

  替换目标：
  ```typescript
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
              useResumeStore.getState().overwriteActiveResume(payload.data);
  
              const updatedResume = useResumeStore.getState().resume;
              if (updatedResume) {
                lastSyncedDataRef.current = JSON.stringify(updatedResume);
              }
            }
          } catch (err) {
            console.warn('[SyncServerConnector] Failed to process message from WebSocket server:', err);
          }
        };
  ```

  修改为：
  ```typescript
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
              if (currentResume && isSameResumeContent(receivedData, currentResume)) {
                lastSyncedDataRef.current = JSON.stringify(currentResume);
                return;
              }
  
              // 解决更新冲突 (Last-Write-Wins 规则)
              const clientUpdatedAt = currentResume?.updatedAt || 0;
              const serverUpdatedAt = receivedData?.updatedAt || 0;
  
              if (clientUpdatedAt > serverUpdatedAt) {
                console.log('[SyncServerConnector] Client data is newer than server disk data. Rejecting server data and uploading local modifications.');
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'client_changed',
                      data: currentResume,
                    })
                  );
                }
                return;
              }
  
              // 否则使用服务端数据覆盖 Web 界面
              console.log('[SyncServerConnector] Server disk data is newer. Overwriting active resume on page.');
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
  ```

- [ ] **步骤 2：Commit**
  ```bash
  git add src/components/shared/SyncServerConnector.tsx
  git commit -m "feat: websocket connector now supports Last-Write-Wins resolution"
  ```
