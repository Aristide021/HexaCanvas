export interface CellCoordinate {
  q: number;
  r: number;
  s?: number;
}

export interface HexCell {
  id: string;
  q: number;
  r: number;
  color: string;
  layerId: string;
  timestamp: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  cells: Map<string, HexCell>;
}

export interface CanvasState {
  layers: Layer[];
  activeLayerId: string;
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  generated: boolean;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface Session {
  id: string;
  name: string;
  users: User[];
  lastModified: number;
}

// Command Pattern for Undo/Redo
export interface Command {
  execute(): void;
  undo(): void;
  timestamp: number;
  userId: string;
}

export interface PaintCommand extends Command {
  type: 'paint';
  cellId: string;
  layerId: string;
  newColor: string;
  previousColor?: string;
  wasEmpty: boolean;
}

export interface EraseCommand extends Command {
  type: 'erase';
  cellId: string;
  layerId: string;
  previousColor: string;
}

export interface LayerCommand extends Command {
  type: 'layer_add' | 'layer_remove' | 'layer_update';
  layerId: string;
  layerData?: any;
}

export type AnyCommand = PaintCommand | EraseCommand | LayerCommand;

export interface Delta {
  type: 'cell_update' | 'layer_add' | 'layer_remove' | 'layer_update';
  payload: any;
  timestamp: number;
  userId: string;
}