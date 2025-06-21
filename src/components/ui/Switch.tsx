import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Switch({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  size = 'md',
  className 
}: SwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-7',
    md: 'h-6 w-11',
  };
  
  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
  };
  
  const translateClasses = {
    sm: checked ? 'translate-x-3' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500',
        checked ? 'bg-teal-600' : 'bg-slate-200',
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      />
    </button>
  );
}