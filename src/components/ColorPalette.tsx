import React, { useState } from 'react';
import { Palette, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { useCanvasStore } from '../services/canvasStore';
import { AIService } from '../services/aiService';
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

  const activePalette = palettes.find(p => p.id === activePaletteId) || palettes[0];

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
      setActivePalette(newPalette.id);
      setPrompt('');
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to generate palette:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const predefinedColors = [
    '#FF5733', '#C70039', '#900C3F', '#581845', '#273746',
    '#1ABC9C', '#16A085', '#2ECC71', '#27AE60', '#3498DB',
    '#2980B9', '#9B59B6', '#8E44AD', '#E74C3C', '#C0392B',
    '#F39C12', '#E67E22', '#F1C40F', '#F4D03F', '#85C1E9'
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Palette size={16} />
          Colors
        </h3>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          title="Generate AI Palette"
        >
          <Sparkles size={16} />
        </button>
      </div>

      {/* AI Palette Generation */}
      {showPrompt && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., sunset over ocean, neon cyberpunk..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && generateAIPalette()}
            />
            <button
              onClick={generateAIPalette}
              disabled={isGenerating || !prompt.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <RefreshCw size={16} className="animate-spin" />
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
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Selected Color</p>
            <p className="text-xs text-gray-500 font-mono">{selectedColor}</p>
          </div>
        </div>
      </div>

      {/* Palette Tabs */}
      {palettes.length > 1 && (
        <div className="mb-3">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => setActivePalette(palette.id)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors
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
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">
          {activePalette?.name || 'Palette'}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {activePalette?.colors.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColor(color)}
              className={`
                w-12 h-12 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md
                ${selectedColor === color
                  ? 'border-gray-800 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Extended Color Picker */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Quick Colors</h4>
        <div className="grid grid-cols-5 gap-1.5">
          {predefinedColors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`
                w-8 h-8 rounded-md border transition-all duration-200 hover:scale-110
                ${selectedColor === color
                  ? 'border-gray-800 ring-1 ring-blue-500'
                  : 'border-gray-300'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Custom Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
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
    </div>
  );
};