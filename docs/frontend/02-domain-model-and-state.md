# 领域模型与状态设计

## 共享数据模型

前后端统一使用 `src/shared/resume/types.ts` 和 `src/shared/resume/schema.ts` 作为单一事实来源。

```ts
export type TemplateId = 'default';

export type SectionKey =
  | 'education'
  | 'work'
  | 'projects'
  | 'skills'
  | 'summary';

export interface ResumeData {
  meta: {
    draftId: string;
    version: number;
    updatedAt: string;
    locale: 'zh-CN';
  };
  theme: {
    templateId: TemplateId;
    primaryColor: string;
    headingScale: number;
    bodyScale: number;
    lineHeight: number;
    sectionGap: number;
    pagePadding: number;
  };
  basics: {
    fullName: string;
    headline: string;
    phone: string;
    email: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
  };
  sectionOrder: SectionKey[];
  sections: {
    education: EducationItem[];
    work: WorkItem[];
    projects: ProjectItem[];
    skills: SkillGroup[];
    summary: SummarySection;
  };
}

export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

export interface WorkItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  techStack: string;
  description: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  items: string[];
}

export interface SummarySection {
  title: string;
  content: string;
}
```

## 字段约束

| 字段 | 规则 |
| --- | --- |
| `fullName` | 必填，1 到 20 字 |
| `phone` | 允许空，填写时按手机号或国际号码校验 |
| `email` | 允许空，填写时按邮箱格式校验 |
| `headline` | 建议不超过 30 字 |
| `description` | Markdown 原文存储，后端不保存 HTML |
| `startDate/endDate` | 统一使用 `YYYY-MM` 格式，进行字符串级比较 |
| `sectionOrder` | 必须覆盖全部大模块且不重复 |
| `theme.primaryColor` | 只允许十六进制颜色值 |

## 默认数据

`src/shared/resume/defaults.ts` 必须提供：

- 空白简历默认值 `createEmptyResume()`
- 演示模板默认值 `createDemoResume()`
- 各类新增条目的工厂函数 `createEducationItem()`、`createWorkItem()` 等

新增列表项时只能调用工厂函数，不能在组件里手写对象，避免漏字段。

## Store 拆分

统一使用一个主 store `editor-store.ts`，内部按逻辑切 slice，不额外分多个 Zustand store，防止联动复杂。

### 状态结构

```ts
interface EditorStoreState {
  resume: ResumeData;
  auth: {
    isAuthenticated: boolean;
    username: string | null;
    checked: boolean;
  };
  ui: {
    activeSection: SectionKey | null;
    expandedSections: SectionKey[];
    isLoginModalOpen: boolean;
    isExporting: boolean;
    previewScale: number;
  };
  sync: {
    status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
    lastSyncedAt: string | null;
    lastError: string | null;
  };
}
```

### Action 列表

```ts
interface EditorStoreActions {
  hydrateResume(resume: ResumeData): void;
  resetResume(): void;
  updateBasics<K extends keyof ResumeData['basics']>(
    field: K,
    value: ResumeData['basics'][K],
  ): void;
  updateTheme(patch: Partial<ResumeData['theme']>): void;
  updateSummary(content: string): void;
  addSectionItem(section: 'education' | 'work' | 'projects' | 'skills'): void;
  updateSectionItem(
    section: 'education' | 'work' | 'projects',
    id: string,
    patch: Record<string, string>,
  ): void;
  updateSkillGroup(id: string, patch: Partial<SkillGroup>): void;
  removeSectionItem(section: 'education' | 'work' | 'projects' | 'skills', id: string): void;
  reorderSectionBlocks(active: SectionKey, over: SectionKey): void;
  reorderSectionItems(section: 'education' | 'work' | 'projects' | 'skills', activeId: string, overId: string): void;
  setExpandedSections(keys: SectionKey[]): void;
  setLoginModalOpen(open: boolean): void;
  setExporting(exporting: boolean): void;
  setAuthState(payload: { isAuthenticated: boolean; username: string | null; checked: boolean }): void;
  setSyncState(patch: Partial<EditorStoreState['sync']>): void;
}
```

## 持久化策略

### 本地持久化

- 使用 Zustand `persist` 中间件。
- localStorage key 固定为 `resume_local_draft_v1`。
- 仅持久化 `resume`、`expandedSections`、`previewScale`。
- `auth` 与 `sync` 不持久化，避免过期状态污染界面。

### 云端同步

- 仅在 `auth.isAuthenticated === true` 时开启。
- 所有对 `resume` 的写操作都将 `sync.status` 标记为 `dirty`。
- `useResumeAutoSync` hook 监听 `dirty` 状态，在 `1200ms` debounce 后调用 `PUT /api/resume/draft`。
- 服务端返回成功后更新 `resume.meta.version` 和 `resume.meta.updatedAt`。

## 选择器

需要在 `src/store/selectors.ts` 提供稳定选择器，避免整个页面无谓重渲染。

建议至少提供：

- `selectBasics`
- `selectTheme`
- `selectSectionOrder`
- `selectSectionItems(sectionKey)`
- `selectAuth`
- `selectSyncState`
- `selectPreviewScale`

## 冲突处理

MVP 不做多人协作，但要处理本地草稿和云端草稿的优先级。

- 首次登录成功后主动拉取服务端草稿。
- 若服务端 `updatedAt` 晚于本地，则弹出一次确认框，允许用户选择“保留本地”或“覆盖为云端”。
- 若用户选择保留本地，则立即执行一次上传覆盖云端。

## 性能约束

- Store action 内只做纯数据变换，不做异步请求。
- Markdown 渲染和分页计算放在组件层或 hook 层，不放入 Zustand。
- 大列表项更新使用基于 `id` 的 patch 更新，禁止全量深拷贝整个 `resume`。
