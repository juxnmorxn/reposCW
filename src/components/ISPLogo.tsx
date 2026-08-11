'use client';

import React from 'react';

interface ISPLogoProps {
  className?: string;
  size?: number;
}

export const ISPLogo: React.FC<ISPLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-md shadow-brand-500/20 border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-isp.png"
        alt="Repos ISP Logo"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback SVG if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
