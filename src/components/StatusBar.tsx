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
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Tool:</span>
            <span className="capitalize bg-white px-2 py-1 rounded border">
              {activeTool}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Color:</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-mono">{selectedColor}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Layer:</span>
            <span className="bg-white px-2 py-1 rounded border">
              {activeLayer?.name || 'None'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
          </div>
          
          <div>
            <span className="font-medium">Pan:</span> {Math.round(panX)}, {Math.round(panY)}
          </div>

          <div>
            <span className="font-medium">Cells:</span> {totalCells.toLocaleString()}
          </div>

          <div>
            <span className="font-medium">Layers:</span> {layers.length}
          </div>
        </div>
      </div>
    </div>
  );
};