interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

export function Rating({ value, count, size = 12, className = '' }: RatingProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-yellow-500"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs opacity-60">({count})</span>}
    </div>
  );
}
