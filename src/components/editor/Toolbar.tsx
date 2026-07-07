'use client';

import { Download, RotateCcw, Cloud, CloudOff, LogOut, User, Sliders, Image as ImageIcon, Loader2, Layers, Plus, Trash2, Edit3, FileUp, FileDown, Database, Check, Sparkles, X, Github } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import LoginModal from './LoginModal';
import { cn } from '@/lib/utils';
import { ResumeTheme } from '@/types/resume';
import { Select, Switch, Dropdown, Menu, Input, Modal, Message, Popconfirm, Tooltip } from '@arco-design/web-react';

const THEME_COLORS = [
  { label: '智慧紫', value: '#7C3AED' },
  { label: '商务蓝', value: '#2563EB' },
  { label: '科技蓝', value: '#0091FF' },
  { label: '沉稳黑', value: '#1E293B' },
  { label: '精英灰', value: '#475569' },
  { label: '活力橙', value: '#EA580C' },
  { label: '高雅绿', value: '#16A34A' },
  { label: '经典红', value: '#DC2626' },
];

interface ToolbarProps {
  authorized: boolean;
  onStartEdit: () => void;
  onLogout: () => void;
}

export default function Toolbar({ authorized, onStartEdit, onLogout }: ToolbarProps) {
  const { 
    resume, updateTheme, resetResume,
    resumes, currentResumeId, switchResume, createResume, deleteResume, renameResume,
    importSingleResume, importBackupPackage, pages
  } = useResumeStore();
  const { isLoggedIn, user, logout } = useAuthStore();
  
  const style = resume.theme.dividerStyle || 'left-bar';
  const isVerticalStyle = style === 'left-bar' || style === 'watermark-bar';
  const isCustomColor = !THEME_COLORS.some(
    (c) => c.value.toLowerCase() === (resume.theme.primaryColor || '#7C3AED').toLowerCase()
  );
  
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
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    createResume();
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
      const name = resume.resumeName || resume.basicInfo.name || '我的简历';
      a.download = `${name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      Message.error('导出失败，请重试');
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
      Message.error('导出失败，请重试');
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
          Modal.confirm({
            title: '导入备份确认',
            content: `检测到备份包中含有 ${parsed.resumes.length} 份简历。请选择您的导入方式：`,
            footer: (okAnchor, cancelAnchor) => {
              return (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => Modal.destroyAll()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    取消导入
                  </button>
                  <button
                    onClick={() => {
                      importBackupPackage(parsed.resumes, false);
                      Message.success('已成功合并追加简历列表！');
                      Modal.destroyAll();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer border border-indigo-200/50 bg-transparent"
                  >
                    合并追加列表
                  </button>
                  <button
                    onClick={() => {
                      importBackupPackage(parsed.resumes, true);
                      Message.success('已成功覆盖恢复所有简历！');
                      Modal.destroyAll();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer border-0"
                  >
                    覆盖本地简历
                  </button>
                </div>
              );
            }
          });
        } else if (parsed.basicInfo && parsed.theme && parsed.sectionOrder) {
          importSingleResume(parsed);
          Message.success(`成功导入简历：“${parsed.basicInfo.name || '未命名'}”！已为您切换至该简历。`);
        } else {
          Message.error('文件格式不正确，未能检测到合法的简历数据字段。');
        }
      } catch (err) {
        Message.error('文件读取解析失败，请确保上传的是有效的 JSON 备份文件。');
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
      const name = resume.resumeName || `${resume.basicInfo.name}_简历` || '我的简历';
      a.download = `${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      Message.error('PDF 生成失败，请稍后重试');
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
      const name = resume.resumeName || `${resume.basicInfo.name}_简历` || '我的简历';
      a.download = `${name}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      Message.error('图片生成失败，请稍后重试');
      console.error(e);
    } finally {
      setExportingImage(false);
    }
  };

  const exportMenu = (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-xl p-1 flex flex-col gap-0.5 min-w-[125px] select-none z-50">
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border-0 cursor-pointer bg-transparent w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? <Loader2 size={13} className="animate-spin text-slate-400" /> : <Download size={13} className="text-slate-400" />}
        <span>下载 PDF</span>
      </button>
      <button
        onClick={handleDownloadImage}
        disabled={exportingImage}
        className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border-0 cursor-pointer bg-transparent w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportingImage ? <Loader2 size={13} className="animate-spin text-slate-400" /> : <ImageIcon size={13} className="text-slate-400" />}
        <span>导出图片</span>
      </button>
      {authorized && (
        <>
          <div className="h-px bg-slate-100 my-1 mx-1.5" />
          <Popconfirm
            focusLock
            title="确定重置所有内容吗？"
            content="此操作将清空当前简历的所有编辑内容，且无法撤销。"
            okButtonProps={{ status: 'danger' }}
            onOk={() => {
              resetResume();
              Message.success('简历内容已重置');
            }}
            okText="确定"
            cancelText="取消"
          >
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors border-0 cursor-pointer bg-transparent w-full text-left"
            >
              <RotateCcw size={13} className="text-red-400" />
              <span>重置简历</span>
            </button>
          </Popconfirm>
        </>
      )}
    </div>
  );

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
      {authorized && (
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
      )}

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
                        className={`group px-2 h-[46px] rounded-lg border transition-all duration-150 flex items-center justify-between gap-2 shrink-0
                          ${isCurrent 
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' 
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'}`}
                      >
                        {isEditing ? (
                          <>
                            <div className="flex-1 min-w-0 flex items-center">
                              <Input
                                size="mini"
                                value={renameValue}
                                onChange={(val) => setRenameValue(val)}
                                onPressEnter={() => handleRenameConfirm(r.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setEditingResumeId(null);
                                }}
                                autoFocus
                                className="w-full text-xs"
                                style={{ height: 24 }}
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0 w-[48px] justify-end">
                              <button
                                onClick={() => handleRenameConfirm(r.id)}
                                title="保存"
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none shrink-0"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                onClick={() => setEditingResumeId(null)}
                                title="取消"
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none shrink-0"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div 
                              onClick={() => !isCurrent && switchResume(r.id)}
                              className="flex-1 min-w-0 text-left cursor-pointer select-none py-1"
                            >
                              <Tooltip content={r.resumeName || `${r.basicInfo.name || '未命名'}_简历`}>
                                <div className="text-xs font-bold text-slate-700 truncate leading-snug">
                                  {r.resumeName || `${r.basicInfo.name || '未命名'}_简历`}
                                </div>
                              </Tooltip>
                              <div className="text-[9px] text-slate-400 truncate mt-0.5 leading-none">
                                {r.basicInfo.jobTitle || '暂无求职意向'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 w-[48px] justify-end">
                              <button
                                onClick={() => {
                                  setEditingResumeId(r.id);
                                  setRenameValue(r.resumeName || `${r.basicInfo.name || '未命名'}_简历`);
                                }}
                                title="重命名"
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none"
                              >
                                <Edit3 size={11} />
                              </button>
                              {resumes.length > 1 && (
                                <Popconfirm
                                  focusLock
                                  title="确定删除此简历吗？"
                                  content="删除后将无法恢复，确认删除？"
                                  okButtonProps={{ status: 'danger' }}
                                  onOk={() => {
                                    deleteResume(r.id);
                                    Message.success('简历删除成功');
                                  }}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <button
                                    title="删除"
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded cursor-pointer bg-transparent border-0 focus:outline-none"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </Popconfirm>
                              )}
                            </div>
                          </>
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
        {authorized && (
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
                    <div className="grid grid-cols-9 gap-1.5 items-center">
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

                      {/* 自定义颜色按钮 */}
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <button
                          title="自定义颜色"
                          onClick={() => colorInputRef.current?.click()}
                          className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white"
                          style={{
                            borderColor: isCustomColor ? (resume.theme.primaryColor || '#7C3AED') : 'transparent',
                            boxShadow: isCustomColor ? `0 0 0 2px white, 0 0 0 3px ${resume.theme.primaryColor || '#7C3AED'}` : undefined,
                          }}
                        >
                          <Plus size={12} className="stroke-[3]" />
                        </button>
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={resume.theme.primaryColor || '#7C3AED'}
                          onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                          className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 字体与字号 */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">字体</label>
                      <Select
                        size="small"
                        value={resume.theme.fontFamily}
                        onChange={(val) => updateTheme({ fontFamily: val })}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="Noto Serif SC">思源宋体</Select.Option>
                        <Select.Option value="Noto Sans SC">思源黑体</Select.Option>
                        <Select.Option value="Inter">Inter</Select.Option>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">基准字号</label>
                      <Select
                        size="small"
                        value={resume.theme.fontSize}
                        onChange={(val) => updateTheme({ fontSize: val })}
                        style={{ width: '100%' }}
                      >
                        {[12, 13, 14, 15, 16].map((s) => (
                          <Select.Option key={s} value={s}>{s}px</Select.Option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* 标题装饰风格 */}
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题装饰风格</label>
                    <Select
                      size="small"
                      value={resume.theme.dividerStyle || 'left-bar'}
                      onChange={(val) => updateTheme({ dividerStyle: val })}
                      style={{ width: '100%' }}
                    >
                      <Select.Option value="left-bar">高端竖条</Select.Option>
                      <Select.Option value="skew-block">斜角底色块</Select.Option>
                      <Select.Option value="light-line">轻盈细线</Select.Option>
                      <Select.Option value="watermark-bar">通栏底色条</Select.Option>
                      <Select.Option value="solid">经典横线</Select.Option>
                      <Select.Option value="none">无装饰极简</Select.Option>
                    </Select>
                  </div>
                  
                  {/* 线条粗细与背景开关 (并排展示) */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                        {isVerticalStyle ? '竖线宽度' : '横线粗细'}
                      </label>
                      <Select
                        size="small"
                        value={resume.theme.dividerHeight ?? 4}
                        onChange={(val) => updateTheme({ dividerHeight: val })}
                        style={{ width: '100%' }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((w) => (
                          <Select.Option key={w} value={w}>{w}px</Select.Option>
                        ))}
                      </Select>
                    </div>
                  
                    {style === 'left-bar' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题底色</label>
                        <div className="flex items-center h-8">
                          <Switch
                            checked={resume.theme.enableTitleBg}
                            onChange={(val) => updateTheme({ enableTitleBg: val })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 模块间距 & 行高倍数 */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">模块间距</label>
                      <Select
                        size="small"
                        value={resume.theme.sectionGap ?? 16}
                        onChange={(val) => updateTheme({ sectionGap: val })}
                        style={{ width: '100%' }}
                      >
                        {[8, 12, 16, 20, 24, 28].map((g) => (
                          <Select.Option key={g} value={g}>{g}px</Select.Option>
                        ))}
                      </Select>
                    </div>
                  
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">文本行高</label>
                      <Select
                        size="small"
                        value={resume.theme.lineHeight ?? 1.6}
                        onChange={(val) => updateTheme({ lineHeight: val })}
                        style={{ width: '100%' }}
                      >
                        {[1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0].map((lh) => (
                          <Select.Option key={lh} value={lh}>{lh.toFixed(1)}倍</Select.Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 登录状态 */}
        {authorized && (
          isLoggedIn ? (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg py-1 px-1.5 mr-0.5 animate-fade-in">
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
              <Cloud size={13} />
              云同步
            </button>
          )
        )}

        <Dropdown trigger="click" droplist={exportMenu} position="bl">
          <button className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] active:scale-95 bg-transparent border-0 cursor-pointer select-none rounded transition-all duration-150 focus:outline-none">
            <Download size={13} />
            导出
          </button>
        </Dropdown>

        <a
          href="https://github.com/Aoyia/AI-resume-design"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub 仓库"
          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg active:scale-90 transition-all duration-150 focus:outline-none"
        >
          <Github size={14} />
        </a>

        {!authorized ? (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm hover:shadow-md cursor-pointer select-none rounded-lg transition-all duration-150 animate-pulse border-0 focus:outline-none"
          >
            <Sparkles size={13} />
            开始编辑
          </button>
        ) : (
          <Popconfirm
            focusLock
            position="br"
            title="确定要锁定编辑吗？"
            content="切回纯净预览模式，本地草稿不会丢失。"
            onOk={onLogout}
            okText="确定"
            cancelText="取消"
          >
            <button
              className="flex items-center justify-center p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50/60 active:scale-90 bg-transparent border-0 cursor-pointer select-none rounded-lg transition-all duration-150 focus:outline-none"
              title="锁定编辑并返回纯净预览"
            >
              <LogOut size={14} />
            </button>
          </Popconfirm>
        )}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}
