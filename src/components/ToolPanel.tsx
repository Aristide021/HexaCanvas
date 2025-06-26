import React from 'react';
import { Paintbrush, Eraser, Move, RotateCcw, RotateCw, Grid, ZoomIn, ZoomOut, Pipette, PaintBucket } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { PanelWrapper } from './ui/PanelWrapper';
import { ToolButton } from './ui/ToolButton';

const tools = [
  { id: 'brush', name: 'Brush', icon: Paintbrush, tooltip: 'Paint cells with selected color' },
  { id: 'eraser', name: 'Eraser', icon: Eraser, tooltip: 'Remove cells' },
  { id: 'picker', name: 'Picker', icon: Pipette, tooltip: 'Pick color from canvas' },
  { id: 'fill', name: 'Fill', icon: PaintBucket, tooltip: 'Fill connected area' },
  { id: 'move', name: 'Move', icon: Move, tooltip: 'Pan the canvas' },
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
    redo,
    canUndo,
    canRedo
  } = useCanvasStore();

  return (
    <PanelWrapper title="Tools">
      {/* Main Tools */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            id={tool.id}
            name={tool.name}
            icon={tool.icon}
            active={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
            tooltip={tool.tooltip}
          />
        ))}
      </div>

      {/* History Controls */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">History</h4>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw size={16} className="mx-auto" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <RotateCw size={16} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">View</h4>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} className="mx-auto" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom * 0.8, 0.1))}
            className="flex-1 p-2 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} className="mx-auto" />
          </button>
        </div>
        <button
          onClick={toggleGrid}
          className={`
            w-full p-2 rounded-md border-2 transition-all duration-200 flex items-center justify-center gap-2
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${showGrid
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
          aria-label={showGrid ? 'Hide Grid' : 'Show Grid'}
        >
          <Grid size={16} />
          <span className="text-sm font-medium">Grid</span>
        </button>
      </div>

      {/* Tool Tips */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="text-xs font-semibold text-blue-700 mb-2">💡 Tool Tips</h5>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• <strong>Picker:</strong> Click to sample colors</li>
          <li>• <strong>Fill:</strong> Flood fill connected areas</li>
          <li>• <strong>Space+Drag:</strong> Pan the canvas</li>
          <li>• <strong>Mouse Wheel:</strong> Zoom in/out</li>
        </ul>
      </div>

      {/* Zoom Level Display */}
      <div className="text-center mt-4">
        <span className="text-xs text-gray-500 font-mono">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
    </PanelWrapper>
  );
};