import React from 'react';
import { useCanvasStore } from '../services/canvasStore';

export const StatusBar: React.FC = () => {
  const { 
    zoom, 
    panX, 
    panY, 
    layers, 
    activeLayerId, 
    selectedColor,
    activeTool 
  } = useCanvasStore();

  const activeLayer = layers.find(l => l.id === activeLayerId);
  const totalCells = layers.reduce((sum, layer) => sum + layer.cells.size, 0);

  return (
    <div className="bg-gray-100 border-t border-gray-300 px-6 py-3 text-gray-800">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Tool:</span>
            <span className="capitalize bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
              {activeTool}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Color:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">
                {selectedColor}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Layer:</span>
            <span className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
              {activeLayer?.name || 'None'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Zoom:</span>
            <span className="font-mono">{Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Pan:</span>
            <span className="font-mono">{Math.round(panX)}, {Math.round(panY)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Cells:</span>
            <span className="font-mono">{totalCells.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Layers:</span>
            <span className="font-mono">{layers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};