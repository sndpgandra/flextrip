'use client';

import Image from 'next/image';

interface LogoProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-xl';
    }
  };

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Image
          src="/flexitrip-icon.svg"
          alt="FlexiTrip"
          width={32}
          height={32}
          className={getSizeClasses()}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Image
        src="/flexitrip-logo.svg"
        alt="FlexiTrip Logo"
        width={32}
        height={32}
        className={getSizeClasses()}
      />
      <span className={`font-bold tracking-wide ${getTextSizeClasses()}`}>
        <span className="text-blue-500">Flexi</span>
        <span className="text-violet-500">Trip</span>
      </span>
    </div>
  );
}