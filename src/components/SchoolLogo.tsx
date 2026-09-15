import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const finalClass = className || sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full shadow-sm hover:scale-105 transition-transform duration-300 ${finalClass}`}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-md select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="logoBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C1C1E" />
            <stop offset="85%" stopColor="#0B0B0D" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Badge */}
        <circle cx="200" cy="200" r="192" fill="url(#logoBg)" stroke="#2C2C2E" strokeWidth="4" />
        <circle cx="200" cy="200" r="186" fill="none" stroke="#E11D48" strokeWidth="1.5" opacity="0.35" />

        {/* Turkish Crescent & Star */}
        <g filter="url(#logoGlow)">
          <path
            d="M 235,155 A 68,68 0 1,0 152,108 A 58,58 0 1,1 235,155 Z"
            fill="#E11D48"
          />
          <polygon
            points="248,138 254,148 266,148 256,155 260,166 248,159 236,166 240,155 230,148 242,148"
            fill="#E11D48"
          />
        </g>

        {/* TOKİ with Dividers */}
        <line x1="80" y1="150" x2="155" y2="150" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        <text
          x="200"
          y="155"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontSize="24"
          fontWeight="900"
          letterSpacing="4"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          TOKİ
        </text>
        <line x1="245" y1="150" x2="320" y2="150" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

        {/* Upper Red Curve */}
        <path d="M 48,178 Q 200,166 352,178" fill="none" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />

        {/* CUMHURİYET */}
        <text
          x="200"
          y="233"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontSize="42"
          fontWeight="900"
          letterSpacing="2"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          CUMHURİYET
        </text>

        {/* Lower Red Curve */}
        <path d="M 48,247 Q 200,259 352,247" fill="none" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />

        {/* ANADOLU LİSESİ */}
        <text
          x="200"
          y="280"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontSize="23"
          fontWeight="800"
          letterSpacing="3"
          fill="#E11D48"
          textAnchor="middle"
        >
          ANADOLU LİSESİ
        </text>

        {/* 2010 with Dividers */}
        <line x1="95" y1="311" x2="160" y2="311" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <text
          x="200"
          y="317"
          fontFamily="'Arial Black', Impact, sans-serif"
          fontSize="19"
          fontWeight="900"
          letterSpacing="2"
          fill="#E11D48"
          textAnchor="middle"
        >
          2010
        </text>
        <line x1="240" y1="311" x2="305" y2="311" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      </svg>
    </div>
  );
};
