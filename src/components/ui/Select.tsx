'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'block w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors appearance-none',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-gray-300 bg-white text-gray-900',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
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

Select.displayName = 'Select';

export { Select };