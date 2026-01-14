import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'text-emerald-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          animate-spin
          border-2 border-current border-t-transparent
          rounded-full
        `}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">جاري التحميل...</span>
      </div>
    </div>
  );
}