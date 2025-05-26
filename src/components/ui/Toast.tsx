'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 150);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-150',
        'transform',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        styles[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="通知を閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
}

let toastContext: ToastContextType | null = null;

export function setToastContext(context: ToastContextType) {
  toastContext = context;
}

export function showToast(toast: Omit<ToastProps, 'id' | 'onClose'>) {
  if (toastContext) {
    toastContext.showToast(toast);
  }
}