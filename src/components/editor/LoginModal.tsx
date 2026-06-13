'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Info } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 模拟一下登录的延时
    setTimeout(() => {
      const success = login(username, password);
      setLoading(false);
      if (success) {
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError('用户名或密码错误 (演示用: admin / 123456)');
      }
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="用户登录">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] leading-relaxed flex items-start gap-1.5">
          <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            本系统为免登录设计，不登录也可正常制作与导出。
            <br />
            登录仅作演示同步，演示账号为：
            <span className="font-semibold text-[var(--text-primary)]">admin</span>
            ，密码：
            <span className="font-semibold text-[var(--text-primary)]">123456</span>。
          </div>
        </div>

        <Input
          label="用户名"
          type="text"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />

        <Input
          label="密码"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading} className="px-6">
            登录
          </Button>
        </div>
      </form>
    </Modal>
  );
}
