import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useCanvasStore } from '../../services/canvasStore';

export const ZoomControls: React.FC = () => {
  const { zoom, setZoom, setPan } = useCanvasStore();

  const zoomIn = () => setZoom(Math.min(zoom * 1.2, 5));
  const zoomOut = () => setZoom(Math.max(zoom * 0.8, 0.1));
  const resetView = () => {
    setZoom(1);
    setPan(0, 0);
  };

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1 z-50">
      <button
        onClick={zoomIn}
        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus size={16} />
      </button>
      
      <div className="px-2 py-1 text-xs text-gray-500 text-center font-mono">
        {Math.round(zoom * 100)}%
      </div>
      
      <button
        onClick={zoomOut}
        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus size={16} />
      </button>
      
      <div className="border-t border-gray-200 my-1" />
      
      <button
        onClick={resetView}
        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        title="Reset View"
        aria-label="Reset View"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};