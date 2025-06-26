import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CanvasState, Layer, HexCell, Tool, ColorPalette, User, Delta } from '../types';

interface CanvasStore extends CanvasState {
  // Canvas state
  selectedColor: string;
  activeTool: string;
  history: Delta[][];
  historyIndex: number;
  
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
  
  setSelectedColor: (color: string) => void;
  setActiveTool: (toolId: string) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  
  undo: () => void;
  redo: () => void;
  
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
    history: [[]],
    historyIndex: 0,
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

    paintCell: (q, r, color) => set((state) => {
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        const cellId = `${q},${r}`;
        const cell: HexCell = {
          id: cellId,
          q,
          r,
          color,
          layerId: activeLayer.id,
          timestamp: Date.now()
        };
        activeLayer.cells.set(cellId, cell);
        
        // Add to history
        const delta: Delta = {
          type: 'cell_update',
          payload: { cellId, color, layerId: activeLayer.id },
          timestamp: Date.now(),
          userId: state.currentUser.id
        };
        
        if (state.historyIndex < state.history.length - 1) {
          state.history.splice(state.historyIndex + 1);
        }
        state.history.push([delta]);
        state.historyIndex = state.history.length - 1;
      }
    }),

    eraseCell: (q, r) => set((state) => {
      const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        const cellId = `${q},${r}`;
        activeLayer.cells.delete(cellId);
      }
    }),

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

    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        // Apply reverse of current state
        // Implementation would reverse the last operation
      }
    }),

    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        // Reapply operation
      }
    }),

    addPalette: (palette) => set((state) => {
      state.palettes.push(palette);
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
        }
      } catch (error) {
        console.error('Failed to import canvas:', error);
      }
    })
  }))
);

// Initialize active layer
setTimeout(() => {
  const store = useCanvasStore.getState();
  if (store.layers.length > 0 && !store.activeLayerId) {
    store.setActiveLayer(store.layers[0].id);
  }
}, 0);