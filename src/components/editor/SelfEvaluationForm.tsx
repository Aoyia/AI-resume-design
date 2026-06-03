'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Textarea from '@/components/ui/Textarea';

export default function SelfEvaluationForm() {
  const selfEvaluation = useResumeStore((s) => s.resume.selfEvaluation);
  const updateSelfEvaluation = useResumeStore((s) => s.updateSelfEvaluation);

  return (
    <div className="space-y-3">
      <Textarea
        label="自我评价内容"
        hint="支持 Markdown"
        value={selfEvaluation ?? ''}
        onChange={(e) => updateSelfEvaluation(e.target.value)}
        rows={6}
        placeholder={`- 5 年前端工作经验，具有大型系统重构及性能优化经验...\n- 熟练掌握 React 及其生态链，具备丰富的组件库建设经验...\n- 具有良好的团队协作精神与自驱力，习惯编写技术文档...`}
      />
    </div>
  );
}
