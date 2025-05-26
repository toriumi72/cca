'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps, setToastContext } from '@/components/ui/Toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = crypto.randomUUID();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  // Set global toast context
  setToastContext({ showToast });

  return (
    <>
      {children}
      
      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="通知"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </>
  );
}