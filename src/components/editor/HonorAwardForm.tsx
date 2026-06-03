'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function HonorAwardForm() {
  const honorAward = useResumeStore((s) => s.resume.honorAward || []);
  const addHonorAward = useResumeStore((s) => s.addHonorAward);
  const updateHonorAward = useResumeStore((s) => s.updateHonorAward);
  const removeHonorAward = useResumeStore((s) => s.removeHonorAward);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">荣誉奖项</p>
        {honorAward.map((item) => (
          <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex-1 grid grid-cols-6 gap-2">
              <Input
                value={item.name}
                onChange={(e) => updateHonorAward(item.id, { name: e.target.value })}
                placeholder="奖项名称（如：国家奖学金 / ACM 银奖）"
                className="col-span-4"
              />
              <MonthPicker
                value={item.date}
                onChange={(val) => updateHonorAward(item.id, { date: val })}
                placeholder="获奖时间"
                className="col-span-2"
              />
              <Input
                value={item.description || ''}
                onChange={(e) => updateHonorAward(item.id, { description: e.target.value })}
                placeholder="简要说明（如：Top 1% / 200人中第一）"
                className="col-span-6"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => removeHonorAward(item.id)} className="mt-1">
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addHonorAward}>
          <Plus size={14} />
          添加荣誉奖项
        </Button>
      </div>
    </div>
  );
}
