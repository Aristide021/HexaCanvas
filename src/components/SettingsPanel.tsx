import React, { useState } from 'react';
import { Settings, Palette, Grid, Zap, Download, Upload, RotateCcw } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { PanelWrapper } from './ui/PanelWrapper';

export const SettingsPanel: React.FC = () => {
  const {
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
    zoom,
    setZoom,
    setPan,
    layers,
    clearCanvas,
    resetView,
    exportCanvas,
    importCanvas
  } = useCanvasStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
  };

  const handleResetCanvas = () => {
    if (confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      clearCanvas();
    }
  };

  const handleResetView = () => {
    resetView();
  };

  const handleExportSettings = () => {
    const settings = {
      gridSize,
      showGrid,
      zoom,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexacanvas-settings-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.gridSize) setGridSize(settings.gridSize);
        if (typeof settings.showGrid === 'boolean') {
          if (settings.showGrid !== showGrid) toggleGrid();
        }
        if (settings.zoom) setZoom(settings.zoom);
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <PanelWrapper
      title="Settings"
      icon={<Settings size={16} />}
    >
      {/* Canvas Settings */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Canvas</h4>
        
        {/* Grid Size */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Grid Size: {gridSize}px
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={gridSize}
            onChange={(e) => handleGridSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10px</span>
            <span>50px</span>
          </div>
        </div>

        {/* Grid Visibility */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-medium text-gray-700">Show Grid</label>
          <button
            onClick={toggleGrid}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${showGrid ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${showGrid ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Zoom Level */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Zoom: {Math.round(zoom * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10%</span>
            <span>500%</span>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">View</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleResetView}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw size={14} />
            Reset View
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Zap size={14} />
            100% Zoom
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 mb-3 hover:text-gray-800 transition-colors"
        >
          <span>Advanced Settings</span>
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showAdvanced && (
          <div className="space-y-3">
            {/* Canvas Statistics */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="text-xs font-semibold text-gray-700 mb-2">Canvas Info</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total layers:</span>
                  <span className="font-mono">{layers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total cells:</span>
                  <span className="font-mono">
                    {layers.reduce((sum, layer) => sum + layer.cells.size, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Visible layers:</span>
                  <span className="font-mono">{layers.filter(l => l.visible).length}</span>
                </div>
              </div>
            </div>

            {/* Settings Import/Export */}
            <div className="space-y-2">
              <button
                onClick={handleExportSettings}
                className="w-full p-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center justify-center gap-1"
              >
                <Download size={14} />
                Export Settings
              </button>
              
              <label className="w-full p-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1">
                <Upload size={14} />
                Import Settings
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="pt-3 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-red-600 mb-2">Danger Zone</h5>
              <button
                onClick={handleResetCanvas}
                className="w-full p-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Clear Entire Canvas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="text-xs font-semibold text-blue-700 mb-2">💡 Performance Tips</h5>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Smaller grid sizes improve performance</li>
          <li>• Hide unused layers to speed up rendering</li>
          <li>• Use lower zoom levels for better responsiveness</li>
        </ul>
      </div>
    </PanelWrapper>
  );
};