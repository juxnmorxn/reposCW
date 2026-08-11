'use client';

import React from 'react';

interface ISPLogoProps {
  className?: string;
  size?: number;
}

export const ISPLogo: React.FC<ISPLogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0 relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/4 h-3/4"
      >
        {/* Ondas de señal WiFi / Fibra óptica */}
        <path
          d="M6 10C11.5228 4.47715 20.4772 4.47715 26 10"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M10 14C13.3137 10.6863 18.6863 10.6863 22 14"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M13.5 18C14.8807 16.6193 17.1193 16.6193 18.5 18"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Torre / Antena ISP */}
        <circle cx="16" cy="23" r="2" fill="white" />
        <path d="M16 23V28" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 28H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};
