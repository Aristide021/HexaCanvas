import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ToolPanel } from './components/ToolPanel';
import { ColorPalette } from './components/ColorPalette';
import { LayerPanel } from './components/LayerPanel';
import { ExportPanel } from './components/ExportPanel';
import { CollaborationPanel } from './components/CollaborationPanel';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const sidebar = 320; // Approximate sidebar width
      const header = 80; // Approximate header height
      const statusBar = 40; // Approximate status bar height
      const padding = 40; // Padding
      
      const availableWidth = window.innerWidth - sidebar - padding;
      const availableHeight = window.innerHeight - header - statusBar - padding;
      
      setCanvasSize({
        width: Math.max(600, Math.min(1200, availableWidth)),
        height: Math.max(400, Math.min(800, availableHeight))
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-6">
            <ToolPanel />
            <ColorPalette />
            <LayerPanel />
            <CollaborationPanel />
            <ExportPanel />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <Canvas width={canvasSize.width} height={canvasSize.height} />
            </div>
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}

export default App;