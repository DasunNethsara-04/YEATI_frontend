import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightElement,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-agri-text"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-agri-subtext pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={[
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-agri-text',
            'placeholder:text-agri-subtext/60',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-agri-primary/40 focus:border-agri-primary',
            error
              ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
              : 'border-agri-border hover:border-agri-primary/40',
            leftIcon ? 'pl-10' : '',
            rightElement ? 'pr-12' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3.5">{rightElement}</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
