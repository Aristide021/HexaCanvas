import React from 'react';

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  selected = false,
  onClick,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]} rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${selected
          ? 'border-gray-800 ring-2 ring-blue-500 ring-offset-2 scale-105'
          : 'border-gray-300 hover:border-gray-400 hover:scale-105'
        }
        ${className}
      `}
      style={{ backgroundColor: color }}
      title={color}
      aria-label={`Select color ${color}`}
    />
  );
};