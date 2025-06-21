import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export const Card = ({ className, variant = 'default', ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg shadow-sm overflow-hidden',
        variant === 'default' ? 'bg-white' : 'bg-transparent border border-slate-200',
        className
      )}
      {...props}
    />
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return <div className={cn('p-6 border-b border-slate-100', className)} {...props} />;
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return <h3 className={cn('text-xl font-semibold text-slate-900', className)} {...props} />;
};

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => {
  return <p className={cn('text-sm text-slate-500 mt-1', className)} {...props} />;
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = ({ className, ...props }: CardContentProps) => {
  return <div className={cn('p-6', className)} {...props} />;
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = ({ className, ...props }: CardFooterProps) => {
  return <div className={cn('p-6 border-t border-slate-100 bg-slate-50', className)} {...props} />;
};