'use client';

import { useResumeStore } from '@/store/useResumeStore';
import Textarea from '@/components/ui/Textarea';

export default function SkillsForm() {
  const skillsData = useResumeStore((s) => s.resume.skills);
  const updateSkills = useResumeStore((s) => s.updateSkills);

  // 鲁棒性迁移：如果本地 LocalStorage 依然缓存着旧的数组格式，则自动在前端转为 Markdown 列表字符串展示
  const skills = typeof skillsData === 'string'
    ? skillsData
    : Array.isArray(skillsData)
      ? (skillsData as any[]).map((s) => `- **${s.category}**：${s.content}`).join('\n')
      : '';

  return (
    <div className="space-y-4">
      <Textarea
        label="专业技能"
        hint="支持 Markdown"
        value={skills}
        onChange={(e) => updateSkills(e.target.value)}
        rows={10}
        placeholder={`- **核心技术**：熟练掌握 React / Vue / TypeScript，具备大型项目开发经验。\n- **工程化构建**：熟练掌握 Webpack / Vite 构建优化，能编写 Babel AST 插件。\n- **性能优化**：具备前端首屏加载及运行时性能优化经验，熟练使用 Performance 进行问题定位。`}
      />
    </div>
  );
}
