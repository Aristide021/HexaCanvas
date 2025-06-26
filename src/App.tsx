import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ToolPanel } from './components/ToolPanel';
import { ColorPalette } from './components/ColorPalette';
import { LayerPanel } from './components/LayerPanel';
import { ExportPanel } from './components/ExportPanel';
import { CollaborationPanel } from './components/CollaborationPanel';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';
import { ZoomControls } from './components/ui/ZoomControls';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { MobileToolbar } from './components/MobileToolbar';
import { useCanvasStore } from './services/canvasStore';
import { UI_CONSTANTS } from './constants';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { undo, redo, canUndo, canRedo } = useCanvasStore();

  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      const sidebarWidth = isMobileView ? 0 : UI_CONSTANTS.SIDEBAR_WIDTH;
      const headerHeight = UI_CONSTANTS.HEADER_HEIGHT;
      const statusBarHeight = UI_CONSTANTS.STATUS_BAR_HEIGHT;
      const mobileToolbarHeight = isMobileView ? 80 : 0;
      const padding = UI_CONSTANTS.PANEL_SPACING;
      
      const availableWidth = window.innerWidth - sidebarWidth - padding;
      const availableHeight = window.innerHeight - headerHeight - statusBarHeight - mobileToolbarHeight - padding;
      
      setCanvasSize({
        width: Math.max(600, Math.min(1200, availableWidth)),
        height: Math.max(400, Math.min(800, availableHeight))
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timer);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (canRedo()) redo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={48} className="mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading HexaCanvas</h2>
          <p className="text-gray-500">Preparing your collaborative art studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar */}
        <div className={`
          ${isMobile ? 'hidden' : 'block'} 
          w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto
        `}>
          <div className="p-4 space-y-6">
            <ToolPanel />
            <ColorPalette />
            <LayerPanel />
            <CollaborationPanel />
            <ExportPanel />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white rounded-xl shadow-xl p-6 relative">
              <Canvas width={canvasSize.width} height={canvasSize.height} />
              
              {/* Canvas Loading Overlay */}
              {isLoading && (
                <LoadingSpinner overlay />
              )}
            </div>
          </div>
          
          {/* Floating Zoom Controls - Desktop Only */}
          {!isMobile && <ZoomControls />}
        </div>
      </div>

      {/* Mobile Toolbar */}
      {isMobile && <MobileToolbar />}

      <StatusBar />
    </div>
  );
}

export default App;