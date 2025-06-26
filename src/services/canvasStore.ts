import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CanvasState, Layer, HexCell, Tool, ColorPalette, User, AnyCommand, PaintCommand, EraseCommand, BatchCommand, GridType } from '../types';

interface CanvasStore extends CanvasState {
  // Canvas state
  selectedColor: string;
  activeTool: string;
  isPainting: boolean;
  currentStroke: { command: 'paint' | 'erase'; cells: Map<string, { previousColor?: string, wasEmpty: boolean }> } | null;
  
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
  addLayer: (name: string, gridType?: GridType) => void;
  addPixelLayer: (name: string) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  updateLayerName: (layerId: string, name: string) => void;
  setGlobalGridType: (gridType: GridType) => void;
  rasterizeLayer: (layerId: string) => void;
  
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

const createDefaultLayer = (gridType: GridType = 'hexagon'): Layer => ({
  id: `layer-${Date.now()}`,
  name: gridType === 'pixel' ? 'Pixel Layer 1' : 'Shape Layer 1',
  visible: true,
  opacity: 1,
  locked: false,
  cells: new Map(),
  gridType
});

const createDefaultPalette = (): ColorPalette => ({
  id: 'default',
  name: 'Default',
  colors: ['#FF5733', '#C70039', '#900C3F', '#581845', '#273746', '#1ABC9C', '#3498DB', '#9B59B6'],
  generated: false
});

// Enhanced flood fill that works with different grid types
const floodFill = (
  layers: Layer[],
  activeLayerId: string,
  globalGridType: GridType,
  startQ: number,
  startR: number,
  newColor: string
): Array<{ q: number; r: number; oldColor: string | null }> => {
  const activeLayer = layers.find(l => l.id === activeLayerId);
  if (!activeLayer) return [];

  const startCellId = `${startQ},${startR}`;
  const startCell = activeLayer.cells.get(startCellId);
  const targetColor = startCell?.color || null;
  
  // Don't fill if the target color is the same as new color
  if (targetColor === newColor) return [];

  const visited = new Set<string>();
  const toProcess = [{ q: startQ, r: startR }];
  const changes: Array<{ q: number; r: number; oldColor: string | null }> = [];

  // Get neighbor directions based on grid type
  const getNeighborDirections = (gridType: GridType, layerGridType: GridType) => {
    // If it's a pixel layer, use pixel grid neighbors
    if (layerGridType === 'pixel') {
      return [
        { q: 1, r: 0 },   // Right
        { q: -1, r: 0 },  // Left
        { q: 0, r: 1 },   // Down
        { q: 0, r: -1 }   // Up
      ];
    }
    
    // For shape layers, use the global grid type
    if (gridType === 'triangle') {
      // Triangle neighbors depend on orientation
      // We'll use a more comprehensive neighbor set for triangles
      return [
        { q: 1, r: 0 },   // Right
        { q: -1, r: 0 },  // Left
        { q: 0, r: 1 },   // Down
        { q: 0, r: -1 },  // Up
        { q: 1, r: 1 },   // Down-right
        { q: -1, r: -1 }  // Up-left
      ];
    } else {
      // Hexagon neighbors (default)
      return [
        { q: 1, r: 0 },   // East
        { q: 1, r: -1 },  // Northeast  
        { q: 0, r: -1 },  // Northwest
        { q: -1, r: 0 },  // West
        { q: -1, r: 1 },  // Southwest
        { q: 0, r: 1 }    // Southeast
      ];
    }
  };

  const neighborDirections = getNeighborDirections(globalGridType, activeLayer.gridType);
  const MAX_CELLS = 2000;
  let processedCells = 0;

  while (toProcess.length > 0 && processedCells < MAX_CELLS) {
    const current = toProcess.shift()!;
    const cellId = `${current.q},${current.r}`;
    
    // Skip if already visited
    if (visited.has(cellId)) continue;
    
    // Mark as visited immediately
    visited.add(cellId);
    processedCells++;

    const cell = activeLayer.cells.get(cellId);
    const cellColor = cell?.color || null;
    
    // Only process cells that match the target color exactly
    if (cellColor === targetColor) {
      changes.push({ q: current.q, r: current.r, oldColor: cellColor });
      
      // Add valid neighbors to processing queue
      neighborDirections.forEach(dir => {
        const neighborQ = current.q + dir.q;
        const neighborR = current.r + dir.r;
        const neighborId = `${neighborQ},${neighborR}`;
        
        // Only add if not already visited or in queue
        if (!visited.has(neighborId)) {
          toProcess.push({ q: neighborQ, r: neighborR });
        }
      });
    }
  }

  if (processedCells >= MAX_CELLS) {
    console.warn(`Fill operation limited to ${MAX_CELLS} cells for performance`);
  }

  return changes;
};

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial state
    layers: [createDefaultLayer('hexagon')],
    activeLayerId: '',
    gridSize: 20,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    globalGridType: 'hexagon',
    selectedColor: '#FF5733',
    activeTool: 'brush',
    isPainting: false,
    currentStroke: null,
    
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

    addLayer: (name, gridType = 'hexagon') => set((state) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name,
        visible: true,
        opacity: 1,
        locked: false,
        cells: new Map(),
        gridType
      };
      state.layers.push(newLayer);
      state.activeLayerId = newLayer.id;
    }),

    addPixelLayer: (name) => set((state) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name,
        visible: true,
        opacity: 1,
        locked: false,
        cells: new Map(),
        gridType: 'pixel'
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

    setGlobalGridType: (gridType) => set((state) => {
      state.globalGridType = gridType;
    }),

    rasterizeLayer: (layerId) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (!layer || layer.gridType === 'pixel') return;

      // Convert the layer to a pixel layer
      layer.gridType = 'pixel';
      layer.name = layer.name.replace('Shape', 'Pixel');
      
      // Add a note that this layer has been rasterized
      if (!layer.name.includes('(Rasterized)')) {
        layer.name += ' (Rasterized)';
      }
    }),

    startPainting: () => set((state) => {
      state.isPainting = true;
      state.currentStroke = { 
        command: state.activeTool as 'paint' | 'erase', 
        cells: new Map() 
      };
    }),

    stopPainting: () => {
      const state = get();
      if (!state.isPainting || !state.currentStroke || state.currentStroke.cells.size === 0) {
        set((s) => {
          s.isPainting = false;
          s.currentStroke = null;
        });
        return;
      }
      
      const { command, cells } = state.currentStroke;
      const commands: (PaintCommand | EraseCommand)[] = [];

      cells.forEach((change, cellId) => {
        if (command === 'paint') {
          commands.push({
            type: 'paint',
            cellId,
            layerId: state.activeLayerId,
            newColor: state.selectedColor,
            previousColor: change.previousColor,
            wasEmpty: change.wasEmpty,
            timestamp: Date.now(),
            userId: state.currentUser.id,
            execute: () => {},
            undo: () => {}
          });
        } else {
          commands.push({
            type: 'erase',
            cellId,
            layerId: state.activeLayerId,
            previousColor: change.previousColor!,
            timestamp: Date.now(),
            userId: state.currentUser.id,
            execute: () => {},
            undo: () => {}
          });
        }
      });
      
      const batch: BatchCommand = {
        type: 'batch',
        name: command === 'paint' ? 'Brush Stroke' : 'Erase Stroke',
        commands,
        timestamp: Date.now(),
        userId: state.currentUser.id,
        execute: () => {},
        undo: () => {}
      };
      
      set((s) => {
        if (s.historyIndex < s.history.length - 1) {
          s.history.splice(s.historyIndex + 1);
        }
        s.history.push(batch);
        
        if (s.history.length > s.maxHistorySize) {
          s.history.shift();
        } else {
          s.historyIndex++;
        }
        
        s.historyIndex = s.history.length - 1;
        s.isPainting = false;
        s.currentStroke = null;
      });
    },

    paintCell: (q, r, color) => set((state) => {
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      const cellId = `${q},${r}`;
      const existingCell = activeLayer.cells.get(cellId);
      
      // Don't paint if the color is the same (optimization)
      if (existingCell && existingCell.color === color) {
        return;
      }
      
      // Track stroke for batch undo/redo
      if (state.isPainting && state.currentStroke) {
        if (!state.currentStroke.cells.has(cellId)) {
          state.currentStroke.cells.set(cellId, { 
            previousColor: existingCell?.color, 
            wasEmpty: !existingCell 
          });
        }
      }

      // Execute immediately
      const cell: HexCell = {
        id: cellId,
        q,
        r,
        color,
        layerId: activeLayer.id,
        timestamp: Date.now()
      };
      activeLayer.cells.set(cellId, cell);
      
      // Only add to history for single clicks (not during painting strokes)
      if (!state.isPainting) {
        const command: PaintCommand = {
          type: 'paint',
          cellId,
          layerId: activeLayer.id,
          newColor: color,
          previousColor: existingCell?.color,
          wasEmpty: !existingCell,
          timestamp: Date.now(),
          userId: state.currentUser.id,
          execute: () => {},
          undo: () => {}
        };
        
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
    }),

    eraseCell: (q, r) => set((state) => {
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      const cellId = `${q},${r}`;
      const existingCell = activeLayer.cells.get(cellId);
      
      if (!existingCell) return;
      
      // Track stroke for batch undo/redo
      if (state.isPainting && state.currentStroke) {
        if (!state.currentStroke.cells.has(cellId)) {
          state.currentStroke.cells.set(cellId, { 
            previousColor: existingCell.color, 
            wasEmpty: false 
          });
        }
      }

      // Execute immediately
      activeLayer.cells.delete(cellId);
      
      // Only add to history for single clicks (not during painting strokes)
      if (!state.isPainting) {
        const command: EraseCommand = {
          type: 'erase',
          cellId,
          layerId: activeLayer.id,
          previousColor: existingCell.color,
          timestamp: Date.now(),
          userId: state.currentUser.id,
          execute: () => {},
          undo: () => {}
        };
        
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
    }),

    fillArea: (q, r, color) => {
      const state = get();
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      
      if (!activeLayer || activeLayer.locked) return;
      
      try {
        const changes = floodFill(state.layers, state.activeLayerId, state.globalGridType, q, r, color);
        
        if (changes.length === 0) {
          return;
        }
        
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
        
        const batch: BatchCommand = {
          type: 'batch',
          name: 'Fill Area',
          commands,
          timestamp: Date.now(),
          userId: state.currentUser.id,
          execute: () => {},
          undo: () => {}
        };
        
        // Execute all changes and add to history as single operation
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
            
            // Add batch to history
            if (state.historyIndex < state.history.length - 1) {
              state.history.splice(state.historyIndex + 1);
            }
            
            state.history.push(batch);
            
            if (state.history.length > state.maxHistorySize) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
            
            state.historyIndex = state.history.length - 1;
          }
        });
        
      } catch (error) {
        console.error('Fill operation failed:', error);
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
          return;
        }
      }
    },

    executeCommand: (command) => {
      command.execute();
    },

    undo: () => {
      const state = get();
      if (state.canUndo()) {
        const commandToUndo = state.history[state.historyIndex];
        
        set((state) => {
          state.historyIndex--;

          const commands = commandToUndo.type === 'batch' 
            ? [...(commandToUndo as BatchCommand).commands].reverse() 
            : [commandToUndo];

          for (const command of commands) {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (!layer) continue;
            
            if (command.type === 'paint') {
              const paintCmd = command as PaintCommand;
              if (paintCmd.wasEmpty) {
                layer.cells.delete(paintCmd.cellId);
              } else if (paintCmd.previousColor) {
                const [q, r] = paintCmd.cellId.split(',').map(Number);
                layer.cells.set(paintCmd.cellId, { 
                  id: paintCmd.cellId, 
                  q, 
                  r, 
                  color: paintCmd.previousColor, 
                  layerId: layer.id, 
                  timestamp: Date.now() 
                });
              }
            } else if (command.type === 'erase') {
              const eraseCmd = command as EraseCommand;
              const [q, r] = eraseCmd.cellId.split(',').map(Number);
              layer.cells.set(eraseCmd.cellId, { 
                id: eraseCmd.cellId, 
                q, 
                r, 
                color: eraseCmd.previousColor, 
                layerId: layer.id, 
                timestamp: Date.now() 
              });
            }
          }
        });
      }
    },

    redo: () => {
      const state = get();
      if (state.canRedo()) {
        set((state) => {
          state.historyIndex++;
        });
        
        const commandToRedo = state.history[state.historyIndex];
        
        set((state) => {
          const commands = commandToRedo.type === 'batch' 
            ? (commandToRedo as BatchCommand).commands 
            : [commandToRedo];

          for (const command of commands) {
            const layer = state.layers.find(l => l.id === command.layerId);
            if (!layer) continue;
            
            if (command.type === 'paint') {
              const paintCmd = command as PaintCommand;
              const [q, r] = paintCmd.cellId.split(',').map(Number);
              layer.cells.set(paintCmd.cellId, { 
                id: paintCmd.cellId, 
                q, 
                r, 
                color: paintCmd.newColor, 
                layerId: layer.id, 
                timestamp: paintCmd.timestamp 
              });
            } else if (command.type === 'erase') {
              const eraseCmd = command as EraseCommand;
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
        globalGridType: state.globalGridType,
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
            cells: new Map(layer.cells),
            gridType: layer.gridType || 'hexagon'
          }));
          state.activeLayerId = state.layers[0]?.id || '';
          
          if (imported.globalGridType) {
            state.globalGridType = imported.globalGridType;
          }
          
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