'use client';

import { useState } from 'react';
import { Input, Button, Message } from '@arco-design/web-react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    // 默认备用密码为 resume2026
    const correctPassword = process.env.NEXT_PUBLIC_PAGE_PASSWORD || 'resume2026';
    setLoading(true);
    
    setTimeout(() => {
      if (password === correctPassword) {
        localStorage.setItem('resume_sys_auth', btoa(password));
        Message.success('访问授权成功，欢迎使用！');
        onSuccess();
      } else {
        Message.error('密码错误，请重新输入');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl">
      <div className="w-full max-w-[380px] p-8 mx-4 bg-white/80 border border-white/20 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 animate-bounce">
          <Lock size={22} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800">简历设计系统 · 授权访问</h2>
          <p className="text-xs text-slate-400 mt-1">此页面已受保护，请输入您的专属访问密码</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Input.Password
            placeholder="请输入访问密码"
            value={password}
            onChange={(val) => setPassword(val)}
            onPressEnter={handleSubmit}
            className="h-10"
          />
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="h-10 font-bold bg-indigo-600 border-0 hover:bg-indigo-700"
          >
            校验密码并进入
          </Button>
        </div>
      </div>
    </div>
  );
}
