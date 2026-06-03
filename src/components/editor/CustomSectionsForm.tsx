'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function CustomSectionsForm() {
  const customSections = useResumeStore((s) => s.resume.customSections);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const updateCustomSection = useResumeStore((s) => s.updateCustomSection);
  const removeCustomSection = useResumeStore((s) => s.removeCustomSection);

  return (
    <div className="space-y-4">
      {customSections.map((sec, idx) => (
        <div key={sec.id} className="p-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-white relative space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">模块 #{idx + 1}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeCustomSection(sec.id)}
              className="h-6 w-6 p-0"
              title="删除此模块"
            >
              <Trash2 size={13} />
            </Button>
          </div>

          <Input
            label="模块名称"
            value={sec.title}
            onChange={(e) => updateCustomSection(sec.id, { title: e.target.value })}
            placeholder="如：荣誉奖项、语言能力、开源项目"
          />

          <Textarea
            label="模块内容"
            hint="支持 Markdown"
            value={sec.content}
            onChange={(e) => updateCustomSection(sec.id, { content: e.target.value })}
            rows={4}
            placeholder={`- 2025年 荣获国家奖学金\n- 2024年 获得全国大学生数学建模竞赛一等奖\n- 英语六级 (CET-6) 600分，具备流利的听说读写能力`}
          />
        </div>
      ))}

      <Button variant="secondary" size="sm" className="w-full" onClick={addCustomSection}>
        <Plus size={14} />
        添加自定义模块
      </Button>
    </div>
  );
}
