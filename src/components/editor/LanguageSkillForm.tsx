'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function LanguageSkillForm() {
  const languageSkill = useResumeStore((s) => s.resume.languageSkill || []);
  const addLanguageSkill = useResumeStore((s) => s.addLanguageSkill);
  const updateLanguageSkill = useResumeStore((s) => s.updateLanguageSkill);
  const removeLanguageSkill = useResumeStore((s) => s.removeLanguageSkill);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">语言能力</p>
        {languageSkill.map((item) => (
          <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex-1 grid grid-cols-6 gap-2">
              <Input
                value={item.name}
                onChange={(e) => updateLanguageSkill(item.id, { name: e.target.value })}
                placeholder="语言种类（如：英语 / 日语）"
                className="col-span-2"
              />
              <Input
                value={item.level}
                onChange={(e) => updateLanguageSkill(item.id, { level: e.target.value })}
                placeholder="熟练度（如：CET-6 580分 / 听说读写流利）"
                className="col-span-4"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => removeLanguageSkill(item.id)}>
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addLanguageSkill}>
          <Plus size={14} />
          添加语言能力
        </Button>
      </div>
    </div>
  );
}
