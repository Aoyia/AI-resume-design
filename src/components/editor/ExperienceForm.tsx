'use client';

import { useResumeStore } from '@/store/useResumeStore';
import { ExperienceItem } from '@/types/resume';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Mode = 'work' | 'project' | 'campus' | 'training' | 'openSource';

const CONFIG: Record<Mode, {
  companyLabel: string;
  companyPlaceholder: string;
  positionLabel: string;
  positionPlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
}> = {
  work: {
    companyLabel: '公司名称',
    companyPlaceholder: '上海得帆智能科技有限公司',
    positionLabel: '职位',
    positionPlaceholder: '前端研发',
    descLabel: '工作描述',
    descPlaceholder: '- 负责...\n- 通过...方式，实现...\n- 带来...结果（量化数据）',
  },
  project: {
    companyLabel: '项目名称',
    companyPlaceholder: '得帆云低代码平台',
    positionLabel: '担任角色',
    positionPlaceholder: '核心开发工程师',
    descLabel: '项目描述',
    descPlaceholder: '**项目简介**：...\n\n**技术栈**：...\n\n**核心贡献**：\n- 设计并实现...\n- 优化了...',
  },
  campus: {
    companyLabel: '组织/社团/活动名称',
    companyPlaceholder: '软件研发社',
    positionLabel: '职务/角色',
    positionPlaceholder: '会长 / 核心开发',
    descLabel: '经历描述',
    descPlaceholder: '- 组织并筹备了...\n- 带领核心开发组设计并上线...',
  },
  training: {
    companyLabel: '培训机构/主办方',
    companyPlaceholder: '极客时间',
    positionLabel: '培训课程/项目',
    positionPlaceholder: '架构设计实战营',
    descLabel: '培训描述/收获',
    descPlaceholder: '- 体系化学习了...\n- 独立完成期末大作业...',
  },
  openSource: {
    companyLabel: '开源项目/仓库名称',
    companyPlaceholder: 'mini-react',
    positionLabel: '个人角色',
    positionPlaceholder: 'Creator / Contributor',
    descLabel: '项目介绍与核心贡献',
    descPlaceholder: '**项目链接**：`github.com/username/repo` (Stars 数量)\n\n**贡献说明**：\n- 设计并实现...\n- 修复了...\n- 提升了性能...',
  },
};

import { memo } from 'react';

const SortableExperienceItem = memo(function SortableExperienceItem({
  id, mode,
}: {
  id: string;
  mode: Mode;
}) {
  const isWork = mode === 'work';
  const isProject = mode === 'project';
  const isCampus = mode === 'campus';
  const isTraining = mode === 'training';

  const item = useResumeStore((s) => {
    const list = isWork
      ? s.resume.workExperience
      : isProject
      ? s.resume.projects
      : isCampus
      ? s.resume.campusExperience
      : isTraining
      ? s.resume.trainingExperience
      : s.resume.openSource;
    return list.find((i) => i.id === id);
  });

  const update = useResumeStore((s) => {
    if (isWork) return s.updateWorkExperience;
    if (isProject) return s.updateProject;
    if (isCampus) return s.updateCampusExperience;
    if (isTraining) return s.updateTrainingExperience;
    return s.updateOpenSource;
  });

  const remove = useResumeStore((s) => {
    if (isWork) return s.removeWorkExperience;
    if (isProject) return s.removeProject;
    if (isCampus) return s.removeCampusExperience;
    if (isTraining) return s.removeTrainingExperience;
    return s.removeOpenSource;
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const cfg = CONFIG[mode];

  if (!item) return null;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
        <span className="text-xs text-[var(--text-muted)] flex-1">拖拽排序</span>
        <Button variant="danger" size="sm" onClick={() => remove(id)}><Trash2 size={13} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label={cfg.companyLabel}
          value={item.company}
          onChange={(e) => update(id, { company: e.target.value })}
          placeholder={cfg.companyPlaceholder}
          className="col-span-2"
        />
        <Input
          label={cfg.positionLabel}
          value={item.position}
          onChange={(e) => update(id, { position: e.target.value })}
          placeholder={cfg.positionPlaceholder}
          className="col-span-2"
        />
        <MonthPicker
          label="开始时间"
          value={item.startDate}
          onChange={(val) => update(id, { startDate: val })}
          placeholder="2022.06"
        />
        <MonthPicker
          label="结束时间"
          value={item.endDate}
          onChange={(val) => update(id, { endDate: val })}
          placeholder="至今"
          showPresent
        />
      </div>
      <Textarea
        label={cfg.descLabel}
        hint="支持 Markdown"
        value={item.description}
        onChange={(e) => update(id, { description: e.target.value })}
        rows={5}
        placeholder={cfg.descPlaceholder}
      />
    </div>
  );
});

export default function ExperienceForm({ mode }: { mode: Mode }) {
  const isWork = mode === 'work';
  const isProject = mode === 'project';
  const isCampus = mode === 'campus';
  const isTraining = mode === 'training';

  const items = useResumeStore((s) => {
    if (isWork) return s.resume.workExperience;
    if (isProject) return s.resume.projects;
    if (isCampus) return s.resume.campusExperience;
    if (isTraining) return s.resume.trainingExperience;
    return s.resume.openSource;
  });

  const add = useResumeStore((s) => {
    if (isWork) return s.addWorkExperience;
    if (isProject) return s.addProject;
    if (isCampus) return s.addCampusExperience;
    if (isTraining) return s.addTrainingExperience;
    return s.addOpenSource;
  });

  const reorder = useResumeStore((s) => {
    if (isWork) return s.reorderWorkExperience;
    if (isProject) return s.reorderProjects;
    if (isCampus) return s.reorderCampusExperience;
    if (isTraining) return s.reorderTrainingExperience;
    return s.reorderOpenSource;
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    reorder(arrayMove(items, oldIdx, newIdx).map((i) => i.id));
  };

  const getBtnText = () => {
    if (isWork) return '添加工作经历';
    if (isProject) return '添加项目经历';
    if (isCampus) return '添加校园经历';
    if (isTraining) return '添加培训经历';
    return '添加开源项目';
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableExperienceItem
              key={item.id} id={item.id} mode={mode}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="secondary" size="sm" className="w-full" onClick={add}>
        <Plus size={14} />
        {getBtnText()}
      </Button>
    </div>
  );
}
