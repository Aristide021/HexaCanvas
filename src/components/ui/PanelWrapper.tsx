import React from 'react';

interface PanelWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PanelWrapper: React.FC<PanelWrapperProps> = ({ 
  children, 
  className = '',
  title,
  icon,
  actions
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {actions}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};