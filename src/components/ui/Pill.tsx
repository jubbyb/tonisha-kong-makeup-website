import React from 'react';

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function Pill({ children, active = false, onClick, style, className = '' }: PillProps) {
  return (
    <button
      className={`pill-btn ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}
