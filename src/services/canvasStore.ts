import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CanvasState, Layer, HexCell, Tool, ColorPalette, User, AnyCommand, PaintCommand, EraseCommand, BatchCommand, GridType, IGrid } from '../types';
import { GridManager } from '../utils/gridManager';

interface CanvasStore extends CanvasState {
  // ... (interface remains the same as your last version)
  selectedColor: string;
  activeTool: string;
  isPainting: boolean;
  currentStroke: { command: 'paint' | 'erase'; cells: Map<string, { previousColor?: string, wasEmpty: boolean }> } | null;
  history: AnyCommand[];
  historyIndex: number;
  maxHistorySize: number;
  users: User[];
  currentUser: User;
  palettes: ColorPalette[];
  activePaletteId: string;
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

// --- MODIFIED ---
// This function now accepts a grid instance to become grid-agnostic.
const floodFill = (
  activeLayer: Layer,
  grid: IGrid,
  startQ: number,
  startR: number,
  newColor: string
): Array<{ q: number; r: number; oldColor: string | null }> => {
  const startCellId = `${startQ},${startR}`;
  const startCell = activeLayer.cells.get(startCellId);
  const targetColor = startCell?.color || null;
  
  if (targetColor === newColor) return [];

  const visited = new Set<string>();
  const toProcess = [{ q: startQ, r: startR }];
  const changes: Array<{ q: number; r: number; oldColor: string | null }> = [];

  const MAX_CELLS = 5000;
  let processedCells = 0;

  while (toProcess.length > 0 && processedCells < MAX_CELLS) {
    const current = toProcess.shift()!;
    const cellId = `${current.q},${current.r}`;
    
    if (visited.has(cellId)) continue;
    
    visited.add(cellId);
    processedCells++;

    const cell = activeLayer.cells.get(cellId);
    const cellColor = cell?.color || null;
    
    if (cellColor === targetColor) {
      changes.push({ q: current.q, r: current.r, oldColor: cellColor });
      
      // *** CRITICAL CHANGE ***
      // Use the passed-in grid's getNeighbors method.
      const neighbors = grid.getNeighbors(current.q, current.r);

      neighbors.forEach(neighbor => {
        const neighborId = `${neighbor.q},${neighbor.r}`;
        if (!visited.has(neighborId)) {
          toProcess.push(neighbor);
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
    // ... (rest of the initial state is the same)
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
    history: [],
    historyIndex: -1,
    maxHistorySize: 100,
    users: [],
    currentUser: { id: `user-${Date.now()}`, name: 'You', color: '#3498DB' },
    palettes: [createDefaultPalette()],
    activePaletteId: 'default',

    // --- MODIFIED ---
    // The fillArea action now instantiates a GridManager to get the correct grid.
    fillArea: (q, r, color) => {
      const state = get();
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      if (!activeLayer || activeLayer.locked) return;
      
      // Get the correct grid instance for the active layer
      const gridManager = new GridManager(state.gridSize);
      const grid = gridManager.getGridForLayer(activeLayer.gridType, state.globalGridType);

      try {
        const changes = floodFill(activeLayer, grid, q, r, color);
        if (changes.length === 0) return;
        
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
        
        set((s) => {
          const layer = s.layers.find(l => l.id === activeLayer.id);
          if (layer) {
            commands.forEach(command => {
              const [cmdQ, cmdR] = command.cellId.split(',').map(Number);
              layer.cells.set(command.cellId, { id: command.cellId, q: cmdQ, r: cmdR, color: command.newColor, layerId: layer.id, timestamp: command.timestamp });
            });
            
            if (s.historyIndex < s.history.length - 1) s.history.splice(s.historyIndex + 1);
            s.history.push(batch);
            if (s.history.length > s.maxHistorySize) s.history.shift();
            s.historyIndex = s.history.length - 1;
          }
        });
        
      } catch (error) {
        console.error('Fill operation failed:', error);
      }
    },

    // ... (The rest of the store file remains the same as your last version)
    addLayer: (name, gridType = 'hexagon') => set((state) => {
      const newLayer: Layer = { id: `layer-${Date.now()}`, name, visible: true, opacity: 1, locked: false, cells: new Map(), gridType };
      state.layers.push(newLayer);
      state.activeLayerId = newLayer.id;
    }),
    addPixelLayer: (name) => set((state) => {
      const newLayer: Layer = { id: `layer-${Date.now()}`, name, visible: true, opacity: 1, locked: false, cells: new Map(), gridType: 'pixel' };
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
    setActiveLayer: (layerId) => set((state) => { state.activeLayerId = layerId; }),
    toggleLayerVisibility: (layerId) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (layer) layer.visible = !layer.visible;
    }),
    updateLayerName: (layerId, name) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (layer) layer.name = name;
    }),
    setGlobalGridType: (gridType) => set((state) => { state.globalGridType = gridType; }),
    rasterizeLayer: (layerId) => set((state) => {
      const layer = state.layers.find(l => l.id === layerId);
      if (!layer || layer.gridType === 'pixel') return;
      layer.gridType = 'pixel';
      layer.name = layer.name.replace('Shape', 'Pixel');
      if (!layer.name.includes('(Rasterized)')) {
        layer.name += ' (Rasterized)';
      }
    }),
    startPainting: () => set((state) => {
      state.isPainting = true;
      state.currentStroke = { command: state.activeTool as 'paint' | 'erase', cells: new Map() };
    }),
    stopPainting: () => {
      const state = get();
      if (!state.isPainting || !state.currentStroke || state.currentStroke.cells.size === 0) {
        set((s) => { s.isPainting = false; s.currentStroke = null; });
        return;
      }
      const { command, cells } = state.currentStroke;
      const commands: (PaintCommand | EraseCommand)[] = [];
      cells.forEach((change, cellId) => {
        if (command === 'paint') {
          commands.push({ type: 'paint', cellId, layerId: state.activeLayerId, newColor: state.selectedColor, previousColor: change.previousColor, wasEmpty: change.wasEmpty, timestamp: Date.now(), userId: state.currentUser.id, execute: () => {}, undo: () => {} });
        } else {
          commands.push({ type: 'erase', cellId, layerId: state.activeLayerId, previousColor: change.previousColor!, timestamp: Date.now(), userId: state.currentUser.id, execute: () => {}, undo: () => {} });
        }
      });
      const batch: BatchCommand = { type: 'batch', name: command === 'paint' ? 'Brush Stroke' : 'Erase Stroke', commands, timestamp: Date.now(), userId: state.currentUser.id, execute: () => {}, undo: () => {} };
      set((s) => {
        if (s.historyIndex < s.history.length - 1) s.history.splice(s.historyIndex + 1);
        s.history.push(batch);
        if (s.history.length > s.maxHistorySize) s.history.shift();
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
      if (existingCell && existingCell.color === color) return;
      if (state.isPainting && state.currentStroke && !state.currentStroke.cells.has(cellId)) {
        state.currentStroke.cells.set(cellId, { previousColor: existingCell?.color, wasEmpty: !existingCell });
      }
      activeLayer.cells.set(cellId, { id: cellId, q, r, color, layerId: activeLayer.id, timestamp: Date.now() });
      if (!state.isPainting) {
        const command: PaintCommand = { type: 'paint', cellId, layerId: activeLayer.id, newColor: color, previousColor: existingCell?.color, wasEmpty: !existingCell, timestamp: Date.now(), userId: state.currentUser.id, execute: () => {}, undo: () => {} };
        if (state.historyIndex < state.history.length - 1) state.history.splice(state.historyIndex + 1);
        state.history.push(command);
        if (state.history.length > state.maxHistorySize) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }
    }),
    eraseCell: (q, r) => set((state) => {
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      if (!activeLayer || activeLayer.locked) return;
      const cellId = `${q},${r}`;
      const existingCell = activeLayer.cells.get(cellId);
      if (!existingCell) return;
      if (state.isPainting && state.currentStroke && !state.currentStroke.cells.has(cellId)) {
        state.currentStroke.cells.set(cellId, { previousColor: existingCell.color, wasEmpty: false });
      }
      activeLayer.cells.delete(cellId);
      if (!state.isPainting) {
        const command: EraseCommand = { type: 'erase', cellId, layerId: activeLayer.id, previousColor: existingCell.color, timestamp: Date.now(), userId: state.currentUser.id, execute: () => {}, undo: () => {} };
        if (state.historyIndex < state.history.length - 1) state.history.splice(state.historyIndex + 1);
        state.history.push(command);
        if (state.history.length > state.maxHistorySize) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }
    }),
    pickColor: (q, r) => {
      const state = get();
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (!layer.visible) continue;
        const cell = layer.cells.get(`${q},${r}`);
        if (cell) {
          set((s) => { s.selectedColor = cell.color; s.activeTool = 'brush'; });
          return;
        }
      }
    },
    executeCommand: (command) => { command.execute(); },
    undo: () => {
      const state = get();
      if (!state.canUndo()) return;
      const commandToUndo = state.history[state.historyIndex];
      set((s) => {
        s.historyIndex--;
        const commands = commandToUndo.type === 'batch' ? [...(commandToUndo as BatchCommand).commands].reverse() : [commandToUndo];
        for (const command of commands) {
          const layer = s.layers.find(l => l.id === command.layerId);
          if (!layer) continue;
          if (command.type === 'paint') {
            const paintCmd = command as PaintCommand;
            if (paintCmd.wasEmpty) { layer.cells.delete(paintCmd.cellId); }
            else if (paintCmd.previousColor) {
              const [q,r] = paintCmd.cellId.split(',').map(Number);
              layer.cells.set(paintCmd.cellId, { id: paintCmd.cellId, q, r, color: paintCmd.previousColor, layerId: layer.id, timestamp: Date.now() });
            }
          } else if (command.type === 'erase') {
            const eraseCmd = command as EraseCommand;
            const [q,r] = eraseCmd.cellId.split(',').map(Number);
            layer.cells.set(eraseCmd.cellId, { id: eraseCmd.cellId, q, r, color: eraseCmd.previousColor, layerId: layer.id, timestamp: Date.now() });
          }
        }
      });
    },
    redo: () => {
      const state = get();
      if (!state.canRedo()) return;
      const commandToRedo = state.history[state.historyIndex + 1];
      set((s) => {
        s.historyIndex++;
        const commands = commandToRedo.type === 'batch' ? (commandToRedo as BatchCommand).commands : [commandToRedo];
        for (const command of commands) {
          const layer = s.layers.find(l => l.id === command.layerId);
          if (!layer) continue;
          if (command.type === 'paint') {
            const paintCmd = command as PaintCommand;
            const [q,r] = paintCmd.cellId.split(',').map(Number);
            layer.cells.set(paintCmd.cellId, { id: paintCmd.cellId, q, r, color: paintCmd.newColor, layerId: layer.id, timestamp: paintCmd.timestamp });
          } else if (command.type === 'erase') {
            layer.cells.delete(command.layerId);
          }
        }
      });
    },
    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    setSelectedColor: (color) => set({ selectedColor: color }),
    setActiveTool: (toolId) => set({ activeTool: toolId }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    setGridSize: (size) => set({ gridSize: Math.max(10, Math.min(50, size)) }),
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
    clearCanvas: () => set((state) => {
      state.layers.forEach(layer => layer.cells.clear());
      state.history = [];
      state.historyIndex = -1;
    }),
    addPalette: (palette) => set((state) => { state.palettes.push(palette); state.activePaletteId = palette.id; }),
    setActivePalette: (paletteId) => set({ activePaletteId: paletteId }),
    addUser: (user) => set((state) => { state.users.push(user); }),
    removeUser: (userId) => set((state) => { state.users = state.users.filter(u => u.id !== userId); }),
    updateUserCursor: (userId, x, y) => set((state) => { const user = state.users.find(u => u.id === userId); if(user) user.cursor = {x,y}; }),
    exportCanvas: () => {
      const state = get();
      return JSON.stringify({ layers: state.layers.map(layer => ({ ...layer, cells: Array.from(layer.cells.entries()) })), globalGridType: state.globalGridType, metadata: { version: '2.1.0', exported: Date.now() } });
    },
    importCanvas: (data) => set((state) => {
      try {
        const imported = JSON.parse(data);
        if (imported.layers) {
          state.layers = imported.layers.map((layer: any) => ({ ...layer, cells: new Map(layer.cells), gridType: layer.gridType || 'hexagon' }));
          state.activeLayerId = state.layers[0]?.id || '';
          if (imported.globalGridType) state.globalGridType = imported.globalGridType;
          state.history = [];
          state.historyIndex = -1;
        }
      } catch (error) { console.error('Failed to import canvas:', error); }
    })
  }))
);

setTimeout(() => {
  const store = useCanvasStore.getState();
  if (store.layers.length > 0 && !store.activeLayerId) {
    store.setActiveLayer(store.layers[0].id);
  }
}, 0);