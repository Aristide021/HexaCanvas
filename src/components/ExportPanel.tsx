import React, { useState } from 'react';
import { Download, FileImage, FileText, HardDrive, Upload } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { ExportService } from '../services/exportService';
import { PanelWrapper } from './ui/PanelWrapper';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const ExportPanel: React.FC = () => {
  const { layers, exportCanvas, importCanvas } = useCanvasStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'hex'>('png');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let data: string | ArrayBuffer;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'png':
          data = await ExportService.exportToPNG(layers);
          filename = `hexacanvas-${Date.now()}.png`;
          mimeType = 'image/png';
          break;
        case 'svg':
          data = await ExportService.exportToSVG(layers);
          filename = `hexacanvas-${Date.now()}.svg`;
          mimeType = 'image/svg+xml';
          break;
        case 'hex':
          data = ExportService.exportToHex(layers);
          filename = `hexacanvas-${Date.now()}.hex`;
          mimeType = 'application/octet-stream';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Create download link
      let blob: Blob;
      if (typeof data === 'string') {
        if (exportFormat === 'png') {
          const response = await fetch(data);
          blob = await response.blob();
        } else {
          blob = new Blob([data], { type: mimeType });
        }
      } else {
        blob = new Blob([data], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    if (file.name.endsWith('.hex')) {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        try {
          const imported = ExportService.parseHexFile(buffer);
          importCanvas(JSON.stringify(imported));
        } catch (error) {
          console.error('Failed to import .hex file:', error);
          alert('Failed to import .hex file. Please check the file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        const data = e.target?.result as string;
        try {
          importCanvas(data);
        } catch (error) {
          console.error('Failed to import JSON file:', error);
          alert('Failed to import JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Unsupported file format. Please use .hex or .json files.');
    }

    event.target.value = '';
  };

  const saveProject = () => {
    const data = exportCanvas();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexacanvas-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatOptions = [
    { value: 'png', label: 'PNG', icon: FileImage, desc: 'High quality image' },
    { value: 'svg', label: 'SVG', icon: FileText, desc: 'Vector graphics' },
    { value: 'hex', label: 'HEX', icon: HardDrive, desc: 'Native format' }
  ];

  return (
    <PanelWrapper
      title="Export & Import"
      icon={<Download size={16} />}
    >
      {/* Export Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Export Artwork</h4>
        
        {/* Format Selection */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value as any)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-center
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${exportFormat === format.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} className="mx-auto mb-1" />
                  <div className="text-xs font-medium">{format.label}</div>
                  <div className="text-xs opacity-75">{format.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || layers.every(l => l.cells.size === 0)}
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isExporting ? (
            <>
              <LoadingSpinner size={16} />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export as {exportFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Import Artwork</h4>
        <label className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
          <Upload size={16} />
          <span className="text-sm">Import .hex or .json file</span>
          <input
            type="file"
            accept=".hex,.json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Project Save */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Project</h4>
        <button
          onClick={saveProject}
          className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <HardDrive size={16} />
          Save Project
        </button>
      </div>

      {/* Export Info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">Export Info</h5>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total layers:</span>
            <span className="font-mono">{layers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total cells:</span>
            <span className="font-mono">{layers.reduce((sum, layer) => sum + layer.cells.size, 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Visible layers:</span>
            <span className="font-mono">{layers.filter(l => l.visible).length}</span>
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
};