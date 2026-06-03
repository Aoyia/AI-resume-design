'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function CompetitionForm() {
  const competition = useResumeStore((s) => s.resume.competition || []);
  const addCompetition = useResumeStore((s) => s.addCompetition);
  const updateCompetition = useResumeStore((s) => s.updateCompetition);
  const removeCompetition = useResumeStore((s) => s.removeCompetition);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">竞赛经历</p>
        {competition.map((item) => (
          <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex-1 grid grid-cols-6 gap-2">
              <Input
                value={item.name}
                onChange={(e) => updateCompetition(item.id, { name: e.target.value })}
                placeholder="竞赛名称（如：ACM-ICPC 亚洲区域赛）"
                className="col-span-4"
              />
              <MonthPicker
                value={item.date}
                onChange={(val) => updateCompetition(item.id, { date: val })}
                placeholder="竞赛时间"
                className="col-span-2"
              />
              <Input
                value={item.award}
                onChange={(e) => updateCompetition(item.id, { award: e.target.value })}
                placeholder="所获奖项（如：一等奖 / 银奖 / 全球前5%）"
                className="col-span-6"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => removeCompetition(item.id)} className="mt-1">
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addCompetition}>
          <Plus size={14} />
          添加竞赛经历
        </Button>
      </div>
    </div>
  );
}
