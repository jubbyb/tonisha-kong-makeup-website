interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 22, className = '' }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-1 serif-display italic ${className}`}
      style={{ fontSize: size }}
    >
      <span>Style</span>
      <span style={{ color: 'var(--accent)' }}>ja</span>
      <span
        style={{
          display: 'inline-block',
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          marginLeft: 4,
        }}
      />
    </div>
  );
}
