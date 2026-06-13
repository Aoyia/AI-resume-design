# 杨忠源基础简历模板更新与脱敏设计规格

## 1. 目标
将项目的基础简历模板替换为本地的 `杨忠源_简历_配置.json` 版本，同时在模板的默认数据中对手机号做模糊脱敏处理（硬编码为 `157****6785`）。

## 2. 详细变更设计
修改文件：[resume.ts](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/types/resume.ts)

替换函数 `createEmptyResume` 的返回值。

### 2.1 主题配置替换
使用 `杨忠源_简历_配置.json` 中的主题配置：
```typescript
theme: {
  ...DEFAULT_THEME,
  primaryColor: '#2563EB',
  sectionGap: 12,
  dividerStyle: 'skew-block',
  dividerHeight: 3,
}
```

### 2.2 基础信息脱敏
在 `basicInfo` 属性中，将 `phone` 字段的值直接硬编码修改为：
```typescript
phone: "157****6785"
```

### 2.3 简历内容与模块顺序
* 简历的所有其他经历（教育经历、工作经历、项目经历、技能、自定义模块等）全部使用 `杨忠源_简历_配置.json` 对应的内容字面量填充。
* 各模块项的 `id` 直接使用 JSON 配置文件中的预设静态 ID（如 `"edu-1"`, `"work-1"`, `"proj-1"` 等），保证稳定性。
* `sectionOrder` 保持与 JSON 配置文件中的顺序一致：
  `["basicInfo", "skills", "projects", "workExperience", "education"]`

## 3. 验证方案
1. 运行项目开发服务器，清除浏览器 LocalStorage（或创建一个新简历/重置简历），检查页面默认展示的简历内容是否已变为最新的杨忠源简历。
2. 检查简历中的电话号码是否显示为脱敏后的 `"157****6785"`。
3. 运行代码 Lint 检查和 TypeScript 类型检查，确保代码没有语法或类型错误。
