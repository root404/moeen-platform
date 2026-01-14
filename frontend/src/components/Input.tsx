import React from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export default function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  id,
  name,
}: InputProps) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          border-gray-300 text-gray-900 placeholder-gray-400
          transition-colors duration-200
          disabled:bg-gray-100 disabled:cursor-not-allowed
          text-right
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        style={{
          textAlign: 'right',
          direction: 'rtl',
        }}
      />
      
      {error && (
        <p className="text-red-500 text-sm font-medium">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-gray-500 text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
}