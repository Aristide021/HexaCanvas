import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CanvasState, Layer, HexCell, Tool, ColorPalette, User, AnyCommand, PaintCommand, EraseCommand } from '../types';

interface CanvasStore extends CanvasState {
  // Canvas state
  selectedColor: string;
  activeTool: string;
  isPainting: boolean;
  lastPaintedCell: string | null;
  
  // History system
  history: AnyCommand[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Collaboration
  users: User[];
  currentUser: User;
  
  // Palettes
  palettes: ColorPalette[];
  activePaletteId: string;
  
  // Actions
  addLayer: (name: string) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  updateLayerName: (layerId: string, name: string) => void;
  
  paintCell: (q: number, r: number, color: string) => void;
  eraseCell: (q: number, r: number) => void;
  startPainting: () => void;
  stopPainting: () => void;
  
  setSelectedColor: (color: string) => void;
  setActiveTool: (toolId: string) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  
  executeCommand: (command: AnyCommand) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  addPalette: (palette: ColorPalette) => void;
  setActivePalette: (paletteId: string) => void;
  
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;
  
  exportCanvas: () => string;
  importCanvas: (data: string) => void;
}

const createDefaultLayer = (): Layer => ({
  id: `layer-${Date.now()}`,
  name: 'Layer 1',
  visible: true,
  opacity: 1,
  locked: false,
  cells: new Map()
});

const createDefaultPalette = (): ColorPalette => ({
  id: 'default',
  name: 'Default',
  colors: ['#FF5733', '#C70039', '#900C3F', '#581845', '#273746', '#1ABC9C', '#3498DB', '#9B59B6'],
  generated: false
});

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial state
    layers: [createDefaultLayer()],
    activeLayerId: '',
    gridSize: 20,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    selectedColor: '#FF5733',
    activeTool: 'brush',
    isPainting: false,
    lastPaintedCell: null,
    
    // History
    history: [],
    historyIndex: -1,
    maxHistorySize: 100,
    
    users: [],
    currentUser: {
      id: `user-${Date.now()}`,
      name: 'You',
      color: '#3498DB'
    },
    palettes: [createDefaultPalette()],
    activePaletteId: 'default',

    addLayer: (name) => set((state) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name,
        visible: true,
        opacity: 1,
        locked: false,
        cells: new Map()
      };
      state.layers.push(newLayer);
      state.activeLayerId = newLayer.id;
    }),

    removeLayer: (layerId) => set((state) => {
      if (state.layers.length > 1) {
        const index = state.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
          state.layers.splice(index, 1);
          if (state.activeLayerId === layerId) {
            state.activeLayerId = state.layers[0].id;
          }
        }
      }
    }),

    setActiveLayer: (layerId) => set((state) => {
      state.activeLayerId = layerId;
    }),

    toggleLayerVisibility: (layerId) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (layer) {
        layer.visible = !layer.visible;
      }
    }),

    updateLayerName: (layerId, name) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (layer) {
        layer.name = name;
      }
    }),

    startPainting: () => set((state) => {
      state.isPainting = true;
      state.lastPaintedCell = null;
    }),

    stopPainting: () => set((state) => {
      state.isPainting = false;
      state.lastPaintedCell = null;
    }),

    paintCell: (q, r, color) => {
      const state = get();
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      const cellId = `${q},${r}`;
      
      // Prevent painting the same cell repeatedly during drag
      if (state.isPainting && state.lastPaintedCell === cellId) return;
      
      const existingCell = activeLayer.cells.get(cellId);
      const wasEmpty = !existingCell;
      const previousColor = existingCell?.color;
      
      // Don't paint if the color is the same
      if (existingCell && existingCell.color === color) return;
      
      const command: PaintCommand = {
        type: 'paint',
        cellId,
        layerId: activeLayer.id,
        newColor: color,
        previousColor,
        wasEmpty,
        timestamp: Date.now(),
        userId: state.currentUser.id,
        execute: () => {
          set((state) => {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (layer) {
              const cell: HexCell = {
                id: cellId,
                q,
                r,
                color: command.newColor,
                layerId: layer.id,
                timestamp: command.timestamp
              };
              layer.cells.set(cellId, cell);
              state.lastPaintedCell = cellId;
            }
          });
        },
        undo: () => {
          set((state) => {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (layer) {
              if (command.wasEmpty) {
                layer.cells.delete(cellId);
              } else if (command.previousColor) {
                const cell: HexCell = {
                  id: cellId,
                  q,
                  r,
                  color: command.previousColor,
                  layerId: layer.id,
                  timestamp: Date.now()
                };
                layer.cells.set(cellId, cell);
              }
            }
          });
        }
      };
      
      state.executeCommand(command);
    },

    eraseCell: (q, r) => {
      const state = get();
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      const cellId = `${q},${r}`;
      const existingCell = activeLayer.cells.get(cellId);
      
      if (!existingCell) return;
      
      // Prevent erasing the same cell repeatedly during drag
      if (state.isPainting && state.lastPaintedCell === cellId) return;
      
      const command: EraseCommand = {
        type: 'erase',
        cellId,
        layerId: activeLayer.id,
        previousColor: existingCell.color,
        timestamp: Date.now(),
        userId: state.currentUser.id,
        execute: () => {
          set((state) => {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (layer) {
              layer.cells.delete(cellId);
              state.lastPaintedCell = cellId;
            }
          });
        },
        undo: () => {
          set((state) => {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (layer) {
              const cell: HexCell = {
                id: cellId,
                q,
                r,
                color: command.previousColor,
                layerId: layer.id,
                timestamp: Date.now()
              };
              layer.cells.set(cellId, cell);
            }
          });
        }
      };
      
      state.executeCommand(command);
    },

    executeCommand: (command) => set((state) => {
      // Execute the command
      command.execute();
      
      // Add to history
      if (state.historyIndex < state.history.length - 1) {
        // Remove any commands after current index
        state.history.splice(state.historyIndex + 1);
      }
      
      state.history.push(command);
      
      // Limit history size
      if (state.history.length > state.maxHistorySize) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
      
      // Ensure historyIndex is correct
      state.historyIndex = state.history.length - 1;
    }),

    undo: () => {
      const state = get();
      if (state.canUndo()) {
        const command = state.history[state.historyIndex];
        command.undo();
        set((state) => {
          state.historyIndex--;
        });
      }
    },

    redo: () => {
      const state = get();
      if (state.canRedo()) {
        set((state) => {
          state.historyIndex++;
        });
        const command = state.history[state.historyIndex];
        command.execute();
      }
    },

    canUndo: () => {
      const state = get();
      return state.historyIndex >= 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    setSelectedColor: (color) => set((state) => {
      state.selectedColor = color;
    }),

    setActiveTool: (toolId) => set((state) => {
      state.activeTool = toolId;
    }),

    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.1, Math.min(5, zoom));
    }),

    setPan: (x, y) => set((state) => {
      state.panX = x;
      state.panY = y;
    }),

    toggleGrid: () => set((state) => {
      state.showGrid = !state.showGrid;
    }),

    addPalette: (palette) => set((state) => {
      state.palettes.push(palette);
      state.activePaletteId = palette.id;
    }),

    setActivePalette: (paletteId) => set((state) => {
      state.activePaletteId = paletteId;
    }),

    addUser: (user) => set((state) => {
      state.users.push(user);
    }),

    removeUser: (userId) => set((state) => {
      const index = state.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        state.users.splice(index, 1);
      }
    }),

    updateUserCursor: (userId, x, y) => set((state) => {
      const user = state.users.find(u => u.id === userId);
      if (user) {
        user.cursor = { x, y };
      }
    }),

    exportCanvas: () => {
      const state = get();
      return JSON.stringify({
        layers: state.layers.map(layer => ({
          ...layer,
          cells: Array.from(layer.cells.entries())
        })),
        metadata: {
          version: '2.1.0',
          exported: Date.now()
        }
      });
    },

    importCanvas: (data) => set((state) => {
      try {
        const imported = JSON.parse(data);
        if (imported.layers) {
          state.layers = imported.layers.map((layer: any) => ({
            ...layer,
            cells: new Map(layer.cells)
          }));
          state.activeLayerId = state.layers[0]?.id || '';
          // Clear history when importing
          state.history = [];
          state.historyIndex = -1;
        }
      } catch (error) {
        console.error('Failed to import canvas:', error);
      }
    })
  }))
);

// Initialize active layer properly
const initializeStore = () => {
  const store = useCanvasStore.getState();
  if (store.layers.length > 0 && !store.activeLayerId) {
    store.setActiveLayer(store.layers[0].id);
  }
};

// Initialize after store creation
setTimeout(initializeStore, 0);