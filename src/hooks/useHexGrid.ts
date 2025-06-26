import { useMemo } from 'react';
import { GridManager } from '../utils/gridManager';
import { GridType } from '../types';

export const useGridManager = (size: number = 20, globalGridType: GridType = 'hexagon') => {
  const gridManager = useMemo(() => new GridManager(size), [size]);
  
  // Update grid manager when global grid type changes
  useMemo(() => {
    gridManager.setCurrentGridType(globalGridType);
  }, [gridManager, globalGridType]);

  const utilities = useMemo(() => ({
    getGrid: (gridType?: GridType) => gridManager.getGrid(gridType),
    getGridForLayer: (layerGridType: GridType) => 
      gridManager.getGridForLayer(layerGridType, globalGridType),
    getCellFromPoint: (x: number, y: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.pixelToAxial(x, y);
    },
    getPixelFromCell: (q: number, r: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.axialToPixel(q, r);
    },
    getNeighbors: (q: number, r: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.getNeighbors(q, r);
    },
    snapToGrid: (x: number, y: number, threshold?: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.snapToGrid(x, y, threshold);
    },
    getVertices: (centerX: number, centerY: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.getCellVertices(centerX, centerY);
    },
    pointInCell: (x: number, y: number, cellX: number, cellY: number, gridType?: GridType) => {
      const grid = gridManager.getGrid(gridType);
      return grid.pointInCell(x, y, cellX, cellY);
    }
  }), [gridManager, globalGridType]);

  return { gridManager, ...utilities };
};

// Keep the old hook for backward compatibility
export const useHexGrid = (size: number = 20) => {
  const { gridManager, getGrid } = useGridManager(size, 'hexagon');
  const grid = getGrid('hexagon');
  
  const utilities = useMemo(() => ({
    getCellFromPoint: (x: number, y: number) => grid.pixelToAxial(x, y),
    getPixelFromCell: (q: number, r: number) => grid.axialToPixel(q, r),
    getNeighbors: (q: number, r: number) => grid.getNeighbors(q, r),
    snapToGrid: (x: number, y: number, threshold?: number) => grid.snapToGrid(x, y, threshold),
    getVertices: (centerX: number, centerY: number) => grid.getCellVertices(centerX, centerY),
    pointInHex: (x: number, y: number, hexX: number, hexY: number) => grid.pointInCell(x, y, hexX, hexY)
  }), [grid]);

  return { grid, ...utilities };
};