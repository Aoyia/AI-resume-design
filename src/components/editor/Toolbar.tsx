'use client';

import { Download, RotateCcw, Cloud, CloudOff, LogOut, User, Sliders, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import LoginModal from './LoginModal';

const THEME_COLORS = [
  { label: '商务蓝', value: '#2563EB' },
  { label: '沉稳黑', value: '#1E293B' },
  { label: '精英灰', value: '#475569' },
  { label: '活力橙', value: '#EA580C' },
  { label: '高雅绿', value: '#16A34A' },
  { label: '经典红', value: '#DC2626' },
];

export default function Toolbar() {
  const { resume, updateTheme, resetResume } = useResumeStore();
  const { isLoggedIn, user, logout } = useAuthStore();
  
  const [downloading, setDownloading] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('offline');

  // 模拟云端自动保存状态
  useEffect(() => {
    if (!isLoggedIn) {
      setSyncStatus('offline');
      return;
    }
    
    setSyncStatus('saving');
    const timer = setTimeout(() => {
      setSyncStatus('synced');
    }, 800);
    return () => clearTimeout(timer);
  }, [resume, isLoggedIn]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
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
        body: JSON.stringify({ resume, format: 'image' }),
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
    <header className="flex items-center gap-2 px-4 h-11 bg-white border-b border-[var(--border)] shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 group cursor-pointer select-none">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-100 transition-all duration-300 group-hover:shadow-md group-hover:shadow-indigo-200/50 group-hover:scale-102">
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
          <span className="ml-0.5 font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-600 group-hover:to-violet-600">
            ·源
          </span>
        </span>
      </div>

      <div className="w-px h-4 bg-[var(--border)]" />

      {/* 同步状态指示器 */}
      <div className="flex items-center gap-1.5 ml-1">
        {syncStatus === 'synced' && (
          <>
            <Cloud size={14} className="text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">数据已同步云端</span>
          </>
        )}
        {syncStatus === 'saving' && (
          <>
            <Cloud size={14} className="text-blue-500 animate-pulse" />
            <span className="text-xs text-blue-500 font-medium">云端同步中...</span>
          </>
        )}
        {syncStatus === 'offline' && (
          <>
            <CloudOff size={14} className="text-slate-400" />
            <span className="text-xs text-[var(--text-muted)]">本地草稿已自动保存</span>
          </>
        )}
      </div>

      {/* 右侧操作区 */}
      <div className="ml-auto flex items-center gap-1 relative">
        {/* 排版样式控制按钮与浮层 */}
        <div className="relative">
          <button
            onClick={() => setIsStylePanelOpen(!isStylePanelOpen)}
            className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 bg-transparent border-0 cursor-pointer select-none rounded transition-colors duration-150 focus:outline-none"
          >
            <Sliders size={13} />
            排版样式
          </button>

          {isStylePanelOpen && (
            <>
              {/* 透明遮罩，用于点击外部关闭 */}
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsStylePanelOpen(false)} />
              
              {/* 悬浮控制面板 (毛玻璃效果) */}
              <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-2xl z-30 flex flex-col gap-4 animate-scale-up min-w-[260px]">
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
              className="text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 bg-transparent border-0 cursor-pointer select-none rounded transition-colors duration-150 focus:outline-none"
          >
            登录/云同步
          </button>
        )}

        <button
          onClick={() => { if (confirm('确定重置所有内容？')) resetResume(); }}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 bg-transparent border-0 cursor-pointer select-none rounded transition-colors duration-150 focus:outline-none"
        >
          <RotateCcw size={14} />
          重置
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={exportingImage}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 bg-transparent border-0 cursor-pointer select-none rounded transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          导出图片
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 bg-transparent border-0 cursor-pointer select-none rounded transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          下载 PDF
        </button>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}
