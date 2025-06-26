import React, { useState } from 'react';
import { Paintbrush, Palette, Layers, Settings, X, Eraser, Pipette, PaintBucket } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { ColorPalette } from './ColorPalette';
import { LayerPanel } from './LayerPanel';
import { ToolPanel } from './ToolPanel';

export const MobileToolbar: React.FC = () => {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const { activeTool, setActiveTool, selectedColor } = useCanvasStore();

  const tools = [
    { id: 'brush', icon: Paintbrush, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'picker', icon: Pipette, label: 'Picker' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
  ];

  const panels = [
    { id: 'colors', icon: Palette, label: 'Colors', component: ColorPalette },
    { id: 'layers', icon: Layers, label: 'Layers', component: LayerPanel },
    { id: 'tools', icon: Settings, label: 'Tools', component: ToolPanel },
  ];

  const closePanel = () => setActivePanel(null);

  return (
    <>
      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-2 md:hidden">
        <div className="flex justify-around items-center">
          {/* Quick Tools */}
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`
                  p-2 rounded-lg transition-colors flex flex-col items-center gap-1
                  ${activeTool === tool.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-xs">{tool.label}</span>
              </button>
            );
          })}

          {/* Color Indicator */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-6 h-6 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-xs text-gray-600">Color</span>
          </div>

          {/* Panel Toggles */}
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
                className={`
                  p-2 rounded-lg transition-colors flex flex-col items-center gap-1
                  ${activePanel === panel.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-xs">{panel.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Modal */}
      {activePanel && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {panels.find(p => p.id === activePanel)?.label}
              </h3>
              <button
                onClick={closePanel}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {(() => {
                const panel = panels.find(p => p.id === activePanel);
                if (panel) {
                  const Component = panel.component;
                  return <Component />;
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};