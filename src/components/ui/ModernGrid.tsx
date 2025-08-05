'use client';

import { ReactNode } from 'react';

interface ModernGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ModernGrid({ 
  children, 
  className = '', 
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md'
}: ModernGridProps) {
  const getGridClass = () => {
    const { default: defaultCols = 1, sm = 2, md = 3, lg = 4, xl } = columns;
    let gridClass = `grid grid-cols-${defaultCols}`;
    
    if (sm) gridClass += ` sm:grid-cols-${sm}`;
    if (md) gridClass += ` md:grid-cols-${md}`;
    if (lg) gridClass += ` lg:grid-cols-${lg}`;
    if (xl) gridClass += ` xl:grid-cols-${xl}`;
    
    return gridClass;
  };

  const getGapClass = () => {
    switch (gap) {
      case 'sm':
        return 'gap-4';
      case 'lg':
        return 'gap-8';
      case 'xl':
        return 'gap-12';
      default:
        return 'gap-6';
    }
  };

  return (
    <div className={`${getGridClass()} ${getGapClass()} ${className}`}>
      {children}
    </div>
  );
}