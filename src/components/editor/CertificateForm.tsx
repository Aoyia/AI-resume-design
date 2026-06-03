'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Input from '@/components/ui/Input';
import MonthPicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function CertificateForm() {
  const certificate = useResumeStore((s) => s.resume.certificate || []);
  const addCertificate = useResumeStore((s) => s.addCertificate);
  const updateCertificate = useResumeStore((s) => s.updateCertificate);
  const removeCertificate = useResumeStore((s) => s.removeCertificate);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">证书资质</p>
        {certificate.map((item) => (
          <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex-1 grid grid-cols-6 gap-2">
              <Input
                value={item.name}
                onChange={(e) => updateCertificate(item.id, { name: e.target.value })}
                placeholder="证书名称（如：系统架构设计师 / AWS 认证）"
                className="col-span-4"
              />
              <MonthPicker
                value={item.date}
                onChange={(val) => updateCertificate(item.id, { date: val })}
                placeholder="获得时间（如：2024.11）"
                className="col-span-2"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => removeCertificate(item.id)}>
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addCertificate}>
          <Plus size={14} />
          添加证书资质
        </Button>
      </div>
    </div>
  );
}
