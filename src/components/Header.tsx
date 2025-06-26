import React, { useState } from 'react';
import { Hexagon, Save, Settings, Info, X } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';

export const Header: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Hexagon 
                  size={32} 
                  className="text-blue-600 fill-blue-100" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HexaCanvas</h1>
                <p className="text-xs text-gray-500">Collaborative Hexagonal Art Studio</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-saved</span>
              </div>
            </div>

            <button 
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="Save Project"
            >
              <Save size={20} />
            </button>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <button 
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="About"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">About HexaCanvas</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <Hexagon size={48} className="text-blue-600 fill-blue-100" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">HexaCanvas</h3>
                <p className="text-gray-600">Version 2.1.0</p>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  A collaborative hexagonal art studio inspired by Marmoset Hexels. 
                  Create beautiful pixel art on a hexagonal grid with layers, 
                  real-time collaboration, and professional export features.
                </p>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Features:</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Hexagonal grid-based drawing</li>
                    <li>• Multi-layer support with opacity controls</li>
                    <li>• AI-powered color palette generation</li>
                    <li>• Real-time collaboration (demo)</li>
                    <li>• Export to PNG, SVG, and native .hex format</li>
                    <li>• Undo/Redo with full history</li>
                    <li>• Responsive design for desktop and mobile</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Keyboard Shortcuts:</h4>
                  <ul className="space-y-1 text-xs font-mono">
                    <li>Ctrl+Z - Undo</li>
                    <li>Ctrl+Y - Redo</li>
                    <li>Space+Drag - Pan canvas</li>
                    <li>Mouse Wheel - Zoom</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Built with React, TypeScript, and modern web technologies
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};