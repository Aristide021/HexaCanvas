import { CellCoordinate, IGrid } from '../types';

export class TriangleGrid implements IGrid {
  private size: number;
  private triHeight: number;
  private triWidth: number;

  constructor(size: number = 20) {
    this.size = size;
    // For proper tiling, we need the triangle height to be the full size
    this.triHeight = size * Math.sqrt(3) / 2;
    // Width should be the full size for proper spacing
    this.triWidth = size;
  }

  // Convert grid coordinates (q, r) to pixel coordinates (x, y)
  axialToPixel(q: number, r: number): { x: number; y: number } {
    // Improved spacing for better triangle tiling
    const x = q * this.triWidth * 0.5;
    const y = r * this.triHeight * (2/3);
    return { x, y };
  }

  // Convert pixel coordinates (x, y) to grid coordinates (q, r)
  pixelToAxial(x: number, y: number): CellCoordinate {
    // Improved coordinate conversion
    const q = Math.round((x * 2) / this.triWidth);
    const r = Math.round((y * 3) / (this.triHeight * 2));
    
    // Fine-tune the selection based on local position
    const localX = x - (q * this.triWidth * 0.5);
    const localY = y - (r * this.triHeight * (2/3));
    
    // Determine if we need to adjust based on triangle orientation
    const isUpward = (q + r) % 2 !== 0;
    const slope = this.triHeight / (this.triWidth * 0.5);
    
    let finalQ = q;
    let finalR = r;
    
    // Adjust based on which side of the triangle diagonal we're on
    if (isUpward) {
      if (localY > slope * Math.abs(localX)) {
        finalR += localY > 0 ? 1 : -1;
      }
    } else {
      if (localY < -slope * Math.abs(localX) + this.triHeight * (2/3)) {
        finalR += localY > 0 ? 1 : -1;
      }
    }
    
    return { q: finalQ, r: finalR };
  }

  // Get triangle vertices for drawing - MUCH LARGER triangles
  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const { q, r } = this.pixelToAxial(centerX, centerY);
    const isUpward = (q + r) % 2 !== 0;

    // Get the true center for this triangle
    const trueCenter = this.axialToPixel(q, r);
    const cx = trueCenter.x;
    const cy = trueCenter.y;
    
    // Make triangles MUCH larger - use the full size for proper coverage
    const height = this.size * 1.2; // Increased size for better coverage
    const halfWidth = this.size * 0.8; // Increased width
    
    if (isUpward) {
      // Upward pointing triangle
      return [
        { x: cx, y: cy - height * 0.6 },                    // Top vertex
        { x: cx - halfWidth, y: cy + height * 0.4 },        // Bottom left
        { x: cx + halfWidth, y: cy + height * 0.4 }         // Bottom right
      ];
    } else {
      // Downward pointing triangle  
      return [
        { x: cx, y: cy + height * 0.6 },                    // Bottom vertex
        { x: cx - halfWidth, y: cy - height * 0.4 },        // Top left
        { x: cx + halfWidth, y: cy - height * 0.4 }         // Top right
      ];
    }
  }

  // Get the neighbors of a triangle cell
  getNeighbors(q: number, r: number): CellCoordinate[] {
    const isUpward = (q + r) % 2 !== 0;
    
    if (isUpward) {
      // Upward triangle neighbors
      return [
        { q: q - 1, r: r },     // Left
        { q: q + 1, r: r },     // Right
        { q: q, r: r - 1 },     // Top
        { q: q - 1, r: r + 1 }, // Bottom-left
        { q: q + 1, r: r + 1 }  // Bottom-right
      ];
    } else {
      // Downward triangle neighbors
      return [
        { q: q - 1, r: r },     // Left
        { q: q + 1, r: r },     // Right
        { q: q, r: r + 1 },     // Bottom
        { q: q - 1, r: r - 1 }, // Top-left
        { q: q + 1, r: r - 1 }  // Top-right
      ];
    }
  }

  // Check if a point is inside a triangle using barycentric coordinates
  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const vertices = this.getCellVertices(cellX, cellY);
    
    // Use the standard barycentric coordinate test
    const v0x = vertices[2].x - vertices[0].x;
    const v0y = vertices[2].y - vertices[0].y;
    const v1x = vertices[1].x - vertices[0].x;
    const v1y = vertices[1].y - vertices[0].y;
    const v2x = x - vertices[0].x;
    const v2y = y - vertices[0].y;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }

  // Snap point to the center of the nearest triangle
  snapToGrid(x: number, y: number, threshold?: number): { x: number; y: number } {
    const { q, r } = this.pixelToAxial(x, y);
    const snapped = this.axialToPixel(q, r);
    
    if (threshold) {
      const distance = Math.sqrt(Math.pow(x - snapped.x, 2) + Math.pow(y - snapped.y, 2));
      if (distance <= threshold) {
        return snapped;
      }
      return { x, y };
    }
    
    return snapped;
  }

  setSize(size: number): void {
    this.size = size;
    this.triHeight = size * Math.sqrt(3) / 2;
    this.triWidth = size;
  }

  getSize(): number {
    return this.size;
  }
}