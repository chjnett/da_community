// ============================================================
// components/common/BadgeIcon.tsx — 다걸고 명찰 공통 컴포넌트
// ============================================================
import React from 'react';

interface BadgeIconProps {
  showText?: boolean;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ showText = false, className = '' }) => (
  <svg
    width="140"
    height="140"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M44 14 V8 C44 5 56 5 56 8 V14" stroke="#FFA6C2" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="38" y="14" width="24" height="6" rx="2" stroke="#FFA6C2" strokeWidth="2.5" fill="white" />
    <rect x="15" y="20" width="70" height="52" rx="8" stroke="#FFA6C2" strokeWidth="2.5" fill="white" />
    <rect x="25" y="32" width="50" height="28" rx="4" stroke="#FFA6C2" strokeWidth="2.5" />
    {showText && (
      <>
        <text x="35" y="51" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill="#3A001E" textAnchor="middle">다</text>
        <text x="50" y="51" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill="#E61E54" textAnchor="middle">걸</text>
        <text x="65" y="51" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill="#3A001E" textAnchor="middle">고</text>
      </>
    )}
  </svg>
);
