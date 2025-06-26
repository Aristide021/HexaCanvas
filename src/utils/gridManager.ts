import { GridType, IGrid } from '../types';
import { HexGrid } from './hexGrid';
import { TriangleGrid } from './triangleGrid';

export class GridManager {
  private grids: Map<GridType, IGrid> = new Map();
  private currentGridType: GridType = 'hexagon';

  constructor(size: number = 20) {
    this.grids.set('hexagon', new HexGrid(size));
    this.grids.set('triangle', new TriangleGrid(size));
    // Pixel grid would be implemented later as a simple rectangular grid
  }

  getGrid(gridType?: GridType): IGrid {
    const type = gridType || this.currentGridType;
    const grid = this.grids.get(type);
    if (!grid) {
      throw new Error(`Grid type ${type} not implemented`);
    }
    return grid;
  }

  setCurrentGridType(gridType: GridType) {
    this.currentGridType = gridType;
  }

  getCurrentGridType(): GridType {
    return this.currentGridType;
  }

  setSize(size: number) {
    this.grids.forEach(grid => grid.setSize(size));
  }

  getSize(): number {
    return this.getGrid().getSize();
  }

  // Helper method to get the appropriate grid for a layer
  getGridForLayer(layerGridType: GridType, globalGridType: GridType): IGrid {
    // If layer is a pixel layer, it uses its own coordinate system
    if (layerGridType === 'pixel') {
      return this.getGrid('pixel');
    }
    
    // Shape layers use the global grid type
    return this.getGrid(globalGridType);
  }
}