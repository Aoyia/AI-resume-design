'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import ReactMarkdown from 'react-markdown';

/** 单一段落的 Markdown 渲染（bullet points 等） */
function MdContent({ content }: { content: string }) {
  if (!content) return null;
  return (
    <ReactMarkdown
      components={{
        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-[0.85em]">{children}</li>,
        p:  ({ children }) => <p className="text-[0.85em] leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/** 通用 Section 标题行 */
function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2" style={{ borderBottom: `1.5px solid ${color}` , paddingBottom: '3px' }}>
      <span className="text-[0.9em] font-bold uppercase tracking-wide" style={{ color }}>{title}</span>
    </div>
  );
}

/** 日期区间 */
function DateRange({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <span className="text-[0.78em] text-gray-800 shrink-0">
      {start}{start && end ? ' – ' : ''}{end}
    </span>
  );
}

/** 获取扁平化的 React 节点数组，用于动态 A4 分页计算 */
export function getFlatElements(data: ResumeData): React.ReactElement[] {
  const {
    theme, basicInfo: b, education, workExperience, projects, skills, selfEvaluation, sectionOrder,
    campusExperience, honorAward, certificate, languageSkill, researchPublication, trainingExperience,
    openSource, competition
  } = data;
  const color = theme.primaryColor;

  const elements: React.ReactElement[] = [];

  // 1. 头部：基本信息 (索引 0)
  elements.push(
    <div key="basic-info-header" className="mb-1.5 flex justify-between items-start gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-[1.6em] font-bold tracking-wide mb-0.5">{b.name || '您的姓名'}</h1>
        {b.jobTitle && (
          <div className="text-[0.9em] font-medium mb-2 text-gray-800">{b.jobTitle}</div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[0.8em] text-gray-800">
          {b.phone    && <span>{b.phone}</span>}
          {b.email    && <span>{b.email}</span>}
          {b.location && <span>{b.location}</span>}
          {b.website  && <span>{b.website}</span>}
        </div>
      </div>
      {b.avatar && (
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.avatar}
            alt="头像"
            className="w-[70px] h-[93px] object-cover rounded border border-gray-200 block"
            style={{ contentVisibility: 'auto' }}
          />
        </div>
      )}
    </div>
  );

  // 2. 根据模块排序依次放入扁平节点
  sectionOrder.forEach((key) => {
    if (key === 'basicInfo') return;

    if (key === 'education' && education.length > 0) {
      // 模块标题 + 第一个子项 绑在一起作为节点
      elements.push(
        <div key="edu-group-first" className="space-y-2 mb-4">
          <SectionTitle title="教育经历" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{education[0].school}</span>
              <DateRange start={education[0].startDate} end={education[0].endDate} />
            </div>
            <div className="text-[0.82em] text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>{education[0].major} · {education[0].degree}</div>
            {education[0].description && <MdContent content={education[0].description} />}
          </div>
        </div>
      );
      // 后续子项
      for (let i = 1; i < education.length; i++) {
        const edu = education[i];
        elements.push(
          <div key={`edu-group-${edu.id}`} className="resume-item mb-2">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{edu.school}</span>
              <DateRange start={edu.startDate} end={edu.endDate} />
            </div>
            <div className="text-[0.82em] text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>{edu.major} · {edu.degree}</div>
            {edu.description && <MdContent content={edu.description} />}
          </div>
        );
      }
    }

    if (key === 'workExperience' && workExperience.length > 0) {
      elements.push(
        <div key="work-group-first" className="space-y-3 mb-4">
          <SectionTitle title="工作经历" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{workExperience[0].company}</span>
              <DateRange start={workExperience[0].startDate} end={workExperience[0].endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{workExperience[0].position}</div>
            <MdContent content={workExperience[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < workExperience.length; i++) {
        const w = workExperience[i];
        elements.push(
          <div key={`work-group-${w.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{w.company}</span>
              <DateRange start={w.startDate} end={w.endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{w.position}</div>
            <MdContent content={w.description} />
          </div>
        );
      }
    }

    if (key === 'projects' && projects.length > 0) {
      elements.push(
        <div key="proj-group-first" className="space-y-3 mb-4">
          <SectionTitle title="项目经历" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{projects[0].company}</span>
              <DateRange start={projects[0].startDate} end={projects[0].endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{projects[0].position}</div>
            <MdContent content={projects[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < projects.length; i++) {
        const p = projects[i];
        elements.push(
          <div key={`proj-group-${p.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{p.company}</span>
              <DateRange start={p.startDate} end={p.endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{p.position}</div>
            <MdContent content={p.description} />
          </div>
        );
      }
    }

    if (key === 'skills' && skills) {
      elements.push(
        <div key="skills-group" className="space-y-2 mb-4">
          <SectionTitle title="专业技能" color={color} />
          <div className="resume-item">
            {typeof skills === 'string' ? (
              <MdContent content={skills} />
            ) : Array.isArray(skills) ? (
              <div className="space-y-1">
                {(skills as any[]).map((s) => (
                  <div key={s.id} className="flex gap-2 text-[0.84em] resume-item">
                    {s.category && <span className="font-semibold shrink-0 min-w-[4em]">{s.category}：</span>}
                    <span className="text-gray-800">{s.content}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (key === 'selfEvaluation' && selfEvaluation) {
      elements.push(
        <div key="self-eval-group" className="space-y-2 mb-4">
          <SectionTitle title="自我评价" color={color} />
          <div className="resume-item">
            <MdContent content={selfEvaluation} />
          </div>
        </div>
      );
    }

    if (key === 'customSections' && data.customSections && data.customSections.length > 0) {
      data.customSections.forEach((cs) => {
        elements.push(
          <div key={`custom-group-${cs.id}`} className="space-y-2 mb-4 resume-item">
            <SectionTitle title={cs.title} color={color} />
            <MdContent content={cs.content} />
          </div>
        );
      });
    }

    if (key === 'campusExperience' && campusExperience && campusExperience.length > 0) {
      elements.push(
        <div key="campus-group-first" className="space-y-3 mb-4">
          <SectionTitle title="校园经历" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{campusExperience[0].company}</span>
              <DateRange start={campusExperience[0].startDate} end={campusExperience[0].endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{campusExperience[0].position}</div>
            <MdContent content={campusExperience[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < campusExperience.length; i++) {
        const c = campusExperience[i];
        elements.push(
          <div key={`campus-group-${c.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{c.company}</span>
              <DateRange start={c.startDate} end={c.endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{c.position}</div>
            <MdContent content={c.description} />
          </div>
        );
      }
    }

    if (key === 'trainingExperience' && trainingExperience && trainingExperience.length > 0) {
      elements.push(
        <div key="train-group-first" className="space-y-3 mb-4">
          <SectionTitle title="培训经历" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{trainingExperience[0].company}</span>
              <DateRange start={trainingExperience[0].startDate} end={trainingExperience[0].endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{trainingExperience[0].position}</div>
            <MdContent content={trainingExperience[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < trainingExperience.length; i++) {
        const t = trainingExperience[i];
        elements.push(
          <div key={`train-group-${t.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{t.company}</span>
              <DateRange start={t.startDate} end={t.endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{t.position}</div>
            <MdContent content={t.description} />
          </div>
        );
      }
    }

    if (key === 'openSource' && openSource && openSource.length > 0) {
      elements.push(
        <div key="os-group-first" className="space-y-3 mb-4">
          <SectionTitle title="开源项目与作品" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{openSource[0].company}</span>
              <DateRange start={openSource[0].startDate} end={openSource[0].endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{openSource[0].position}</div>
            <MdContent content={openSource[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < openSource.length; i++) {
        const os = openSource[i];
        elements.push(
          <div key={`os-group-${os.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{os.company}</span>
              <DateRange start={os.startDate} end={os.endDate} />
            </div>
            <div className="text-[0.82em] font-medium mb-1" style={{ color, whiteSpace: 'pre-wrap' }}>{os.position}</div>
            <MdContent content={os.description} />
          </div>
        );
      }
    }

    if (key === 'honorAward' && honorAward && honorAward.length > 0) {
      elements.push(
        <div key="honor-group" className="space-y-2 mb-4">
          <SectionTitle title="荣誉奖项" color={color} />
          <div className="space-y-1.5">
            {honorAward.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline text-[0.84em] resume-item">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <span className="font-semibold">{item.name}</span>
                  {item.description && <span className="text-gray-800 ml-2">({item.description})</span>}
                </div>
                <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'certificate' && certificate && certificate.length > 0) {
      elements.push(
        <div key="cert-group" className="space-y-2 mb-4">
          <SectionTitle title="证书资质" color={color} />
          <div className="space-y-1.5">
            {certificate.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline text-[0.84em] resume-item">
                <span className="font-semibold" style={{ whiteSpace: 'pre-wrap' }}>{item.name}</span>
                <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'languageSkill' && languageSkill && languageSkill.length > 0) {
      elements.push(
        <div key="lang-group" className="space-y-2 mb-4">
          <SectionTitle title="语言能力" color={color} />
          <div className="space-y-1.5">
            {languageSkill.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline text-[0.84em] resume-item">
                <span className="font-semibold" style={{ whiteSpace: 'pre-wrap' }}>{item.name}</span>
                <span className="text-gray-800 text-[0.95em] text-right flex-1 ml-4" style={{ whiteSpace: 'pre-wrap' }}>{item.level}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'competition' && competition && competition.length > 0) {
      elements.push(
        <div key="comp-group" className="space-y-2 mb-4">
          <SectionTitle title="竞赛经历" color={color} />
          <div className="space-y-1.5">
            {competition.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline text-[0.84em] resume-item">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-gray-800 ml-2 font-medium" style={{ color, whiteSpace: 'pre-wrap' }}>{item.award}</span>
                </div>
                <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (key === 'researchPublication' && researchPublication && researchPublication.length > 0) {
      elements.push(
        <div key="pub-group-first" className="space-y-3 mb-4">
          <SectionTitle title="专利/著作/论文" color={color} />
          <div className="resume-item">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{researchPublication[0].name}</span>
              <span className="text-[0.78em] text-gray-800 shrink-0">{researchPublication[0].date}</span>
            </div>
            <MdContent content={researchPublication[0].description} />
          </div>
        </div>
      );
      for (let i = 1; i < researchPublication.length; i++) {
        const pub = researchPublication[i];
        elements.push(
          <div key={`pub-group-${pub.id}`} className="resume-item mb-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{pub.name}</span>
              <span className="text-[0.78em] text-gray-800 shrink-0">{pub.date}</span>
            </div>
            <MdContent content={pub.description} />
          </div>
        );
      }
    }
  });

  return elements;
}

interface ClassicTemplateProps {
  data: ResumeData;
  elementIndices?: number[];
}

export default function ClassicTemplate({ data, elementIndices }: ClassicTemplateProps) {
  const flatElements = getFlatElements(data);

  return (
    <div
      className="w-full h-full bg-white text-gray-800 leading-relaxed break-all"
      style={{
        fontFamily: data.theme.fontFamily,
        fontSize: `${data.theme.fontSize}px`,
      }}
    >
      {elementIndices
        ? elementIndices.map((idx) => flatElements[idx])
        : flatElements}
    </div>
  );
}
