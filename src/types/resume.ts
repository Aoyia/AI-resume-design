export type TemplateId = 'classic' | string;

// ─── 主题配置 ───────────────────────────────────────────────
export interface ResumeTheme {
  templateId: TemplateId;
  primaryColor: string;   // e.g. '#2563EB'
  fontFamily: string;     // e.g. 'Noto Serif SC'
  fontSize: number;       // 基准字号，单位 px，默认 14
  lineHeight: number;     // 行高倍数，默认 1.6
  sectionGap: number;     // 模块间距，单位 px，默认 16
}

// ─── 基本信息 ────────────────────────────────────────────────
export interface BasicInfo {
  name: string;
  jobTitle: string;       // 求职意向
  phone: string;
  email: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  avatar?: string;        // base64 或 URL
}

// ─── 教育经历 ────────────────────────────────────────────────
export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: string;         // 学历，e.g. '本科'
  startDate: string;      // 'YYYY.MM'
  endDate: string;        // 'YYYY.MM' 或 '至今'
  description?: string;   // markdown
}

// ─── 工作经历 / 项目经历（共用结构）────────────────────────
export interface ExperienceItem {
  id: string;
  company: string;        // 工作经历：公司名 | 项目经历：项目名
  position: string;       // 工作经历：职位   | 项目经历：角色/职责
  startDate: string;
  endDate: string;
  description: string;    // markdown 支持
}

// ─── 技能 ───────────────────────────────────────────────────
export interface SkillItem {
  id: string;
  category: string;       // 技能类别，e.g. '前端框架'
  content: string;        // e.g. 'React / Vue / TypeScript'
}

// ─── 自定义模块 ─────────────────────────────────────────────
export interface CustomSection {
  id: string;
  title: string;
  content: string;        // markdown
}

// ─── 荣誉奖项 ───────────────────────────────────────────────
export interface AwardItem {
  id: string;
  name: string;          // 奖项名称
  date: string;          // YYYY.MM
  description?: string;  // 简要描述
}

// ─── 证书资质 ───────────────────────────────────────────────
export interface CertificateItem {
  id: string;
  name: string;          // 证书名称
  date: string;          // YYYY.MM
}

// ─── 语言能力 ───────────────────────────────────────────────
export interface LanguageItem {
  id: string;
  name: string;          // 语言种类
  level: string;         // 等级或熟练度
}

// ─── 成果/专利/著作 ──────────────────────────────────────────
export interface PublicationItem {
  id: string;
  name: string;          // 专利/著作/论文名称
  date: string;          // YYYY.MM
  description: string;   // 详情 (Markdown)
}

// ─── 竞赛经历 ───────────────────────────────────────────────
export interface CompetitionItem {
  id: string;
  name: string;          // 竞赛名称
  date: string;          // YYYY.MM
  award: string;         // 获得奖项/名次
}

// ─── 简历全量数据 ────────────────────────────────────────────
export interface ResumeData {
  id: string;
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
}

export type SectionKey =
  | 'basicInfo'
  | 'education'
  | 'workExperience'
  | 'projects'
  | 'skills'
  | 'selfEvaluation'
  | 'customSections'
  | 'campusExperience'
  | 'honorAward'
  | 'certificate'
  | 'languageSkill'
  | 'researchPublication'
  | 'trainingExperience'
  | 'openSource'
  | 'competition';

// ─── 默认值 ─────────────────────────────────────────────────
export const DEFAULT_THEME: ResumeTheme = {
  templateId: 'classic',
  primaryColor: '#2563EB',
  fontFamily: 'Noto Serif SC',
  fontSize: 14,
  lineHeight: 1.6,
  sectionGap: 16,
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'basicInfo',
  'skills',
  'projects',
  'workExperience',
  'education',
];

export const createEmptyResume = (id = 'yang-zhong-yuan-demo-id'): ResumeData => ({
  id,
  theme: { ...DEFAULT_THEME },
  basicInfo: {
    name: '杨忠源',
    jobTitle: '前端开发工程师',
    phone: '15779736785',
    email: '2961617189@qq.com',
    location: '上海',
    website: '低代码平台开发 4 年经验 | 全日制本科',
  },
  education: [
    {
      id: 'edu-1',
      school: '华东交通大学',
      major: '软件工程',
      degree: '本科',
      startDate: '2018.09',
      endDate: '2022.07',
      description: '南昌',
    },
  ],
  workExperience: [
    {
      id: 'work-1',
      company: '上海得帆智能科技有限公司',
      position: '前端研发',
      startDate: '2022.06',
      endDate: '2026.03',
      description: '1. 负责需求评估与技术方案设计，参与团队日常需求评审与排期\n2. 日常产品需求的开发、bug修复以及性能优化\n3. 负责前端团队内工具链与组件库的开发维护\n4. 负责客户自开发方案设计',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      company: '得帆云低代码平台 ｜ 核心开发',
      position: '核心开发',
      startDate: '2022.06',
      endDate: '2026.04',
      description: '**项目简介**：\n企业级低代码应用开发平台，支持通过可视化拖拽快速搭建业务应用。平台采用微内核架构，核心包括表单引擎、规则引擎、流程引擎、插件系统等模块，前端代码规模 92 万行，服务 500+ 企业客户\n\n**技术栈**：Vue 2 + Vuex + TypeScript + Webpack + Babel + Element-UI + Vxe-Table + AntV X6\n\n**核心贡献**：\n- **设计并实现 DSL 规则引擎**：自研 Babel 插件将运算符重载，配合 BigNumber.js 实现零精度误差；通过 new Function() + 变量屏蔽隔离 window/document 实现受限执行；编译结果缓存复用，支撑 50+ 内置函数与复杂联动场景\n- **优化规则执行策略**：将「全量计算」改为「按依赖图触发」，建立字段依赖关系，结合 300ms 防抖批处理，经日志实测复杂场景**性能提升 80%**，解决客户反馈 of 3000+ 数据表单卡顿问题\n- **主导运行时性能优化**：针对钉钉消息审批场景表单打开慢的问题，通过 Performance 面板定位瓶颈，将表单配置、表单数据、业务事件三个串行请求改为 **Promise.all** 并行加载；修改缓存策略，结合 **LRU 缓存**高频接口响应，表单打开时间从 7s 降至 3.5s（↑50%）',
    },
    {
      id: 'proj-2',
      company: '得帆云低代码 aPaaS 平台 - 前端插件化架构',
      position: '架构设计 & 核心开发',
      startDate: '2024.06',
      endDate: '2024.12',
      description: '**项目简介**：\n平台服务 500+ 企业客户，不同租户需要差异化功能集合（钉钉集成、飞书集成、电子签名、数据加密等 20+ 业务模块），传统硬编码条件判断导致主包体积膨胀、功能无法热插拔。设计并实现前端插件化架构从根本上解决这一问题\n\n**技术栈**：JavaScript + Vue 2 + Rollup + IndexedDB\n\n**核心贡献**：\n- **引擎核心**：ExtensionEngine 单例统一管理插件全生命周期（install → activate → inactivate → uninstall）；每次状态变更通过 md5 签名触发响应式更新，驱动视图层自动重渲染，实现功能热插拔\n- **动态加载 + IndexedDB 缓存**：插件以独立 JS/CSS 产物形式部署，运行时动态创建 <script> 标签按需注入；引入 **IndexedDB** 作为本地缓存层，命中版本缓存时直接内联注入跳过网络请求，版本变更时自动更新缓存\n- **打包方案**：插件用 Rollup 独立打包为 UMD 产物，Vue / 平台公共库标记为 external，加载时直接复用宿主环境全局变量，避免重复打包\n- **HookManager 跨插件通信**：基于发布-订阅实现，callHook 广播并收集所有插件返回值；插件失效时自动注销订阅，避免内存泄漏\n- **栈式组件覆盖**：ComponentsManager 维护每个组件名的插件栈，后激活插件优先级更高；失效时自动弹出恢复下层组件，支持多层覆盖与无感回滚\n- **三层功能校验**：黑名单（运营全局禁用）→ 禁用状态（租户级关闭）→ 版本兼容，粒度细化到插件 → 模块 → 功能三级；后端通过响应头下发 base64 白名单，引擎自动计算差集生成黑名单',
    },
  ],
  skills: `- JavaScript 基础扎实，深入理解**原型链**、**闭包**、**Promise**、**事件循环**、**垃圾回收**等核心机制，了解 ts，能够基于 Babel AST 开发编译器插件\n- 精通 Vue 2/3 全家桶，深度掌握**响应式原理**、**虚拟 DOM** **diff 算法**、组件通信机制等\n- 熟练掌握 Webpack/Vite 构建原理与 Loader/Plugin 开发，擅长前端工程化与性能优化（DLL/SplitChunks/懒加载/缓存策略）\n- 熟悉 Performance 面板分析 and Web Vitals 核心指标（LCP/INP/CLS），有多个性能优化落地案例\n- 熟悉 **HTTP 协议**（缓存策略、跨域、SSE），了解**浏览器渲染机制**与**关键渲染路径**优化\n- 有大型前端项目工程化体系建设经验，包括 Sentry 错误监控接入、Monorepo 多包管理\n- 具备 AI 应用开发经验，熟悉 Skill、MCP、RAG、Agent`,
  selfEvaluation: '',
  customSections: [
    {
      id: 'custom-1',
      title: '工作职责与团队角色',
      content: '- 负责低代码平台规则引擎与组件化方案设计，把控前端代码质量。\n- 主导核心性能调优，为大客户定制化部署提供技术架构支持。\n- 具有良好的自驱力与团队协作精神，善于输出技术规范与分享文档。',
    },
  ],

  // 扩展程序员特色示例数据
  openSource: [
    {
      id: 'os-1',
      company: 'mini-react',
      position: 'Creator / 独立开发者',
      startDate: '2023.05',
      endDate: '2023.08',
      description: '**项目链接**：`github.com/yangzhongyuan/mini-react` (1.2k Stars)\n\n**项目简介**：一个纯 TypeScript 实现的 React 核心功能子集，包含 Fiber 架构、双阶段协调 (Reconciliation) 算法、并发更新调度器与 Hooks API 运行时。\n\n**核心贡献**：\n- 基于原生 RequestIdleCallback 实现时分渲染调度器，保证主线程大计算量更新时的 UI 帧率在 55fps 以上。\n- 自研两阶段树协调算法，深度还原 DOM Diff 中单节点、多节点复用与删除的最佳路径算法，配合单元测试覆盖 92% 的核心逻辑。'
    }
  ],
  competition: [
    {
      id: 'comp-1',
      name: 'ACM-ICPC 亚洲区域赛（上海站）',
      date: '2020.11',
      award: '银奖 (Top 5%)'
    },
    {
      id: 'comp-2',
      name: '全国大学生算法设计与编程挑战赛',
      date: '2021.05',
      award: '一等奖'
    }
  ],
  honorAward: [
    {
      id: 'honor-1',
      name: '国家奖学金',
      date: '2020.10',
      description: '专业前 1%'
    }
  ],
  languageSkill: [
    {
      id: 'lang-1',
      name: '英语',
      level: 'CET-6 580 分 ｜ 具备流畅的英文技术文档阅读与无障碍中英文邮件技术交流能力'
    }
  ],
  certificate: [
    {
      id: 'cert-1',
      name: '系统架构设计师（软考高级认证）',
      date: '2024.11'
    },
    {
      id: 'cert-2',
      name: 'AWS Certified Solutions Architect - Associate',
      date: '2025.06'
    }
  ],
  campusExperience: [
    {
      id: 'campus-1',
      company: '华东交通大学软件研发社',
      position: '会长 / 核心开发',
      startDate: '2019.09',
      endDate: '2021.06',
      description: '- 主持并筹备了社团 30 余场公开技术沙龙与前端训练营，分享前端工程化与打包原理，直接影响学生 300+ 人。\n- 带领核心开发组设计并上线学校首个失物招领系统，采用 React Native + Nest.js 架构，日活跃用户 500+'
    }
  ],
  trainingExperience: [
    {
      id: 'train-1',
      company: '极客时间 ｜ 架构设计实战营',
      position: '学员',
      startDate: '2023.09',
      endDate: '2023.12',
      description: '- 体系化学习了微服务治理（熔断、限流、注册中心）、服务网格设计与企业级高并发核心缓存系统（Redis多级缓存）方法论。\n- 独立完成期末大作业“高并发秒杀系统架构演进”，实测单节点 QPS 突破 30k 并通过答辩。'
    }
  ],
  researchPublication: [
    {
      id: 'pub-1',
      name: '一种基于 Babel AST 的低代码规则计算引擎 of 计算引擎的构建方法及装置',
      date: '2024.08',
      description: '**专利类型**：发明专利 ｜ 申请号：CN202410987654.3\n\n**详情**：\n- 本发明提供了一种能够安全隔离执行上下文，且提供高精度计算重载的规则解释引擎。本人为第一发明人，已随公司产品成功落地并服务数十个大型客户。'
    }
  ],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
});
