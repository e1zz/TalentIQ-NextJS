import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
}

const Link: React.FC<LinkProps> = ({ children, className = '', ...props }) => {
  return (
    <a {...props} className={className}>
      {children}
    </a>
  );
};

export default Link;