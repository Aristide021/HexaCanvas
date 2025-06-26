import React, { useState } from 'react';
import { Palette, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { AIService } from '../services/aiService';
import { PanelWrapper } from './ui/PanelWrapper';
import { ColorSwatch } from './ui/ColorSwatch';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { DEFAULT_COLORS } from '../constants';
import type { ColorPalette as ColorPaletteType } from '../types';

export const ColorPalette: React.FC = () => {
  const {
    selectedColor,
    setSelectedColor,
    palettes,
    activePaletteId,
    setActivePalette,
    addPalette
  } = useCanvasStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  const activePalette = React.useMemo(() => {
    return palettes.find(p => p.id === activePaletteId) || palettes[0];
  }, [palettes, activePaletteId]);

  const generateAIPalette = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const colors = await AIService.generatePalette(prompt);
      const newPalette: ColorPaletteType = {
        id: `ai-${Date.now()}`,
        name: `AI: ${prompt}`,
        colors,
        generated: true
      };
      addPalette(newPalette);
      setPrompt('');
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to generate palette:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PanelWrapper
      title="Colors"
      icon={<Palette size={16} />}
      actions={
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Generate AI Palette"
          aria-label="Generate AI Palette"
        >
          <Sparkles size={16} />
        </button>
      }
    >
      {/* AI Palette Generation */}
      {showPrompt && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., sunset over ocean, neon cyberpunk..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && generateAIPalette()}
              disabled={isGenerating}
            />
            <button
              onClick={generateAIPalette}
              disabled={isGenerating || !prompt.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {isGenerating ? (
                <LoadingSpinner size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </button>
          </div>
          <p className="text-xs text-purple-600">
            Describe the mood, theme, or style for your palette
          </p>
        </div>
      )}

      {/* Current Color */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ColorSwatch
            color={selectedColor}
            selected={true}
            size="lg"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Selected Color</p>
            <p className="text-xs text-gray-500 font-mono">{selectedColor}</p>
          </div>
        </div>
      </div>

      {/* Palette Tabs */}
      {palettes.length > 1 && (
        <div className="mb-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => setActivePalette(palette.id)}
                className={`
                  px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${palette.id === activePaletteId
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                {palette.generated && <Sparkles size={12} className="inline mr-1" />}
                {palette.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Palette Colors */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">
          {activePalette?.name || 'Palette'}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {activePalette?.colors.map((color, index) => (
            <ColorSwatch
              key={`${activePalette.id}-${index}-${color}`}
              color={color}
              selected={selectedColor === color}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Extended Color Picker */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Quick Colors</h4>
        <div className="grid grid-cols-5 gap-2">
          {DEFAULT_COLORS.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              selected={selectedColor === color}
              onClick={() => setSelectedColor(color)}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Custom Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-12 h-8 rounded border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#FF5733"
          />
        </div>
      </div>
    </PanelWrapper>
  );
};