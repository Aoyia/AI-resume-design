'use client';

import { useState, useRef } from 'react';
import { Upload, Trash2, Link as LinkIcon } from 'lucide-react';
import Input from '@/components/ui/Input';
import { useResumeStore } from '@/store/useResumeStore';

export default function BasicInfoForm() {
  const info = useResumeStore((s) => s.resume.basicInfo);
  const updateBasicInfo = useResumeStore((s) => s.updateBasicInfo);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 300;
        const maxH = 400; // 适应一寸照 3:4 比例
        let width = img.width;
        let height = img.height;

        // 等比缩放，防止变形
        if (width / height > 3 / 4) {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        } else {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateBasicInfo({ avatar: dataUrl });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 头像上传与管理区域 */}
      <div className="col-span-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl mb-1 flex gap-4 items-start">
        {/* 拖拽/点击上传卡片 */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-20 h-28 shrink-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden group select-none
            ${info.avatar ? 'border-slate-200' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'}
            ${isDragActive ? 'border-blue-500 bg-blue-50/40' : ''}`}
        >
          {info.avatar ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={info.avatar} alt="头像预览" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 text-white">
                <Upload size={14} />
                <span className="text-[9px] font-semibold">更换照片</span>
              </div>
            </>
          ) : (
            <div className="text-center p-2 flex flex-col items-center text-slate-400 group-hover:text-blue-500">
              <Upload size={18} className="mb-1" />
              <span className="text-[10px] font-semibold">上传照片</span>
              <span className="text-[8px] text-slate-400 mt-0.5">支持拖拽</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 控制与提示区域 */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-slate-700">个人照片</h5>
            <p className="text-[10px] text-slate-400 leading-normal">
              推荐一寸证件照比例。支持拖拽或直接上传，系统将自动进行尺寸压缩，确保简历加载流畅。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-blue-200 rounded-lg cursor-pointer transition-colors"
            >
              本地上传
            </button>
            {info.avatar && (
              <button
                type="button"
                onClick={() => updateBasicInfo({ avatar: '' })}
                className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-red-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                清除照片
              </button>
            )}
          </div>

          {/* 网络 URL 输入 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <LinkIcon size={9} />
              <span>或输入网络照片链接</span>
            </div>
            <input
              type="text"
              value={info.avatar?.startsWith('data:') ? '' : (info.avatar || '')}
              onChange={(e) => updateBasicInfo({ avatar: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="w-full text-xs px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      <Input
        label="姓名"
        value={info.name}
        onChange={(e) => updateBasicInfo({ name: e.target.value })}
        placeholder="张三"
        className="col-span-2"
      />
      <Input
        label="求职意向"
        value={info.jobTitle}
        onChange={(e) => updateBasicInfo({ jobTitle: e.target.value })}
        placeholder="前端工程师"
        className="col-span-2"
      />
      <Input
        label="手机号"
        value={info.phone}
        onChange={(e) => updateBasicInfo({ phone: e.target.value })}
        placeholder="138 0000 0000"
        type="tel"
      />
      <Input
        label="邮箱"
        value={info.email}
        onChange={(e) => updateBasicInfo({ email: e.target.value })}
        placeholder="hello@example.com"
        type="email"
      />
      <Input
        label="所在城市"
        value={info.location ?? ''}
        onChange={(e) => updateBasicInfo({ location: e.target.value })}
        placeholder="北京"
      />
      <Input
        label="个人网站"
        value={info.website ?? ''}
        onChange={(e) => updateBasicInfo({ website: e.target.value })}
        placeholder="https://github.com/yourname"
      />
    </div>
  );
}
