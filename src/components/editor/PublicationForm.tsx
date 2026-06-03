'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function PublicationForm() {
  const researchPublication = useResumeStore((s) => s.resume.researchPublication || []);
  const addResearchPublication = useResumeStore((s) => s.addResearchPublication);
  const updateResearchPublication = useResumeStore((s) => s.updateResearchPublication);
  const removeResearchPublication = useResumeStore((s) => s.removeResearchPublication);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">专利/著作/论文</p>
        {researchPublication.map((item) => (
          <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-6 gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateResearchPublication(item.id, { name: e.target.value })}
                  placeholder="成果/论文/专利名称"
                  className="col-span-4"
                />
                <MonthPicker
                  value={item.date}
                  onChange={(val) => updateResearchPublication(item.id, { date: val })}
                  placeholder="时间（如：2024.08）"
                  className="col-span-2"
                />
              </div>
              <Textarea
                value={item.description}
                onChange={(e) => updateResearchPublication(item.id, { description: e.target.value })}
                placeholder="详细介绍（支持 Markdown，可填写申请号、期刊、摘要等）"
                rows={3}
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => removeResearchPublication(item.id)} className="mt-1">
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addResearchPublication}>
          <Plus size={14} />
          添加专利/著作/论文
        </Button>
      </div>
    </div>
  );
}
