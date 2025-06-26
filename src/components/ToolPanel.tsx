import React from 'react';
import { Paintbrush, Eraser, Move, RotateCcw, RotateCw, Grid, ZoomIn, ZoomOut } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';

const tools = [
  { id: 'brush', name: 'Brush', icon: Paintbrush },
  { id: 'eraser', name: 'Eraser', icon: Eraser },
  { id: 'move', name: 'Move', icon: Move },
];

export const ToolPanel: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    showGrid,
    toggleGrid,
    undo,
    redo
  } = useCanvasStore();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
      
      {/* Main Tools */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1
                ${activeTool === tool.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800'
                }
              `}
              title={tool.name}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{tool.name}</span>
            </button>
          );
        })}
      </div>

      {/* History Controls */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">History</h4>
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
            title="Undo"
          >
            <RotateCcw size={16} className="mx-auto" />
          </button>
          <button
            onClick={redo}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
            title="Redo"
          >
            <RotateCw size={16} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">View</h4>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setZoom(zoom * 1.2)}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} className="mx-auto" />
          </button>
          <button
            onClick={() => setZoom(zoom * 0.8)}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="mx-auto" />
          </button>
        </div>
        <button
          onClick={toggleGrid}
          className={`
            w-full p-2 rounded-md border-2 transition-all duration-200 flex items-center justify-center gap-2
            ${showGrid
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800'
            }
          `}
        >
          <Grid size={16} />
          <span className="text-sm font-medium">Grid</span>
        </button>
      </div>

      {/* Zoom Level Display */}
      <div className="text-center">
        <span className="text-xs text-gray-500">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};