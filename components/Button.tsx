import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`overflow-hidden relative gap-2.5 self-stretch px-8 py-4 max-w-full text-sm font-semibold text-white whitespace-nowrap bg-sky-500 rounded-xl min-h-[51px] w-[289px] ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;