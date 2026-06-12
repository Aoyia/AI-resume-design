'use client';

import { Download, RotateCcw, Cloud, CloudOff, LogOut, User, Sliders, Image as ImageIcon, Loader2, Layers, Plus, Trash2, Edit3, FileUp, FileDown, Database, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import LoginModal from './LoginModal';
import { cn } from '@/lib/utils';

const THEME_COLORS = [
  { label: '智慧紫', value: '#7C3AED' },
  { label: '商务蓝', value: '#2563EB' },
  { label: '沉稳黑', value: '#1E293B' },
  { label: '精英灰', value: '#475569' },
  { label: '活力橙', value: '#EA580C' },
  { label: '高雅绿', value: '#16A34A' },
  { label: '经典红', value: '#DC2626' },
];

export default function Toolbar() {
  const { 
    resume, updateTheme, resetResume,
    resumes, currentResumeId, switchResume, createResume, deleteResume, renameResume,
    importSingleResume, importBackupPackage, pages
  } = useResumeStore();
  const { isLoggedIn, user, logout } = useAuthStore();
  
  const [downloading, setDownloading] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('offline');
  const [pulseActive, setPulseActive] = useState(false);
  const isFirstRender = useRef(true);

  // 多简历管理与导入导出状态
  const [isResumeManagerOpen, setIsResumeManagerOpen] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    createResume();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除简历“${name || '未命名'}”吗？此操作不可撤销。`)) {
      deleteResume(id);
    }
  };

  const handleRenameConfirm = (id: string) => {
    if (renameValue.trim()) {
      renameResume(id, renameValue.trim());
    }
    setEditingResumeId(null);
  };

  const handleExportCurrent = () => {
    try {
      const dataStr = JSON.stringify(resume, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = resume.basicInfo.name || '我的简历';
      a.download = `${name}_简历配置.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败，请重试');
      console.error(e);
    }
  };

  const handleExportAll = () => {
    try {
      const backupData = {
        type: 'resume-backup-package',
        version: 1,
        exportedAt: new Date().toISOString(),
        resumes: resumes,
      };
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `全部简历备份_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败，请重试');
      console.error(e);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // 校验是备份包还是单份简历
        if (parsed.type === 'resume-backup-package' && Array.isArray(parsed.resumes)) {
          const action = confirm(
            `检测到备份包中含有 ${parsed.resumes.length} 份简历。\n点击“确定”将覆盖本地所有简历，点击“取消”将合并追加到当前列表。`
          );
          importBackupPackage(parsed.resumes, action);
          alert(action ? '已成功覆盖恢复所有简历！' : '已成功合并追加简历列表！');
        } else if (parsed.basicInfo && parsed.theme && parsed.sectionOrder) {
          importSingleResume(parsed);
          alert(`成功导入简历：“${parsed.basicInfo.name || '未命名'}”！已为您切换至该简历。`);
        } else {
          alert('文件格式不正确，未能检测到合法的简历数据字段。');
        }
      } catch (err) {
        alert('文件读取解析失败，请确保上传的是有效的 JSON 备份文件。');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 模拟本地/云端自动保存状态
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    setSyncStatus('saving');
    
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
      // 触发自动保存的脉冲反馈
      setPulseActive(true);
      const pulseTimer = setTimeout(() => setPulseActive(false), 600);
      return () => clearTimeout(pulseTimer);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [resume, isLoggedIn]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, pages }),
      });
      if (!res.ok) throw new Error('PDF 生成失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = resume.basicInfo.name || '我的简历';
      const job = resume.basicInfo.jobTitle || '';
      a.download = `${name}${job ? `_${job}` : ''}_简历.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('PDF 生成失败，请稍后重试');
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    setExportingImage(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, pages, format: 'image' }),
      });
      if (!res.ok) throw new Error('图片生成失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = resume.basicInfo.name || '我的简历';
      const job = resume.basicInfo.jobTitle || '';
      a.download = `${name}${job ? `_${job}` : ''}_简历.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('图片生成失败，请稍后重试');
      console.error(e);
    } finally {
      setExportingImage(false);
    }
  };

  return (
    <header className="flex items-center gap-2 px-4 h-11 bg-white border-b border-[var(--border)] shrink-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 group cursor-pointer select-none">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--primary)] via-indigo-500 to-pink-500 flex items-center justify-center shadow-sm shadow-purple-100 transition-all duration-300 group-hover:shadow-md group-hover:shadow-purple-200/50 group-hover:scale-102">
          <svg 
            className="w-[18px] h-[18px] text-white transition-transform duration-300 group-hover:scale-105" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* 底层卡片，悬浮时向左上方微移 */}
            <path 
              d="M15 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" 
              className="opacity-60 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" 
            />
            {/* 顶层卡片，悬浮时向右下方微移 */}
            <path 
              d="M9 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9" 
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" 
            />
            {/* 闪烁的星芒，代表智慧与灵感源泉 */}
            <path 
              d="M20 2l-0.8 1.8-1.8 0.8 1.8 0.8 0.8 1.8 0.8-1.8 1.8-0.8-1.8-0.8z" 
              fill="currentColor" 
              stroke="none" 
              className="animate-pulse"
            />
          </svg>
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)] hidden sm:block tracking-wide transition-colors duration-300 group-hover:text-slate-900">
          简历制作
          <span className="ml-0.5 font-black bg-gradient-to-r from-[var(--primary)] to-pink-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-600 group-hover:to-pink-600">
            ·源
          </span>
        </span>
      </div>

      <div className="w-px h-4 bg-[var(--border)]" />

      {/* 同步状态指示器 */}
      <div className="flex items-center gap-1.5 ml-1 select-none">
        {syncStatus === 'saving' && (
          <>
            <Cloud className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            <span className="text-xs text-[var(--primary)] font-medium">
              {isLoggedIn ? '云端同步中...' : '本地保存中...'}
            </span>
          </>
        )}
        {syncStatus === 'synced' && (
          <div className={cn(
            "flex items-center gap-1.5 transition-all duration-300",
            pulseActive && "scale-105 text-emerald-500"
          )}>
            <Cloud className={cn(
              "w-3.5 h-3.5 transition-colors duration-300",
              pulseActive ? "text-emerald-500" : "text-emerald-500/80"
            )} />
            <span className="text-xs text-emerald-600 font-medium">数据已同步云端</span>
          </div>
        )}
        {syncStatus === 'offline' && (
          <div className={cn(
            "flex items-center gap-1.5 transition-all duration-300",
            pulseActive && "scale-[1.04] text-[var(--primary)]"
          )}>
            <CloudOff className={cn(
              "w-3.5 h-3.5 transition-colors duration-300",
              pulseActive ? "text-[var(--primary)]" : "text-slate-400"
            )} />
            <span className={cn(
              "text-xs font-medium transition-colors duration-300",
              pulseActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
            )}>本地草稿已自动保存</span>
          </div>
        )}
      </div>

      {/* 右侧操作区 */}
      <div className="ml-auto flex items-center gap-1 relative">
        {/* 我的简历管理按钮与浮层 */}
        <div className="relative">
          <button
            onClick={() => setIsResumeManagerOpen(!isResumeManagerOpen)}
            className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none"
          >
            <Layers size={13} />
            我的简历
          </button>

          {isResumeManagerOpen && (
            <>
              {/* 点击外部关闭 */}
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsResumeManagerOpen(false)} />
              
              {/* 简历管理面板 (毛玻璃效果) */}
              <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[var(--border)] shadow-2xl z-30 flex flex-col gap-4 animate-scale-up min-w-[280px] max-w-[340px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">简历列表管理</h4>
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer bg-transparent border-0 focus:outline-none"
                  >
                    <Plus size={10} />
                    新建
                  </button>
                </div>
                
                {/* 简历列表项 */}
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
                  {resumes.map((r) => {
                    const isCurrent = r.id === currentResumeId;
                    const isEditing = r.id === editingResumeId;
                    return (
                      <div
                        key={r.id}
                        className={`group p-2 rounded-lg border transition-all duration-150 flex items-center justify-between gap-2
                          ${isCurrent 
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' 
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'}`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm(r.id);
                                if (e.key === 'Escape') setEditingResumeId(null);
                              }}
                              autoFocus
                              className="w-full text-xs px-1.5 py-0.5 border border-[var(--primary)] rounded focus:outline-none bg-white"
                            />
                            <button
                              onClick={() => handleRenameConfirm(r.id)}
                              className="text-[var(--primary)] hover:text-[var(--primary-hover)] p-0.5 cursor-pointer bg-transparent border-0 focus:outline-none shrink-0"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => !isCurrent && switchResume(r.id)}
                            className="flex-1 min-w-0 text-left cursor-pointer select-none"
                          >
                            <div className="text-xs font-bold text-slate-700 truncate">
                              {r.basicInfo.name || '未命名'}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate mt-0.5">
                              {r.basicInfo.jobTitle || '暂无求职意向'}
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                            <button
                              onClick={() => {
                                setEditingResumeId(r.id);
                                setRenameValue(r.basicInfo.name || '');
                              }}
                              title="重命名"
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none"
                            >
                              <Edit3 size={11} />
                            </button>
                            {resumes.length > 1 && (
                              <button
                                onClick={() => handleDelete(r.id, r.basicInfo.name)}
                                title="删除"
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 导入与备份区域 */}
                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">备份与恢复</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleExportCurrent}
                      title="导出当前简历数据为 JSON"
                      className="flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 rounded-lg text-[10px] font-bold text-slate-600 hover:text-[var(--primary)] cursor-pointer bg-white transition-all duration-150 focus:outline-none"
                    >
                      <FileDown size={11} />
                      导出当前
                    </button>
                    <button
                      onClick={handleExportAll}
                      title="将所有简历打包导出备份"
                      className="flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 rounded-lg text-[10px] font-bold text-slate-600 hover:text-[var(--primary)] cursor-pointer bg-white transition-all duration-150 focus:outline-none"
                    >
                      <Database size={11} />
                      全部备份
                    </button>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="上传本地备份文件 (.json) 恢复简历"
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg text-[10px] font-bold text-white cursor-pointer border-0 shadow-sm transition-all duration-150 focus:outline-none"
                  >
                    <FileUp size={11} />
                    导入配置数据 (.json)
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 排版样式控制按钮与浮层 */}
        <div className="relative">
          <button
            onClick={() => setIsStylePanelOpen(!isStylePanelOpen)}
            className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none"
          >
            <Sliders size={13} />
            排版样式
          </button>

          {isStylePanelOpen && (
            <>
              {/* 透明遮罩，用于点击外部关闭 */}
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsStylePanelOpen(false)} />
              
              {/* 悬浮控制面板 (毛玻璃效果) */}
              <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[var(--border)] shadow-2xl z-30 flex flex-col gap-4 animate-scale-up min-w-[260px]">
                <h4 className="text-xs font-bold text-[var(--text-primary)] border-b border-slate-100 pb-1.5">排版样式设置</h4>
                
                {/* 主题色 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)]">主题颜色</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {THEME_COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => updateTheme({ primaryColor: c.value })}
                        className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                        style={{
                          backgroundColor: c.value,
                          borderColor: resume.theme.primaryColor === c.value ? c.value : 'transparent',
                          boxShadow: resume.theme.primaryColor === c.value ? `0 0 0 2px white, 0 0 0 3px ${c.value}` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 字体与字号 */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">字体</label>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      value={resume.theme.fontFamily}
                      onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                    >
                      <option value="Noto Serif SC">思源宋体</option>
                      <option value="Noto Sans SC">思源黑体</option>
                      <option value="Inter">Inter</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">基准字号</label>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      value={resume.theme.fontSize}
                      onChange={(e) => updateTheme({ fontSize: Number(e.target.value) })}
                    >
                      {[12, 13, 14, 15, 16].map((s) => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 标题装饰风格 */}
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题装饰风格</label>
                  <select
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    value={resume.theme.dividerStyle || 'left-bar'}
                    onChange={(e) => updateTheme({ dividerStyle: e.target.value as any })}
                  >
                    <option value="left-bar">✨ 高端竖条</option>
                    <option value="solid">经典横线</option>
                    <option value="none">无装饰极简</option>
                    <option value="pill">🏷️ 药丸胶囊</option>
                    <option value="bordered-box">🔲 线框卡片</option>
                  </select>
                </div>
                
                {/* 线条粗细与背景开关 (并排展示) */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                      {(resume.theme.dividerStyle || 'left-bar') === 'left-bar' ? '竖线宽度' : '横线粗细'}
                    </label>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      value={resume.theme.dividerHeight ?? 4}
                      onChange={(e) => updateTheme({ dividerHeight: Number(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5, 6].map((w) => (
                        <option key={w} value={w}>{w}px</option>
                      ))}
                    </select>
                  </div>
                
                  {(resume.theme.dividerStyle || 'left-bar') === 'left-bar' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题底色</label>
                      <div className="flex items-center h-8">
                        <button
                          onClick={() => updateTheme({ enableTitleBg: !resume.theme.enableTitleBg })}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            resume.theme.enableTitleBg ? 'bg-[var(--primary)]' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              resume.theme.enableTitleBg ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 模块间距 & 行高倍数 */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">模块间距</label>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      value={resume.theme.sectionGap ?? 16}
                      onChange={(e) => updateTheme({ sectionGap: Number(e.target.value) })}
                    >
                      {[8, 12, 16, 20, 24, 28].map((g) => (
                        <option key={g} value={g}>{g}px</option>
                      ))}
                    </select>
                  </div>
                
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">文本行高</label>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      value={resume.theme.lineHeight ?? 1.6}
                      onChange={(e) => updateTheme({ lineHeight: Number(e.target.value) })}
                    >
                      {[1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0].map((lh) => (
                        <option key={lh} value={lh}>{lh.toFixed(1)}倍</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 登录状态 */}
        {isLoggedIn ? (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg py-1 px-1.5 mr-0.5">
            <User size={13} className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)] font-medium max-w-[80px] truncate">
              {user}
            </span>
            <button
              onClick={logout}
              title="退出登录"
              className="text-[var(--text-muted)] hover:text-red-500 active:scale-90 transition-all duration-150 cursor-pointer bg-transparent border-0 focus:outline-none"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none"
          >
            登录/云同步
          </button>
        )}

        <button
          onClick={() => { if (confirm('确定重置所有内容？')) resetResume(); }}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none"
        >
          <RotateCcw size={14} />
          重置
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={exportingImage}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          导出图片
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          下载 PDF
        </button>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}
