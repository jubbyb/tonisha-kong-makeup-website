import React, { useState } from 'react';

interface SmartImgProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

export function SmartImg({ src, alt, style, className = '' }: SmartImgProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--warm)',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      ) : null}
    </div>
  );
}
