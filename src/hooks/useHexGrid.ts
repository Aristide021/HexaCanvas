import { useMemo } from 'react';
import { HexGrid } from '../utils/hexGrid';

export const useHexGrid = (size: number = 20) => {
  const grid = useMemo(() => new HexGrid(size), [size]);
  
  const utilities = useMemo(() => ({
    getCellFromPoint: (x: number, y: number) => grid.pixelToAxial(x, y),
    getPixelFromCell: (q: number, r: number) => grid.axialToPixel(q, r),
    getNeighbors: (q: number, r: number) => grid.getNeighbors(q, r),
    snapToGrid: (x: number, y: number, threshold?: number) => grid.snapToGrid(x, y, threshold),
    getVertices: (centerX: number, centerY: number) => grid.getHexVertices(centerX, centerY),
    pointInHex: (x: number, y: number, hexX: number, hexY: number) => grid.pointInHex(x, y, hexX, hexY)
  }), [grid]);

  return { grid, ...utilities };
};