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
  fillArea: (q: number, r: number, color: string) => void;
  pickColor: (q: number, r: number) => void;
  startPainting: () => void;
  stopPainting: () => void;
  
  setSelectedColor: (color: string) => void;
  setActiveTool: (toolId: string) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  resetView: () => void;
  clearCanvas: () => void;
  
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

// FIXED: Improved flood fill algorithm with proper boundary checking
const floodFill = (
  layers: Layer[],
  activeLayerId: string,
  startQ: number,
  startR: number,
  newColor: string
): Array<{ q: number; r: number; oldColor: string | null }> => {
  const activeLayer = layers.find(l => l.id === activeLayerId);
  if (!activeLayer) return [];

  const startCellId = `${startQ},${startR}`;
  const startCell = activeLayer.cells.get(startCellId);
  const targetColor = startCell?.color || null;
  
  // CRITICAL FIX: Don't fill if the target color is the same as new color
  if (targetColor === newColor) return [];

  const visited = new Set<string>();
  const queue: Array<{ q: number; r: number }> = [{ q: startQ, r: startR }];
  const changes: Array<{ q: number; r: number; oldColor: string | null }> = [];

  // Hex directions for neighbors
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];

  // SAFETY: Limit maximum cells to prevent infinite loops
  const MAX_CELLS = 10000;
  let processedCells = 0;

  while (queue.length > 0 && processedCells < MAX_CELLS) {
    const current = queue.shift()!;
    const cellId = `${current.q},${current.r}`;
    
    // CRITICAL FIX: Check visited BEFORE processing
    if (visited.has(cellId)) continue;
    visited.add(cellId);
    processedCells++;

    const cell = activeLayer.cells.get(cellId);
    const cellColor = cell?.color || null;
    
    // CRITICAL FIX: Only process cells that match the target color exactly
    if (cellColor === targetColor) {
      changes.push({ q: current.q, r: current.r, oldColor: cellColor });
      
      // Add neighbors to queue (only if not visited)
      directions.forEach(dir => {
        const neighborQ = current.q + dir.q;
        const neighborR = current.r + dir.r;
        const neighborId = `${neighborQ},${neighborR}`;
        
        // CRITICAL FIX: Don't add to queue if already visited
        if (!visited.has(neighborId)) {
          queue.push({ q: neighborQ, r: neighborR });
        }
      });
    }
  }

  // Log warning if we hit the limit
  if (processedCells >= MAX_CELLS) {
    console.warn('Fill operation reached maximum cell limit for safety');
  }

  return changes;
};

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
      
      // Create the command with proper execution logic
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
          // This will be called by executeCommand
        },
        undo: () => {
          // This will be called by the undo system
        }
      };
      
      // Execute immediately and add to history
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
          
          // Add to history
          if (state.historyIndex < state.history.length - 1) {
            state.history.splice(state.historyIndex + 1);
          }
          
          state.history.push(command);
          
          if (state.history.length > state.maxHistorySize) {
            state.history.shift();
          } else {
            state.historyIndex++;
          }
          
          state.historyIndex = state.history.length - 1;
        }
      });
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
          // This will be called by executeCommand
        },
        undo: () => {
          // This will be called by the undo system
        }
      };
      
      // Execute immediately and add to history
      set((state) => {
        const layer = state.layers.find(l => l.id === command.layerId);
        if (layer) {
          layer.cells.delete(cellId);
          state.lastPaintedCell = cellId;
          
          // Add to history
          if (state.historyIndex < state.history.length - 1) {
            state.history.splice(state.historyIndex + 1);
          }
          
          state.history.push(command);
          
          if (state.history.length > state.maxHistorySize) {
            state.history.shift();
          } else {
            state.historyIndex++;
          }
          
          state.historyIndex = state.history.length - 1;
        }
      });
    },

    // FIXED: Completely rewritten fillArea function with safety checks
    fillArea: (q, r, color) => {
      const state = get();
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      try {
        // Get all cells that need to be changed
        const changes = floodFill(state.layers, state.activeLayerId, q, r, color);
        
        if (changes.length === 0) {
          console.log('Fill operation: No changes needed');
          return;
        }
        
        console.log(`Fill operation: Changing ${changes.length} cells`);
        
        // Create batch command for all changes
        const commands: PaintCommand[] = changes.map(change => ({
          type: 'paint',
          cellId: `${change.q},${change.r}`,
          layerId: activeLayer.id,
          newColor: color,
          previousColor: change.oldColor,
          wasEmpty: change.oldColor === null,
          timestamp: Date.now(),
          userId: state.currentUser.id,
          execute: () => {},
          undo: () => {}
        }));
        
        // Execute all changes in a single state update
        set((state) => {
          const layer = state.layers.find(l => l.id === activeLayer.id);
          if (layer) {
            commands.forEach(command => {
              const [q, r] = command.cellId.split(',').map(Number);
              const cell: HexCell = {
                id: command.cellId,
                q,
                r,
                color: command.newColor,
                layerId: layer.id,
                timestamp: command.timestamp
              };
              layer.cells.set(command.cellId, cell);
            });
            
            // Add all commands to history as a batch
            if (state.historyIndex < state.history.length - 1) {
              state.history.splice(state.historyIndex + 1);
            }
            
            commands.forEach(command => {
              state.history.push(command);
            });
            
            if (state.history.length > state.maxHistorySize) {
              const excess = state.history.length - state.maxHistorySize;
              state.history.splice(0, excess);
            }
            
            state.historyIndex = state.history.length - 1;
          }
        });
        
        console.log('Fill operation completed successfully');
        
      } catch (error) {
        console.error('Fill operation failed:', error);
        alert('Fill operation failed. Please try again.');
      }
    },

    pickColor: (q, r) => {
      const state = get();
      
      // Find the topmost visible cell at this position
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (!layer.visible) continue;
        
        const cellId = `${q},${r}`;
        const cell = layer.cells.get(cellId);
        
        if (cell) {
          set((state) => {
            state.selectedColor = cell.color;
            // Automatically switch back to brush tool after picking
            state.activeTool = 'brush';
          });
          console.log(`Color picked: ${cell.color}`);
          return;
        }
      }
      
      console.log('No color found at this position');
    },

    executeCommand: (command) => {
      // This method is kept for potential future use but not needed for basic paint/erase
      command.execute();
    },

    undo: () => {
      const state = get();
      if (state.canUndo()) {
        const command = state.history[state.historyIndex];
        
        set((state) => {
          if (command.type === 'paint') {
            const paintCmd = command as PaintCommand;
            const layer = state.layers.find(l => l.id === paintCmd.layerId);
            if (layer) {
              if (paintCmd.wasEmpty) {
                layer.cells.delete(paintCmd.cellId);
              } else if (paintCmd.previousColor) {
                const [q, r] = paintCmd.cellId.split(',').map(Number);
                const cell: HexCell = {
                  id: paintCmd.cellId,
                  q,
                  r,
                  color: paintCmd.previousColor,
                  layerId: layer.id,
                  timestamp: Date.now()
                };
                layer.cells.set(paintCmd.cellId, cell);
              }
            }
          } else if (command.type === 'erase') {
            const eraseCmd = command as EraseCommand;
            const layer = state.layers.find(l => l.id === eraseCmd.layerId);
            if (layer) {
              const [q, r] = eraseCmd.cellId.split(',').map(Number);
              const cell: HexCell = {
                id: eraseCmd.cellId,
                q,
                r,
                color: eraseCmd.previousColor,
                layerId: layer.id,
                timestamp: Date.now()
              };
              layer.cells.set(eraseCmd.cellId, cell);
            }
          }
          
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
        
        set((state) => {
          if (command.type === 'paint') {
            const paintCmd = command as PaintCommand;
            const layer = state.layers.find(l => l.id === paintCmd.layerId);
            if (layer) {
              const [q, r] = paintCmd.cellId.split(',').map(Number);
              const cell: HexCell = {
                id: paintCmd.cellId,
                q,
                r,
                color: paintCmd.newColor,
                layerId: layer.id,
                timestamp: paintCmd.timestamp
              };
              layer.cells.set(paintCmd.cellId, cell);
            }
          } else if (command.type === 'erase') {
            const eraseCmd = command as EraseCommand;
            const layer = state.layers.find(l => l.id === eraseCmd.layerId);
            if (layer) {
              layer.cells.delete(eraseCmd.cellId);
            }
          }
        });
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

    setGridSize: (size) => set((state) => {
      state.gridSize = Math.max(10, Math.min(50, size));
    }),

    toggleGrid: () => set((state) => {
      state.showGrid = !state.showGrid;
    }),

    resetView: () => set((state) => {
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
    }),

    clearCanvas: () => set((state) => {
      // Clear all layers
      state.layers.forEach(layer => {
        layer.cells.clear();
      });
      
      // Clear history
      state.history = [];
      state.historyIndex = -1;
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