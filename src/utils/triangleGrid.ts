// src/utils/triangleGrid.ts

import { CellCoordinate, IGrid } from '../types';

export class TriangleGrid implements IGrid {
  private size: number;
  private triHeight: number;
  private triWidth: number;

  constructor(size: number = 20) {
    this.size = size;
    // The height of an equilateral triangle
    this.triHeight = size * (Math.sqrt(3) / 2);
    // The base width of a single triangle
    this.triWidth = size;
  }

  axialToPixel(q: number, r: number): { x: number; y: number } {
    const x = q * this.triWidth * 0.5;
    const y = r * this.triHeight;
    return { x, y };
  }

  pixelToAxial(x: number, y: number): CellCoordinate {
    const rFloat = y / this.triHeight;
    const qFloat = x / (this.triWidth * 0.5);

    let r = Math.round(rFloat);
    let q = Math.round(qFloat);

    const rDiff = Math.abs(r - rFloat);
    const qDiff = Math.abs(q - qFloat);
    
    // This is a simplified rounding for a staggered grid, which needs refinement.
    // Let's use a more robust method by checking which region we are in.
    const gridX = Math.floor(x / (this.triWidth / 2));
    const gridY = Math.floor(y / this.triHeight);

    const relX = x - gridX * (this.triWidth / 2);
    const relY = y - gridY * this.triHeight;
    
    const gradient = this.triHeight / (this.triWidth / 2);

    if ((gridX + gridY) % 2 === 0) { // Downward pointing region
      if (relY > (-gradient * relX) + this.triHeight) {
        return { q: gridX, r: gridY + 1 };
      }
      return { q: gridX, r: gridY };
    } else { // Upward pointing region
      if (relY < (gradient * relX)) {
        return { q: gridX, r: gridY };
      }
      return { q: gridX - 1, r: gridY };
    }
  }

  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const { q, r } = this.pixelToAxial(centerX, centerY);
    const isUpward = (q + r) % 2 !== 0;

    const trueCenter = this.axialToPixel(q, r);
    const cx = trueCenter.x;
    const cy = trueCenter.y;
    
    const halfWidth = this.triWidth / 2;
    
    if (isUpward) {
      return [
        { x: cx, y: cy - (2 / 3) * this.triHeight },
        { x: cx - halfWidth, y: cy + (1 / 3) * this.triHeight },
        { x: cx + halfWidth, y: cy + (1 / 3) * this.triHeight }
      ];
    } else {
      return [
        { x: cx, y: cy + (2 / 3) * this.triHeight },
        { x: cx + halfWidth, y: cy - (1 / 3) * this.triHeight },
        { x: cx - halfWidth, y: cy - (1 / 3) * this.triHeight }
      ];
    }
  }

  getNeighbors(q: number, r: number): CellCoordinate[] {
    const isUpward = (q + r) % 2 !== 0;
    
    if (isUpward) {
      return [{ q: q - 1, r }, { q: q + 1, r }, { q: q, r: r - 1 }];
    } else {
      return [{ q: q - 1, r }, { q: q + 1, r }, { q: q, r: r + 1 }];
    }
  }

  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const vertices = this.getCellVertices(cellX, cellY);
    if (vertices.length < 3) return false;
    
    const x1 = vertices[0].x, y1 = vertices[0].y;
    const x2 = vertices[1].x, y2 = vertices[1].y;
    const x3 = vertices[2].x, y3 = vertices[2].y;

    const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
    if (denominator === 0) return false;

    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }

  snapToGrid(x: number, y: number, threshold?: number): { x: number; y: number } {
    const { q, r } = this.pixelToAxial(x, y);
    const snapped = this.axialToPixel(q, r);
    
    if (threshold) {
        const distance = Math.sqrt(Math.pow(x - snapped.x, 2) + Math.pow(y - snapped.y, 2));
        if (distance <= threshold) return snapped;
        return {x, y};
    }
    
    return snapped;
  }

  setSize(size: number): void {
    this.size = size;
    this.triHeight = size * (Math.sqrt(3) / 2);
    this.triWidth = size;
  }

  getSize(): number {
    return this.size;
  }
}