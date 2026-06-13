'use client';

import { Modal as ArcoModal } from '@arco-design/web-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <ArcoModal
      title={title}
      visible={isOpen}
      onCancel={onClose}
      footer={null}
      unmountOnExit
      style={{ width: 340, borderRadius: 'var(--radius-md)' }}
      className={className}
    >
      <div className="text-xs text-[var(--text-secondary)]">{children}</div>
    </ArcoModal>
  );
}
