'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300'
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${props.id}-helper`} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };