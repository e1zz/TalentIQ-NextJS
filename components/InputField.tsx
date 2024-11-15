import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ className = '', ...props }) => {
  return (
    <input
      {...props}
      className={`overflow-hidden relative gap-3.5 self-stretch py-3.5 pr-5 pl-3 max-w-full whitespace-nowrap rounded-lg bg-stone-900 min-h-[43px] text-neutral-400 w-[271px] ${className}`}
    />
  );
};

export default InputField;