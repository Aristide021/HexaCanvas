import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, Edit2 } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { PanelWrapper } from './ui/PanelWrapper';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    updateLayerName
  } = useCanvasStore();

  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddLayer = () => {
    const layerNumber = layers.length + 1;
    addLayer(`Layer ${layerNumber}`);
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

  return (
    <PanelWrapper
      title="Layers"
      icon={<Layers size={16} />}
      actions={
        <button
          onClick={handleAddLayer}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Add Layer"
          aria-label="Add Layer"
        >
          <Plus size={16} />
        </button>
      }
    >
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
                <span>{Math.round(layer.opacity * 100)}% opacity</span>
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
            onClick={handleAddLayer}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create First Layer
          </button>
        </div>
      )}
    </PanelWrapper>
  );
};