import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, Edit2, Hexagon, Triangle, Square, Download } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { PanelWrapper } from './ui/PanelWrapper';
import { GridType } from '../types';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    addPixelLayer,
    removeLayer,
    toggleLayerVisibility,
    updateLayerName,
    globalGridType,
    setGlobalGridType,
    rasterizeLayer
  } = useCanvasStore();

  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddShapeLayer = () => {
    const layerNumber = layers.filter(l => l.gridType !== 'pixel').length + 1;
    addLayer(`Shape Layer ${layerNumber}`, 'hexagon');
    setShowAddMenu(false);
  };

  const handleAddPixelLayer = () => {
    const layerNumber = layers.filter(l => l.gridType === 'pixel').length + 1;
    addPixelLayer(`Pixel Layer ${layerNumber}`);
    setShowAddMenu(false);
  };

  const startEditing = (layerId: string, currentName: string) => {
    setEditingLayer(layerId);
    setEditName(currentName);
  };

  const finishEditing = () => {
    if (editingLayer && editName.trim()) {
      updateLayerName(editingLayer, editName.trim());
    }
    setEditingLayer(null);
    setEditName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingLayer(null);
      setEditName('');
    }
  };

  const getLayerIcon = (gridType: GridType) => {
    switch (gridType) {
      case 'hexagon':
        return <Hexagon size={12} className="text-blue-600" />;
      case 'triangle':
        return <Triangle size={12} className="text-green-600" />;
      case 'pixel':
        return <Square size={12} className="text-purple-600" />;
      default:
        return <Hexagon size={12} className="text-gray-600" />;
    }
  };

  const getLayerTypeLabel = (gridType: GridType) => {
    switch (gridType) {
      case 'hexagon':
      case 'triangle':
        return 'Shape';
      case 'pixel':
        return 'Pixel';
      default:
        return 'Shape';
    }
  };

  const handleRasterizeLayer = (layerId: string) => {
    if (confirm('Rasterize this layer? This will convert it to a pixel layer and cannot be undone.')) {
      rasterizeLayer(layerId);
    }
  };

  return (
    <PanelWrapper
      title="Layers"
      icon={<Layers size={16} />}
      actions={
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Add Layer"
            aria-label="Add Layer"
          >
            <Plus size={16} />
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={handleAddShapeLayer}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                <Hexagon size={14} className="text-blue-600" />
                Shape Layer
              </button>
              <button
                onClick={handleAddPixelLayer}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Square size={14} className="text-purple-600" />
                Pixel Layer
              </button>
            </div>
          )}
        </div>
      }
    >
      {/* Global Grid Type Selector */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-xs font-semibold text-blue-700 mb-2">Global Shape Type</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setGlobalGridType('hexagon')}
            className={`
              flex-1 p-2 rounded-md border transition-colors text-xs flex items-center justify-center gap-1
              ${globalGridType === 'hexagon'
                ? 'border-blue-500 bg-blue-100 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }
            `}
          >
            <Hexagon size={12} />
            Hex
          </button>
          <button
            onClick={() => setGlobalGridType('triangle')}
            className={`
              flex-1 p-2 rounded-md border transition-colors text-xs flex items-center justify-center gap-1
              ${globalGridType === 'triangle'
                ? 'border-green-500 bg-green-100 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }
            `}
          >
            <Triangle size={12} />
            Tri
          </button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Changes how all Shape Layers are displayed
        </p>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
              ${layer.id === activeLayerId
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
              }
            `}
            onClick={() => setActiveLayer(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Layer Type Icon */}
                <div className="flex-shrink-0" title={`${getLayerTypeLabel(layer.gridType)} Layer`}>
                  {getLayerIcon(layer.gridType)}
                </div>

                {editingLayer === layer.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={handleKeyPress}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {layer.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(layer.id, layer.name);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Edit layer name"
                    >
                      <Edit2 size={12} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Rasterize button for shape layers */}
                {layer.gridType !== 'pixel' && layer.cells.size > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRasterizeLayer(layer.id);
                    }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    title="Rasterize Layer"
                    aria-label="Rasterize Layer"
                  >
                    <Download size={12} />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  aria-label={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  aria-label={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>

                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete layer "${layer.name}"?`)) {
                        removeLayer(layer.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    title="Delete Layer"
                    aria-label="Delete Layer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Layer info */}
            <div className="mt-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>{layer.cells.size} cells</span>
                <div className="flex items-center gap-2">
                  <span>{Math.round(layer.opacity * 100)}% opacity</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {getLayerTypeLabel(layer.gridType)}
                  </span>
                </div>
              </div>
            </div>

            {/* Layer preview */}
            <div className="mt-2 h-8 bg-gray-50 rounded border overflow-hidden relative">
              {layer.cells.size > 0 && (
                <div className="absolute inset-0 opacity-75">
                  <div 
                    className="w-full h-full rounded"
                    style={{
                      background: `linear-gradient(45deg, ${Array.from(layer.cells.values())
                        .slice(0, 3)
                        .map(cell => cell.color)
                        .join(', ')})`,
                    }}
                  />
                </div>
              )}
              {layer.cells.size === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Layers size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm mb-3">No layers yet</p>
          <button
            onClick={handleAddShapeLayer}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create First Layer
          </button>
        </div>
      )}

      {/* Layer Type Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">Layer Types</h5>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Hexagon size={10} className="text-blue-600" />
            <span><strong>Shape:</strong> Uses global grid type</span>
          </div>
          <div className="flex items-center gap-2">
            <Square size={10} className="text-purple-600" />
            <span><strong>Pixel:</strong> Fixed rectangular grid</span>
          </div>
          <div className="flex items-center gap-2">
            <Download size={10} className="text-gray-600" />
            <span><strong>Rasterize:</strong> Convert shape to pixel layer</span>
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
};