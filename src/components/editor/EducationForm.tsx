'use client';

import { useRef, useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { smoothScrollTo } from '@/lib/scroll';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EducationItem } from '@/types/resume';

function SortableEducationItem({
  item,
  onUpdate,
  onRemove,
}: {
  item: EducationItem;
  onUpdate: (patch: Partial<EducationItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const activeItemId = useResumeStore((s) => s.activeItemId);
  const setActiveItemId = useResumeStore((s) => s.setActiveItemId);
  const domRef = useRef<HTMLDivElement | null>(null);

  // 合并 Ref，让 dnd-kit 拖拽和定位 scroll 均能正常使用 DOM 节点
  const handleRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    domRef.current = node;
  };

  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeItemId === item.id && domRef.current) {
      const el = domRef.current;
      // 1. 平滑滚动到当前教育经历卡片中心
      smoothScrollTo(el, 400, 'center');

      // 2. 触发 1.5 秒的呼吸发光高亮提示
      el.classList.add('ring-2', 'ring-[var(--primary)]', 'ring-offset-2', 'transition-all', 'duration-300');
      
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[var(--primary)]', 'ring-offset-2');
        highlightTimerRef.current = null;
      }, 1500);

      // 3. 消费掉当前全局状态
      setActiveItemId(null);
    }
  }, [activeItemId, item.id, setActiveItemId]);

  // 组件卸载时防内存泄露的安全清理
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={handleRef}
      style={style}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <button
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xs text-[var(--text-muted)] flex-1">拖拽排序</span>
        <Button variant="danger" size="sm" onClick={onRemove}>
          <Trash2 size={13} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="学校名称"
          value={item.school}
          onChange={(e) => onUpdate({ school: e.target.value })}
          placeholder="北京大学"
          className="col-span-2"
        />
        <Input
          label="专业"
          value={item.major}
          onChange={(e) => onUpdate({ major: e.target.value })}
          placeholder="计算机科学"
        />
        <Input
          label="学历"
          value={item.degree}
          onChange={(e) => onUpdate({ degree: e.target.value })}
          placeholder="本科"
        />
        <MonthPicker
          label="开始时间"
          value={item.startDate}
          onChange={(val) => onUpdate({ startDate: val })}
          placeholder="2019.09"
        />
        <MonthPicker
          label="结束时间"
          value={item.endDate}
          onChange={(val) => onUpdate({ endDate: val })}
          placeholder="2023.06"
          showPresent
        />
      </div>
      <Textarea
        label="在校描述/城市/备注"
        hint="支持 Markdown"
        value={item.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        rows={2}
        placeholder="如：南昌（可填写城市、主修课程或在校绩点等）"
      />
    </div>
  );
}

export default function EducationForm() {
  const items = useResumeStore((s) => s.resume.education);
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);
  const reorderEducation = useResumeStore((s) => s.reorderEducation);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex).map((i) => i.id);
    reorderEducation(newOrder);
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableEducationItem
              key={item.id}
              item={item}
              onUpdate={(patch) => updateEducation(item.id, patch)}
              onRemove={() => removeEducation(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="secondary" size="sm" className="w-full" onClick={addEducation}>
        <Plus size={14} />
        添加教育经历
      </Button>
    </div>
  );
}
