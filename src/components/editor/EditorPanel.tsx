'use client';

import { useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import Accordion from '@/components/ui/Accordion';
import { cn } from '@/lib/utils';
import BasicInfoForm from './BasicInfoForm';
import EducationForm from './EducationForm';
import ExperienceForm from './ExperienceForm';
import SkillsForm from './SkillsForm';
import SelfEvaluationForm from './SelfEvaluationForm';
import CustomSectionsForm from './CustomSectionsForm';
import HonorAwardForm from './HonorAwardForm';
import CertificateForm from './CertificateForm';
import LanguageSkillForm from './LanguageSkillForm';
import CompetitionForm from './CompetitionForm';
import PublicationForm from './PublicationForm';

import Button from '@/components/ui/Button';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popconfirm } from '@arco-design/web-react';
import { smoothScrollTo } from '@/lib/scroll';
import { SectionKey } from '@/types/resume';

const SECTION_CONFIG: Record<SectionKey, { title: string }> = {
  basicInfo:           { title: '基本信息' },
  education:           { title: '教育经历' },
  workExperience:      { title: '工作经历' },
  projects:            { title: '项目经历' },
  openSource:          { title: '开源项目与作品' },
  skills:              { title: '专业技能' },
  selfEvaluation:      { title: '自我评价' },
  campusExperience:    { title: '校园经历' },
  honorAward:          { title: '荣誉奖项' },
  certificate:         { title: '证书资质' },
  languageSkill:       { title: '语言能力' },
  researchPublication: { title: '专利/著作/论文' },
  trainingExperience:  { title: '培训经历' },
  competition:         { title: '竞赛经历' },
  customSections:      { title: '自定义模块' },
};

function SortableSection({ id }: { id: SectionKey }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const removeSectionFromOrder = useResumeStore((s) => s.removeSectionFromOrder);
  const customTitles = useResumeStore((s) => s.resume.customTitles);
  const updateSectionTitle = useResumeStore((s) => s.updateSectionTitle);

  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);

  const isCurrentActive = activeSection === id;

  useEffect(() => {
    if (isCurrentActive) {
      // 稍微延迟，确保折叠面板开始展开，从而能更准确地滚动到对应位置
      const timer = setTimeout(() => {
        // 若此时存在具体的子项定位 (activeItemId)，大模块滚动把控制权彻底让渡给子卡片，自身不执行滚动，防止动画冲突卡顿
        if (useResumeStore.getState().activeItemId) {
          return;
        }

        const el = document.getElementById(`editor-section-${id}`);
        if (el) {
          smoothScrollTo(el, 400, 'start');
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isCurrentActive, id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const dragHandle = (
    <span {...attributes} {...listeners} className="touch-none">
      <GripVertical size={15} />
    </span>
  );

  const defaultTitle = SECTION_CONFIG[id]?.title ?? id;
  const title = customTitles?.[id] || defaultTitle;

  const renderContent = () => {
    switch (id) {
      case 'basicInfo':           return <BasicInfoForm />;
      case 'education':           return <EducationForm />;
      case 'workExperience':      return <ExperienceForm mode="work" />;
      case 'projects':            return <ExperienceForm mode="project" />;
      case 'openSource':          return <ExperienceForm mode="openSource" />;
      case 'skills':              return <SkillsForm />;
      case 'selfEvaluation':      return <SelfEvaluationForm />;
      case 'customSections':      return <CustomSectionsForm />;
      case 'campusExperience':    return <ExperienceForm mode="campus" />;
      case 'trainingExperience':  return <ExperienceForm mode="training" />;
      case 'honorAward':          return <HonorAwardForm />;
      case 'certificate':         return <CertificateForm />;
      case 'languageSkill':       return <LanguageSkillForm />;
      case 'competition':         return <CompetitionForm />;
      case 'researchPublication': return <PublicationForm />;
      default:                    return null;
    }
  };

  // 基本信息不允许排序拖拽和删除
  const isFixed = id === 'basicInfo';

  const action = !isFixed ? (
    <div onClick={(e) => e.stopPropagation()}>
      <Popconfirm
        focusLock
        title="确定要移除此模块吗？"
        content="移除后模块将被隐藏，但已填数据仍会保留在本地草稿中。"
        onOk={() => removeSectionFromOrder(id)}
        okText="确定"
        cancelText="取消"
      >
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-100 hover:text-red-500 rounded text-[var(--text-muted)] cursor-pointer bg-transparent border-0 focus:outline-none flex items-center"
          title="隐藏此模块"
        >
          <Trash2 size={13} />
        </button>
      </Popconfirm>
    </div>
  ) : undefined;

  return (
    <div
      ref={setNodeRef}
      id={`editor-section-${id}`}
      style={style}
      className={cn(
        "transition-all duration-200 rounded-[var(--radius-md)]",
        isDragging && "scale-[1.02] shadow-2xl ring-1 ring-[var(--primary)]/20 z-50 bg-white"
      )}
    >
      <Accordion
        title={title}
        open={isCurrentActive}
        onOpenChange={(openState) => {
          setActiveSection(openState ? id : null);
        }}
        dragHandle={isFixed ? undefined : dragHandle}
        action={action}
        onTitleChange={(newTitle) => updateSectionTitle(id, newTitle)}
      >
        {renderContent()}
      </Accordion>
    </div>
  );
}

export default function EditorPanel() {
  const order = useResumeStore((s) => s.resume.sectionOrder);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const addSectionToOrder = useResumeStore((s) => s.addSectionToOrder);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(active.id as SectionKey);
    const newIdx = order.indexOf(over.id as SectionKey);
    reorderSections(arrayMove(order, oldIdx, newIdx));
  };

  // 程序员特化模块归类
  const DEV_SECTIONS: SectionKey[] = ['openSource', 'competition', 'researchPublication'];
  const COMMON_SECTIONS: SectionKey[] = [
    'education', 'workExperience', 'projects', 'skills', 'campusExperience',
    'honorAward', 'certificate', 'languageSkill', 'trainingExperience',
    'selfEvaluation', 'customSections'
  ];

  const hiddenDev = DEV_SECTIONS.filter(k => !order.includes(k));
  const hiddenCommon = COMMON_SECTIONS.filter(k => !order.includes(k));

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4 stable-scrollbar flex flex-col justify-between">
      <div className="space-y-3">
        <DndContext id="dnd-resume-editor" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {order.map((key) => (
              <SortableSection key={key} id={key} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* 添加更多模块区 */}
      {(hiddenDev.length > 0 || hiddenCommon.length > 0) && (
        <div className="pt-6 border-t border-[var(--border)] mt-6 space-y-4 pb-2 shrink-0">
          <h4 className="text-xs font-bold text-[var(--text-primary)] select-none">添加更多模块</h4>
          
          {/* 程序员专属推荐 */}
          {hiddenDev.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-pink-600 bg-pink-50/70 px-1.5 py-0.5 rounded">技术特化</span>
                <span className="text-[10px] text-slate-400">程序员简历核心推荐</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hiddenDev.map((key) => (
                  <button
                    key={key}
                    onClick={() => addSectionToOrder(key)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50/60 active:bg-pink-100/80 active:scale-95 border border-dashed border-pink-200 hover:border-pink-300 cursor-pointer select-none rounded-lg transition-all duration-150 focus:outline-none"
                  >
                    <Plus size={12} />
                    {SECTION_CONFIG[key].title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 通用备选模块 */}
          {hiddenCommon.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500">通用模块</span>
              <div className="flex flex-wrap gap-1.5">
                {hiddenCommon.map((key) => (
                  <button
                    key={key}
                    onClick={() => addSectionToOrder(key)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:bg-[var(--primary-light)]/40 active:bg-[var(--primary-light)]/80 active:scale-95 border border-dashed border-[var(--border)] hover:border-[var(--primary)] cursor-pointer select-none rounded-lg transition-all duration-150 focus:outline-none"
                  >
                    <Plus size={12} />
                    {SECTION_CONFIG[key].title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
