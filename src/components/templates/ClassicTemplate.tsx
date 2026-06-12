'use client';

import React from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';
import ReactMarkdown from 'react-markdown';

/** 单一段落的 Markdown 渲染（bullet points 等） */
function MdContent({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="text-[0.85em] text-gray-700" style={{ lineHeight: 'inherit' }}>
      <ReactMarkdown
        components={{
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 mt-0.5" style={{ lineHeight: 'inherit' }}>{children}</ul>,
          ol: ({ children, start }) => <ol start={start} className="list-decimal pl-4 space-y-0.5 mt-0.5" style={{ lineHeight: 'inherit' }}>{children}</ol>,
          li: ({ children }) => <li className="break-all" style={{ lineHeight: 'inherit' }}>{children}</li>,
          p:  ({ children }) => <p className="break-all" style={{ lineHeight: 'inherit' }}>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-950">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** 通用 Section 标题行 */
function SectionTitle({ 
  title, 
  theme, 
  marginTop 
}: { 
  title: string; 
  theme: ResumeTheme; 
  marginTop: number 
}) {
  const color = theme.primaryColor;
  const style = theme.dividerStyle || 'left-bar';
  const height = theme.dividerHeight ?? (style === 'left-bar' ? 4 : 1.5);
  const useBg = theme.enableTitleBg && style === 'left-bar';

  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      marginTop: `${marginTop}px`,
      display: 'flex',
      alignItems: 'center',
    };

    if (style === 'left-bar') {
      return {
        ...baseStyle,
        borderLeft: `${height}px solid ${color}`,
        paddingLeft: '8px',
        paddingTop: '4px',
        paddingBottom: '4px',
        background: useBg ? `${color}0D` : 'transparent',
        borderRadius: useBg ? '4px' : '0px',
        marginBottom: '8px',
      };
    } else if (style === 'solid') {
      return {
        ...baseStyle,
        borderBottom: `${height}px solid ${color}`,
        paddingBottom: '3px',
        marginBottom: '8px',
      };
    } else if (style === 'skew-block') {
      return {
        ...baseStyle,
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0px',
        marginBottom: '12px',
      };
    } else if (style === 'light-line') {
      return {
        ...baseStyle,
        borderBottom: `1px solid ${color}33`,
        paddingBottom: '6px',
        marginBottom: '8px',
      };
    } else if (style === 'watermark-bar') {
      return {
        ...baseStyle,
        width: '100%',
        background: `${color}0A`,
        borderLeft: `${height}px solid ${color}`,
        padding: '6px 8px',
        borderRadius: '2px',
        marginBottom: '8px',
      };
    } else {
      return {
        ...baseStyle,
        marginBottom: '8px',
      };
    }
  };

  if (style === 'skew-block') {
    return (
      <div data-type="section-title" style={getContainerStyle()}>
        <div
          style={{
            background: color,
            transform: 'skewX(-12deg)',
            padding: '4px 14px',
            borderRadius: '2px',
            display: 'inline-block',
          }}
        >
          <span 
            className="text-[0.9em] font-bold uppercase tracking-wider" 
            style={{ 
              color: '#FFFFFF',
              display: 'inline-block',
              transform: 'skewX(12deg)'
            }}
          >
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div data-type="section-title" style={getContainerStyle()}>
      <span 
        className="text-[0.9em] font-bold uppercase tracking-wider" 
        style={{ 
          color,
          paddingLeft: (style === 'left-bar' && useBg) ? '2px' : '0px'
        }}
      >
        {title}
      </span>
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

/** 智能 Markdown 块拆分 */
export function splitMarkdownToBlocks(markdown: string): string[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = '';
      }
      continue;
    }

    const isBullet = /^[*-]\s+/.test(trimmed);
    const isNumList = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumList) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = '';
      }
      blocks.push(line);
    } else {
      if (currentBlock) {
        currentBlock += '\n' + line;
      } else {
        currentBlock = line;
      }
    }
  }
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  return blocks;
}

/** 获取扁平化的 React 节点数组，用于动态 A4 分页计算 */
export function getFlatElements(data: ResumeData): React.ReactElement[] {
  const {
    theme, basicInfo: b, education, workExperience, projects, skills, selfEvaluation, sectionOrder,
    campusExperience, honorAward, certificate, languageSkill, researchPublication, trainingExperience,
    openSource, competition
  } = data;
  const color = theme.primaryColor;
  const gap = theme.sectionGap;

  const elements: React.ReactElement[] = [];

  // 1. 头部：基本信息 (索引 0)
  elements.push(
    <div
      key="basic-info-header"
      data-type="basic-info"
      data-cache-key={`basic-info|${b.name}|${b.jobTitle}|${b.phone}|${b.email}|${b.location}|${b.website}|${b.avatar}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
      className="mb-2 flex justify-between items-start gap-6"
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-[1.6em] font-bold tracking-wider mb-1">{b.name || '您的姓名'}</h1>
        {b.jobTitle && (
          <div className="text-[0.9em] font-medium mb-2 text-gray-800 tracking-wide">{b.jobTitle}</div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[0.8em] text-gray-800 tracking-wide">
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

  let isFirstSection = true;

  // 2. 根据模块排序依次放入扁平节点
  sectionOrder.forEach((key) => {
    if (key === 'basicInfo') return;

    // 当前模块是否有内容
    let hasContent = false;
    if (key === 'education' && education.length > 0) hasContent = true;
    if (key === 'workExperience' && workExperience.length > 0) hasContent = true;
    if (key === 'projects' && projects.length > 0) hasContent = true;
    if (key === 'skills' && skills) hasContent = true;
    if (key === 'selfEvaluation' && selfEvaluation) hasContent = true;
    if (key === 'customSections' && data.customSections && data.customSections.length > 0) hasContent = true;
    if (key === 'campusExperience' && campusExperience && campusExperience.length > 0) hasContent = true;
    if (key === 'trainingExperience' && trainingExperience && trainingExperience.length > 0) hasContent = true;
    if (key === 'openSource' && openSource && openSource.length > 0) hasContent = true;
    if (key === 'honorAward' && honorAward && honorAward.length > 0) hasContent = true;
    if (key === 'certificate' && certificate && certificate.length > 0) hasContent = true;
    if (key === 'languageSkill' && languageSkill && languageSkill.length > 0) hasContent = true;
    if (key === 'competition' && competition && competition.length > 0) hasContent = true;
    if (key === 'researchPublication' && researchPublication && researchPublication.length > 0) hasContent = true;

    if (!hasContent) return;

    // 确定大模块的 marginTop
    const sectionMarginTop = isFirstSection ? 0 : (theme.sectionGap ?? 16);
    isFirstSection = false;

    if (key === 'education' && education.length > 0) {
      elements.push(
        <SectionTitle key="edu-title" title="教育经历" theme={theme} marginTop={sectionMarginTop} />
      );
      education.forEach((edu, idx) => {
        const itemGroup = `edu-${edu.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`edu-header-${edu.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`edu-header|${edu.id}|${edu.school}|${edu.major}|${edu.degree}|${edu.startDate}|${edu.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{edu.school}</span>
              <DateRange start={edu.startDate} end={edu.endDate} />
            </div>
            <div className="text-[0.82em] text-gray-800 tracking-wide" style={{ whiteSpace: 'pre-wrap' }}>{edu.major} · {edu.degree}</div>
          </div>
        );
        if (edu.description) {
          const blocks = splitMarkdownToBlocks(edu.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`edu-desc-${edu.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`edu-desc|${edu.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'workExperience' && workExperience.length > 0) {
      elements.push(
        <SectionTitle key="work-title" title="工作经历" theme={theme} marginTop={sectionMarginTop} />
      );
      workExperience.forEach((w, idx) => {
        const itemGroup = `work-${w.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`work-header-${w.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`work-header|${w.id}|${w.company}|${w.position}|${w.startDate}|${w.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>
                {w.company}{w.position ? ` - ${w.position}` : ''}
              </span>
              <DateRange start={w.startDate} end={w.endDate} />
            </div>
          </div>
        );
        if (w.description) {
          const blocks = splitMarkdownToBlocks(w.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`work-desc-${w.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`work-desc|${w.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'projects' && projects.length > 0) {
      elements.push(
        <SectionTitle key="proj-title" title="项目经历" theme={theme} marginTop={sectionMarginTop} />
      );
      projects.forEach((p, idx) => {
        const itemGroup = `proj-${p.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`proj-header-${p.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`proj-header|${p.id}|${p.company}|${p.position}|${p.startDate}|${p.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>
                {p.company}{p.position ? ` - ${p.position}` : ''}
              </span>
              <DateRange start={p.startDate} end={p.endDate} />
            </div>
          </div>
        );
        if (p.description) {
          const blocks = splitMarkdownToBlocks(p.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`proj-desc-${p.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`proj-desc|${p.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'skills' && skills) {
      elements.push(
        <SectionTitle key="skills-title" title="专业技能" theme={theme} marginTop={sectionMarginTop} />
      );
      if (typeof skills === 'string') {
        const blocks = splitMarkdownToBlocks(skills);
        blocks.forEach((block, idx) => {
          elements.push(
            <div
              key={`skills-desc-${idx}`}
              data-type="item-desc"
              data-group="skills"
              data-cache-key={`skills-desc|${idx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
              className="resume-item"
            >
              <MdContent content={block} />
            </div>
          );
        });
      } else if (Array.isArray(skills)) {
        (skills as any[]).forEach((s) => {
          elements.push(
            <div
              key={`skills-item-${s.id}`}
              data-type="item-single"
              data-group="skills"
              data-cache-key={`skills-item|${s.id}|${s.category}|${s.content}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
              className="flex gap-2 text-[0.84em] resume-item tracking-wide"
            >
              {s.category && <span className="font-semibold shrink-0 min-w-[4em]">{s.category}：</span>}
              <span className="text-gray-800">{s.content}</span>
            </div>
          );
        });
      }
    }

    if (key === 'selfEvaluation' && selfEvaluation) {
      elements.push(
        <SectionTitle key="self-eval-title" title="自我评价" theme={theme} marginTop={sectionMarginTop} />
      );
      const blocks = splitMarkdownToBlocks(selfEvaluation);
      blocks.forEach((block, idx) => {
        elements.push(
          <div
            key={`self-eval-desc-${idx}`}
            data-type="item-desc"
            data-group="self-eval"
            data-cache-key={`self-eval-desc|${idx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
            className="resume-item"
          >
            <MdContent content={block} />
          </div>
        );
      });
    }

    if (key === 'customSections' && data.customSections && data.customSections.length > 0) {
      data.customSections.forEach((cs) => {
        elements.push(
          <SectionTitle key={`custom-title-${cs.id}`} title={cs.title} theme={theme} marginTop={sectionMarginTop} />
        );
        const blocks = splitMarkdownToBlocks(cs.content);
        blocks.forEach((block, idx) => {
          elements.push(
            <div
              key={`custom-desc-${cs.id}-${idx}`}
              data-type="item-desc"
              data-group={`custom-${cs.id}`}
              data-cache-key={`custom-desc|${cs.id}|${idx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
              className="resume-item"
            >
              <MdContent content={block} />
            </div>
          );
        });
      });
    }

    if (key === 'campusExperience' && campusExperience && campusExperience.length > 0) {
      elements.push(
        <SectionTitle key="campus-title" title="校园经历" theme={theme} marginTop={sectionMarginTop} />
      );
      campusExperience.forEach((c, idx) => {
        const itemGroup = `campus-${c.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`campus-header-${c.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`campus-header|${c.id}|${c.company}|${c.position}|${c.startDate}|${c.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>
                {c.company}{c.position ? ` - ${c.position}` : ''}
              </span>
              <DateRange start={c.startDate} end={c.endDate} />
            </div>
          </div>
        );
        if (c.description) {
          const blocks = splitMarkdownToBlocks(c.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`campus-desc-${c.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`campus-desc|${c.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'trainingExperience' && trainingExperience && trainingExperience.length > 0) {
      elements.push(
        <SectionTitle key="train-title" title="培训经历" theme={theme} marginTop={sectionMarginTop} />
      );
      trainingExperience.forEach((t, idx) => {
        const itemGroup = `train-${t.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`train-header-${t.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`train-header|${t.id}|${t.company}|${t.position}|${t.startDate}|${t.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>
                {t.company}{t.position ? ` - ${t.position}` : ''}
              </span>
              <DateRange start={t.startDate} end={t.endDate} />
            </div>
          </div>
        );
        if (t.description) {
          const blocks = splitMarkdownToBlocks(t.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`train-desc-${t.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`train-desc|${t.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'openSource' && openSource && openSource.length > 0) {
      elements.push(
        <SectionTitle key="os-title" title="开源项目与作品" theme={theme} marginTop={sectionMarginTop} />
      );
      openSource.forEach((os, idx) => {
        const itemGroup = `os-${os.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`os-header-${os.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`os-header|${os.id}|${os.company}|${os.position}|${os.startDate}|${os.endDate}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>
                {os.company}{os.position ? ` - ${os.position}` : ''}
              </span>
              <DateRange start={os.startDate} end={os.endDate} />
            </div>
          </div>
        );
        if (os.description) {
          const blocks = splitMarkdownToBlocks(os.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`os-desc-${os.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`os-desc|${os.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }

    if (key === 'honorAward' && honorAward && honorAward.length > 0) {
      elements.push(
        <SectionTitle key="honor-title" title="荣誉奖项" theme={theme} marginTop={sectionMarginTop} />
      );
      honorAward.forEach((item, idx) => {
        elements.push(
          <div
            key={`honor-item-${item.id}`}
            data-type="item-single"
            data-group="honor"
            data-cache-key={`honor-item|${item.id}|${item.name}|${item.description}|${item.date}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${idx === 0}`}
            className="flex justify-between items-baseline text-[0.84em] resume-item tracking-wide"
            style={{ marginTop: idx === 0 ? '0px' : '6px' }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <span className="font-semibold">{item.name}</span>
              {item.description && <span className="text-gray-800 ml-2">({item.description})</span>}
            </div>
            <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
          </div>
        );
      });
    }

    if (key === 'certificate' && certificate && certificate.length > 0) {
      elements.push(
        <SectionTitle key="cert-title" title="证书资质" theme={theme} marginTop={sectionMarginTop} />
      );
      certificate.forEach((item, idx) => {
        elements.push(
          <div
            key={`cert-item-${item.id}`}
            data-type="item-single"
            data-group="cert"
            data-cache-key={`cert-item|${item.id}|${item.name}|${item.date}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${idx === 0}`}
            className="flex justify-between items-baseline text-[0.84em] resume-item tracking-wide"
            style={{ marginTop: idx === 0 ? '0px' : '6px' }}
          >
            <span className="font-semibold" style={{ whiteSpace: 'pre-wrap' }}>{item.name}</span>
            <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
          </div>
        );
      });
    }

    if (key === 'languageSkill' && languageSkill && languageSkill.length > 0) {
      elements.push(
        <SectionTitle key="lang-title" title="语言能力" theme={theme} marginTop={sectionMarginTop} />
      );
      languageSkill.forEach((item, idx) => {
        elements.push(
          <div
            key={`lang-item-${item.id}`}
            data-type="item-single"
            data-group="lang"
            data-cache-key={`lang-item|${item.id}|${item.name}|${item.level}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${idx === 0}`}
            className="flex justify-between items-baseline text-[0.84em] resume-item tracking-wide"
            style={{ marginTop: idx === 0 ? '0px' : '6px' }}
          >
            <span className="font-semibold" style={{ whiteSpace: 'pre-wrap' }}>{item.name}</span>
            <span className="text-gray-800 text-[0.95em] text-right flex-1 ml-4" style={{ whiteSpace: 'pre-wrap' }}>{item.level}</span>
          </div>
        );
      });
    }

    if (key === 'competition' && competition && competition.length > 0) {
      elements.push(
        <SectionTitle key="comp-title" title="竞赛经历" theme={theme} marginTop={sectionMarginTop} />
      );
      competition.forEach((item, idx) => {
        elements.push(
          <div
            key={`comp-item-${item.id}`}
            data-type="item-single"
            data-group="comp"
            data-cache-key={`comp-item|${item.id}|${item.name}|${item.award}|${item.date}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${idx === 0}`}
            className="flex justify-between items-baseline text-[0.84em] resume-item tracking-wide"
            style={{ marginTop: idx === 0 ? '0px' : '6px' }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <span className="font-semibold">{item.name}</span>
              <span className="text-gray-800 ml-2 font-medium" style={{ color, whiteSpace: 'pre-wrap' }}>{item.award}</span>
            </div>
            <span className="text-gray-800 text-[0.9em] shrink-0">{item.date}</span>
          </div>
        );
      });
    }

    if (key === 'researchPublication' && researchPublication && researchPublication.length > 0) {
      elements.push(
        <SectionTitle key="pub-title" title="专利/著作/论文" theme={theme} marginTop={sectionMarginTop} />
      );
      researchPublication.forEach((pub, idx) => {
        const itemGroup = `pub-${pub.id}`;
        const headerMarginTop = idx === 0 ? '0px' : `${gap * 0.6}px`;
        elements.push(
          <div
            key={`pub-header-${pub.id}`}
            data-type="item-header"
            data-group={itemGroup}
            data-cache-key={`pub-header|${pub.id}|${pub.name}|${pub.date}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}|${gap}|${idx === 0}`}
            className="resume-item"
            style={{ marginTop: headerMarginTop }}
          >
            <div className="flex items-baseline justify-between tracking-wide">
              <span className="font-semibold text-[0.88em]" style={{ whiteSpace: 'pre-wrap' }}>{pub.name}</span>
              <span className="text-[0.78em] text-gray-800 shrink-0">{pub.date}</span>
            </div>
          </div>
        );
        if (pub.description) {
          const blocks = splitMarkdownToBlocks(pub.description);
          blocks.forEach((block, bIdx) => {
            elements.push(
              <div
                key={`pub-desc-${pub.id}-${bIdx}`}
                data-type="item-desc"
                data-group={itemGroup}
                data-cache-key={`pub-desc|${pub.id}|${bIdx}|${block}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
                className="resume-item"
              >
                <MdContent content={block} />
              </div>
            );
          });
        }
      });
    }
  });

  return elements;
}

interface ClassicTemplateProps {
  data: ResumeData;
  elementIndices?: number[];
}

export const FONT_FALLBACKS: Record<string, string> = {
  'Noto Serif SC': 'var(--font-noto-serif), "Noto Serif SC", Georgia, "Nimbus Roman No9 L", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "Source Han Serif CN", STSong, "AR PL New Sung", "AR PL UMing CN", SimSun, serif',
  'Noto Sans SC': 'var(--font-noto-sans), var(--font-inter), "Noto Sans SC", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  'Inter': 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};


export default function ClassicTemplate({ data, elementIndices }: ClassicTemplateProps) {
  const flatElements = getFlatElements(data);
  const fontFamilyValue = FONT_FALLBACKS[data.theme.fontFamily] || data.theme.fontFamily;

  return (
    <div
      className="w-full h-full bg-white text-gray-800 break-all tracking-wide"
      style={{
        fontFamily: fontFamilyValue,
        fontSize: `${data.theme.fontSize}px`,
        lineHeight: data.theme.lineHeight,
      }}
    >
      {elementIndices
        ? elementIndices.map((idx) => flatElements[idx] || null)
        : flatElements}
    </div>
  );
}
