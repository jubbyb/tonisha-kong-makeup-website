import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Eyebrow({ children, style, className = '' }: EyebrowProps) {
  return (
    <div className={`eyebrow ${className}`} style={style}>
      {children}
    </div>
  );
}
