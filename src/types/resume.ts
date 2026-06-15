import defaultResumeData from '@/data/defaultResume.json';

export type TemplateId = 'classic' | string;

// ─── 主题配置 ───────────────────────────────────────────────
export interface ResumeTheme {
  templateId: TemplateId;
  primaryColor: string;   // e.g. '#2563EB'
  fontFamily: string;     // e.g. 'Noto Serif SC'
  fontSize: number;       // 基准字号，单位 px，默认 14
  lineHeight: number;     // 行高倍数，默认 1.6
  sectionGap: number;     // 模块间距，单位 px，默认 16
  
  // 新增属性
  dividerStyle?: 'solid' | 'left-bar' | 'skew-block' | 'light-line' | 'watermark-bar' | 'none';
  dividerHeight?: number;                       // 装饰线粗细/宽度
  enableTitleBg?: boolean;                    // 是否开启标题底色
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
  primaryColor: '#7C3AED',
  fontFamily: 'Noto Sans SC',
  fontSize: 14,
  lineHeight: 1.6,
  sectionGap: 16,
  dividerStyle: 'left-bar',
  dividerHeight: 4,
  enableTitleBg: true,
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'basicInfo',
  'skills',
  'projects',
  'workExperience',
  'education',
];

export const createEmptyResume = (id = 'yang-zhong-yuan-demo-id'): ResumeData => ({
  ...(defaultResumeData as any),
  id,
});
