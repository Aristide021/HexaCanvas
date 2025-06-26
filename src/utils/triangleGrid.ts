import { CellCoordinate, IGrid } from '../types';

export class TriangleGrid implements IGrid {
  private size: number;
  private triHeight: number;
  private triWidth: number;

  constructor(size: number = 20) {
    this.size = size;
    // The height of an equilateral triangle
    this.triHeight = size * (Math.sqrt(3) / 2);
    // The base width of two triangles side-by-side
    this.triWidth = size;
  }

  // Convert grid coordinates (q, r) to pixel coordinates (x, y)
  axialToPixel(q: number, r: number): { x: number; y: number } {
    const x = q * this.triWidth * 0.5;
    const y = r * this.triHeight;
    return { x, y };
  }

  // Convert pixel coordinates (x, y) to grid coordinates (q, r)
  pixelToAxial(x: number, y: number): CellCoordinate {
    const r = Math.round(y / this.triHeight);
    const q = Math.round(x / (this.triWidth * 0.5));

    // Determine the precise triangle by checking the local position within its containing rectangle
    const relY = y - r * this.triHeight;
    const relX = x - q * this.triWidth * 0.5;
    
    // Gradient of the diagonal line in the containing rectangle
    const gradient = this.triHeight / (this.triWidth * 0.5);

    let finalQ = q;
    let finalR = r;
    
    // The grid is a checkerboard pattern of upward and downward triangles
    if ((q + r) % 2 === 0) { // Downward-pointing triangle area
        if (relY > -gradient * relX + this.triHeight) { // Point is in the triangle below
            finalR++;
        }
    } else { // Upward-pointing triangle area
        if (relY < gradient * relX) { // Point is in the triangle to the left-up
            finalR--;
        }
    }
    
    return { q: finalQ, r: finalR };
  }

  // Get triangle vertices for drawing, centered on the *correct* pixel location
  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const { q, r } = this.pixelToAxial(centerX, centerY);
    const isUpward = (q + r) % 2 !== 0; // In this system, odd sum is upward

    // Recalculate the true center for perfect alignment
    const trueCenter = this.axialToPixel(q, r);
    const cx = trueCenter.x;
    const cy = trueCenter.y;
    
    const halfWidth = this.triWidth / 2;
    
    if (isUpward) {
      // Upward pointing triangle
      return [
        { x: cx, y: cy - (2 / 3) * this.triHeight },
        { x: cx - halfWidth, y: cy + (1 / 3) * this.triHeight },
        { x: cx + halfWidth, y: cy + (1 / 3) * this.triHeight }
      ];
    } else {
      // Downward pointing triangle
      return [
        { x: cx, y: cy + (2 / 3) * this.triHeight },
        { x: cx + halfWidth, y: cy - (1 / 3) * this.triHeight },
        { x: cx - halfWidth, y: cy - (1 / 3) * this.triHeight }
      ];
    }
  }

  // Get the three neighbors of a triangle cell
  getNeighbors(q: number, r: number): CellCoordinate[] {
    const isUpward = (q + r) % 2 !== 0;
    
    if (isUpward) {
      // Upward triangle's neighbors are left, right, and top
      return [
        { q: q - 1, r: r }, // Left
        { q: q + 1, r: r }, // Right
        { q: q, r: r - 1 }  // Top
      ];
    } else {
      // Downward triangle's neighbors are left, right, and bottom
      return [
        { q: q - 1, r: r }, // Left
        { q: q + 1, r: r }, // Right
        { q: q, r: r + 1 }  // Bottom
      ];
    }
  }

  // Check if a point is inside a triangle cell using barycentric coordinates
  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const vertices = this.getCellVertices(cellX, cellY);
    
    const x1 = vertices[0].x, y1 = vertices[0].y;
    const x2 = vertices[1].x, y2 = vertices[1].y;
    const x3 = vertices[2].x, y3 = vertices[2].y;

    const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }

  // Snap point to the center of the nearest triangle grid cell
  snapToGrid(x: number, y: number, threshold?: number): { x: number; y: number } {
    const { q, r } = this.pixelToAxial(x, y);
    const snapped = this.axialToPixel(q, r);
    
    if (threshold) {
        const distance = Math.sqrt(Math.pow(x - snapped.x, 2) + Math.pow(y - snapped.y, 2));
        if (distance <= threshold) {
            return snapped;
        }
    }
    
    return snapped; // For grids, we usually want to snap regardless of threshold
  }

  // Update size and recalculate dependent properties
  setSize(size: number): void {
    this.size = size;
    this.triHeight = size * (Math.sqrt(3) / 2);
    this.triWidth = size;
  }

  getSize(): number {
    return this.size;
  }
}