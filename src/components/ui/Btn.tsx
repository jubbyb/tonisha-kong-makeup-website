import React from 'react';

type Variant = 'solid' | 'accent' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  icon?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  solid: {
    backgroundColor: 'var(--ink)',
    color: 'var(--bg)',
    border: '1px solid var(--ink)',
  },
  accent: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: '1px solid var(--accent)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line-2)',
  },
  quiet: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
  },
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: {
    fontSize: '12px',
    padding: '7px 12px',
  },
  md: {
    fontSize: '13.5px',
    padding: '11px 18px',
  },
  lg: {
    fontSize: '15px',
    padding: '14px 24px',
  },
};

export function Btn({
  children,
  variant = 'solid',
  size = 'md',
  onClick,
  style,
  className = '',
  icon,
  type = 'button',
  disabled = false,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all ${className}`}
      style={{
        ...SIZE_STYLES[size],
        ...VARIANT_STYLES[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
      {icon && (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          {/* Simple arrow icon SVG */}
          <polyline points="5 12 19 12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      )}
    </button>
  );
}
