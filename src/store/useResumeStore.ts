'use client';

import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ResumeData,
  ResumeTheme,
  BasicInfo,
  EducationItem,
  ExperienceItem,
  SkillItem,
  CustomSection,
  SectionKey,
  createEmptyResume,
  AwardItem,
  CertificateItem,
  LanguageItem,
  CompetitionItem,
  PublicationItem,
} from '@/types/resume';
import { uid } from '@/lib/utils';

// ─── Store 接口定义 ────────────────────────────────────────
interface ResumeStore {
  resume: ResumeData;
  resumes: ResumeData[];
  currentResumeId: string;
  pages: number[][];
  setPages: (pages: number[][]) => void;
  switchResume: (id: string) => void;
  createResume: (name?: string) => void;
  deleteResume: (id: string) => void;
  renameResume: (id: string, name: string) => void;
  importSingleResume: (data: ResumeData) => void;
  importBackupPackage: (resumes: ResumeData[], override: boolean) => void;

  // 主题
  updateTheme: (patch: Partial<ResumeTheme>) => void;

  // 基本信息
  updateBasicInfo: (patch: Partial<BasicInfo>) => void;

  // 教育经历
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (orderedIds: string[]) => void;

  // 工作经历
  addWorkExperience: () => void;
  updateWorkExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeWorkExperience: (id: string) => void;
  reorderWorkExperience: (orderedIds: string[]) => void;

  // 项目经历
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ExperienceItem>) => void;
  removeProject: (id: string) => void;
  reorderProjects: (orderedIds: string[]) => void;

  // 技能
  updateSkills: (text: string) => void;

  // 自我评价
  updateSelfEvaluation: (text: string) => void;

  // 自定义模块
  addCustomSection: () => void;
  updateCustomSection: (id: string, patch: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;

  // 校园经历
  addCampusExperience: () => void;
  updateCampusExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeCampusExperience: (id: string) => void;
  reorderCampusExperience: (orderedIds: string[]) => void;

  // 培训经历
  addTrainingExperience: () => void;
  updateTrainingExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeTrainingExperience: (id: string) => void;
  reorderTrainingExperience: (orderedIds: string[]) => void;

  // 开源项目
  addOpenSource: () => void;
  updateOpenSource: (id: string, patch: Partial<ExperienceItem>) => void;
  removeOpenSource: (id: string) => void;
  reorderOpenSource: (orderedIds: string[]) => void;

  // 荣誉奖项
  addHonorAward: () => void;
  updateHonorAward: (id: string, patch: Partial<AwardItem>) => void;
  removeHonorAward: (id: string) => void;

  // 证书资质
  addCertificate: () => void;
  updateCertificate: (id: string, patch: Partial<CertificateItem>) => void;
  removeCertificate: (id: string) => void;

  // 语言能力
  addLanguageSkill: () => void;
  updateLanguageSkill: (id: string, patch: Partial<LanguageItem>) => void;
  removeLanguageSkill: (id: string) => void;

  // 竞赛经历
  addCompetition: () => void;
  updateCompetition: (id: string, patch: Partial<CompetitionItem>) => void;
  removeCompetition: (id: string) => void;

  // 专利/著作/论文
  addResearchPublication: () => void;
  updateResearchPublication: (id: string, patch: Partial<PublicationItem>) => void;
  removeResearchPublication: (id: string) => void;

  // 模块显示隐藏
  addSectionToOrder: (key: SectionKey) => void;
  removeSectionFromOrder: (key: SectionKey) => void;

  // 大模块排序
  reorderSections: (order: SectionKey[]) => void;

  // 整份重置
  resetResume: () => void;

  // 修改模块名称
  updateSectionTitle: (key: SectionKey, title: string) => void;

  // 临时交互：当前聚焦/展开的模块
  activeSection: SectionKey | null;
  setActiveSection: (key: SectionKey | null) => void;
}

// ─── 通用列表更新 helper ───────────────────────────────────
function updateListItem<T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function getUniqueResumeName(existingNames: string[], baseName: string): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  let counter = 1;
  let uniqueName = `${baseName} (${counter})`;
  while (existingNames.includes(uniqueName)) {
    counter++;
    uniqueName = `${baseName} (${counter})`;
  }
  return uniqueName;
}

function reorderList<T extends { id: string }>(list: T[], orderedIds: string[]): T[] {
  return orderedIds.map((id) => list.find((i) => i.id === id)!).filter(Boolean);
}

// ─── 清洗简历技术栈加粗数据 helper ───────────────────────────────
function cleanResumeData(r: ResumeData): ResumeData {
  if (!r) return r;

  const copy = { ...r };

  const cleanDescription = (desc: string) => {
    if (!desc) return desc;
    return desc
      .split('\n')
      .map((line) => {
        const match = line.match(/^(\*\*技术栈\*\*|技术栈)：(.*)$/);
        if (match) {
          const prefix = match[1];
          const content = match[2];
          const cleanedContent = content.replace(/\*\*/g, '');
          return `${prefix}：${cleanedContent}`;
        }
        return line;
      })
      .join('\n');
  };

  if (copy.projects && Array.isArray(copy.projects)) {
    copy.projects = copy.projects.map((p) => ({
      ...p,
      description: cleanDescription(p.description || ''),
    }));
  }

  return copy;
}

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

// ─── Store 实现 ────────────────────────────────────────────
export const useResumeStore = create<ResumeStore>()(
  persist(
    syncResumesMiddleware((set) => ({
      resume: createEmptyResume(),
      pages: [],
      setPages: (pages) => set({ pages }),

      // 主题
      updateTheme: (patch) =>
        set((s) => ({ resume: { ...s.resume, theme: { ...s.resume.theme, ...patch } } })),

      // 基本信息
      updateBasicInfo: (patch) =>
        set((s) => ({ resume: { ...s.resume, basicInfo: { ...s.resume.basicInfo, ...patch } } })),

      // 教育经历
      addEducation: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: [
              ...s.resume.education,
              { id: uid(), school: '', major: '', degree: '本科', startDate: '', endDate: '' },
            ],
          },
        })),
      updateEducation: (id, patch) =>
        set((s) => ({
          resume: { ...s.resume, education: updateListItem(s.resume.education, id, patch) },
        })),
      removeEducation: (id) =>
        set((s) => ({
          resume: { ...s.resume, education: s.resume.education.filter((i) => i.id !== id) },
        })),
      reorderEducation: (orderedIds) =>
        set((s) => ({
          resume: { ...s.resume, education: reorderList(s.resume.education, orderedIds) },
        })),

      // 工作经历
      addWorkExperience: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            workExperience: [
              ...s.resume.workExperience,
              { id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
          },
        })),
      updateWorkExperience: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            workExperience: updateListItem(s.resume.workExperience, id, patch),
          },
        })),
      removeWorkExperience: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            workExperience: s.resume.workExperience.filter((i) => i.id !== id),
          },
        })),
      reorderWorkExperience: (orderedIds) =>
        set((s) => ({
          resume: {
            ...s.resume,
            workExperience: reorderList(s.resume.workExperience, orderedIds),
          },
        })),

      // 项目经历
      addProject: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: [
              ...s.resume.projects,
              { id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
          },
        })),
      updateProject: (id, patch) =>
        set((s) => ({
          resume: { ...s.resume, projects: updateListItem(s.resume.projects, id, patch) },
        })),
      removeProject: (id) =>
        set((s) => ({
          resume: { ...s.resume, projects: s.resume.projects.filter((i) => i.id !== id) },
        })),
      reorderProjects: (orderedIds) =>
        set((s) => ({
          resume: { ...s.resume, projects: reorderList(s.resume.projects, orderedIds) },
        })),

      // 技能
      updateSkills: (text) =>
        set((s) => ({ resume: { ...s.resume, skills: text } })),

      // 自我评价
      updateSelfEvaluation: (text) =>
        set((s) => ({ resume: { ...s.resume, selfEvaluation: text } })),

      // 自定义模块
      addCustomSection: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: [
              ...s.resume.customSections,
              { id: uid(), title: '自定义模块', content: '' },
            ],
          },
        })),
      updateCustomSection: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: updateListItem(s.resume.customSections, id, patch),
          },
        })),
      removeCustomSection: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.filter((i) => i.id !== id),
          },
        })),

      // 校园经历
      addCampusExperience: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            campusExperience: [
              ...s.resume.campusExperience || [],
              { id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
          },
        })),
      updateCampusExperience: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            campusExperience: updateListItem(s.resume.campusExperience || [], id, patch),
          },
        })),
      removeCampusExperience: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            campusExperience: (s.resume.campusExperience || []).filter((i) => i.id !== id),
          },
        })),
      reorderCampusExperience: (orderedIds) =>
        set((s) => ({
          resume: {
            ...s.resume,
            campusExperience: reorderList(s.resume.campusExperience || [], orderedIds),
          },
        })),

      // 培训经历
      addTrainingExperience: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            trainingExperience: [
              ...s.resume.trainingExperience || [],
              { id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
          },
        })),
      updateTrainingExperience: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            trainingExperience: updateListItem(s.resume.trainingExperience || [], id, patch),
          },
        })),
      removeTrainingExperience: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            trainingExperience: (s.resume.trainingExperience || []).filter((i) => i.id !== id),
          },
        })),
      reorderTrainingExperience: (orderedIds) =>
        set((s) => ({
          resume: {
            ...s.resume,
            trainingExperience: reorderList(s.resume.trainingExperience || [], orderedIds),
          },
        })),

      // 开源项目
      addOpenSource: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            openSource: [
              ...s.resume.openSource || [],
              { id: uid(), company: '', position: '', startDate: '', endDate: '', description: '' },
            ],
          },
        })),
      updateOpenSource: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            openSource: updateListItem(s.resume.openSource || [], id, patch),
          },
        })),
      removeOpenSource: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            openSource: (s.resume.openSource || []).filter((i) => i.id !== id),
          },
        })),
      reorderOpenSource: (orderedIds) =>
        set((s) => ({
          resume: {
            ...s.resume,
            openSource: reorderList(s.resume.openSource || [], orderedIds),
          },
        })),

      // 荣誉奖项
      addHonorAward: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            honorAward: [
              ...s.resume.honorAward || [],
              { id: uid(), name: '', date: '', description: '' },
            ],
          },
        })),
      updateHonorAward: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            honorAward: updateListItem(s.resume.honorAward || [], id, patch),
          },
        })),
      removeHonorAward: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            honorAward: (s.resume.honorAward || []).filter((i) => i.id !== id),
          },
        })),

      // 证书资质
      addCertificate: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            certificate: [
              ...s.resume.certificate || [],
              { id: uid(), name: '', date: '' },
            ],
          },
        })),
      updateCertificate: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            certificate: updateListItem(s.resume.certificate || [], id, patch),
          },
        })),
      removeCertificate: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            certificate: (s.resume.certificate || []).filter((i) => i.id !== id),
          },
        })),

      // 语言能力
      addLanguageSkill: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            languageSkill: [
              ...s.resume.languageSkill || [],
              { id: uid(), name: '', level: '' },
            ],
          },
        })),
      updateLanguageSkill: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            languageSkill: updateListItem(s.resume.languageSkill || [], id, patch),
          },
        })),
      removeLanguageSkill: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            languageSkill: (s.resume.languageSkill || []).filter((i) => i.id !== id),
          },
        })),

      // 竞赛经历
      addCompetition: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            competition: [
              ...s.resume.competition || [],
              { id: uid(), name: '', date: '', award: '' },
            ],
          },
        })),
      updateCompetition: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            competition: updateListItem(s.resume.competition || [], id, patch),
          },
        })),
      removeCompetition: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            competition: (s.resume.competition || []).filter((i) => i.id !== id),
          },
        })),

      // 专利/著作/论文
      addResearchPublication: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            researchPublication: [
              ...s.resume.researchPublication || [],
              { id: uid(), name: '', date: '', description: '' },
            ],
          },
        })),
      updateResearchPublication: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            researchPublication: updateListItem(s.resume.researchPublication || [], id, patch),
          },
        })),
      removeResearchPublication: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            researchPublication: (s.resume.researchPublication || []).filter((i) => i.id !== id),
          },
        })),

      // 模块显示隐藏
      addSectionToOrder: (key) =>
        set((s) => {
          if (s.resume.sectionOrder.includes(key)) return {};
          return {
            resume: {
              ...s.resume,
              sectionOrder: [...s.resume.sectionOrder, key],
            },
          };
        }),
      removeSectionFromOrder: (key) =>
        set((s) => ({
          resume: {
            ...s.resume,
            sectionOrder: s.resume.sectionOrder.filter((k) => k !== key),
          },
        })),

      // 大模块排序
      reorderSections: (order) =>
        set((s) => ({ resume: { ...s.resume, sectionOrder: order } })),

      // 重置
      resetResume: () =>
        set((s) => {
          const emptyResume = createEmptyResume(s.currentResumeId);
          emptyResume.resumeName = s.resume.resumeName;
          return { resume: emptyResume };
        }),

      // 修改模块名称
      updateSectionTitle: (key, title) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customTitles: {
              ...(s.resume.customTitles || {}),
              [key]: title,
            },
          },
        })),

      // 多简历管理
      resumes: [],
      currentResumeId: '',
      switchResume: (id) =>
        set((s) => {
          const target = s.resumes.find((r) => r.id === id);
          if (!target) return {};
          return { currentResumeId: id, resume: target };
        }),
      createResume: (name) =>
        set((s) => {
          const newId = uid();
          const newResume = createEmptyResume(newId);
          newResume.resumeName = name || `${newResume.basicInfo.name}_简历`;
          return {
            resumes: [...s.resumes, newResume],
            currentResumeId: newId,
            resume: newResume,
          };
        }),
      renameResume: (id, name) =>
        set((s) => {
          const isCurrent = s.currentResumeId === id;
          const updatedResumes = s.resumes.map((r) => {
            if (r.id === id) {
              return { ...r, resumeName: name };
            }
            return r;
          });
          const updatedResume = isCurrent
            ? { ...s.resume, resumeName: name }
            : s.resume;
          return {
            resumes: updatedResumes,
            resume: updatedResume,
          };
        }),
      deleteResume: (id) =>
        set((s) => {
          const newResumes = s.resumes.filter((r) => r.id !== id);
          let nextId = s.currentResumeId;
          let nextResume = s.resume;
          if (s.currentResumeId === id) {
            if (newResumes.length > 0) {
              nextId = newResumes[0].id;
              nextResume = newResumes[0];
            } else {
              const emptyId = uid();
              const empty = createEmptyResume(emptyId);
              newResumes.push(empty);
              nextId = emptyId;
              nextResume = empty;
            }
          }
          return {
            resumes: newResumes,
            currentResumeId: nextId,
            resume: nextResume,
          };
        }),
      importSingleResume: (data) =>
        set((s) => {
          const newId = uid();
          const cleanedData = cleanResumeData(data);
          const baseName = cleanedData.resumeName || cleanedData.basicInfo?.name || '未命名';
          const existingNames = s.resumes.map(r => r.resumeName || '');
          const finalName = getUniqueResumeName(existingNames, baseName);
          const imported = {
            ...cleanedData,
            id: newId,
            resumeName: finalName
          };
          return {
            resumes: [...s.resumes, imported],
            currentResumeId: newId,
            resume: imported,
          };
        }),
      importBackupPackage: (resumesList, override) =>
        set((s) => {
          let existingNames = override ? [] : s.resumes.map(r => r.resumeName || '');
          const processed = resumesList.map(r => {
            const cleaned = cleanResumeData(r);
            const baseName = cleaned.resumeName || cleaned.basicInfo?.name || '未命名';
            const finalName = getUniqueResumeName(existingNames, baseName);
            existingNames.push(finalName);
            return {
              ...cleaned,
              id: override ? cleaned.id : uid(),
              resumeName: finalName
            };
          });

          const nextResumes = override ? processed : [...s.resumes, ...processed];
          const nextId = processed.length > 0 ? processed[0].id : s.currentResumeId;
          const nextResume = processed.length > 0 ? processed[0] : s.resume;

          return {
            resumes: nextResumes,
            currentResumeId: nextId,
            resume: nextResume,
          };
        }),
      activeSection: null,
      setActiveSection: (activeSection) => set({ activeSection }),
    })),
    {
      name: 'resume_local_draft',
      partialize: (state) => {
        const { pages, activeSection, setActiveSection, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 自动清洗已加载数据中技术栈的加粗词
          if (state.resumes) {
            state.resumes = state.resumes.map(r => {
              const cleaned = cleanResumeData(r);
              if (!cleaned.resumeName) {
                cleaned.resumeName = `${cleaned.basicInfo?.name || '未命名'}_简历`;
              }
              return cleaned;
            });
          }
          if (state.resume) {
            state.resume = cleanResumeData(state.resume);
            if (state.resume && !state.resume.resumeName) {
              state.resume.resumeName = `${state.resume.basicInfo?.name || '未命名'}_简历`;
            }
          }

          // 确保有 resumes 列表和 currentResumeId
          if (!state.resumes || state.resumes.length === 0) {
            const currentResume = state.resume || createEmptyResume();
            if (!currentResume.id || currentResume.id === 'yang-zhong-yuan-demo-id') {
              currentResume.id = uid();
            }
            state.resumes = [currentResume];
            state.currentResumeId = currentResume.id;
            state.resume = currentResume;
          } else if (!state.currentResumeId) {
            state.currentResumeId = state.resumes[0].id;
            state.resume = state.resumes[0];
          }
        }
      }
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__store__ = useResumeStore;
}

