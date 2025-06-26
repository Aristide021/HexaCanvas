import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  id: string;
  name: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  id,
  name,
  icon: Icon,
  active,
  onClick,
  disabled = false,
  tooltip
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip || name}
      className={`
        p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${active
          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
        }
      `}
    >
      <Icon size={20} />
      <span className="text-xs font-medium">{name}</span>
    </button>
  );
};