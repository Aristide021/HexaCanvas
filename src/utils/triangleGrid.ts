import { CellCoordinate, IGrid } from '../types';

export class TriangleGrid implements IGrid {
  private size: number;

  constructor(size: number = 20) {
    this.size = size;
  }

  // Convert grid coordinates (q, r) to pixel coordinates (x, y)
  axialToPixel(q: number, r: number): { x: number; y: number } {
    // For triangular tiling, we need proper spacing
    // Each row is offset by half a triangle width
    const triangleWidth = this.size * Math.sqrt(3);
    const triangleHeight = this.size * 1.5;
    
    const x = q * triangleWidth * 0.5;
    const y = r * triangleHeight * 0.667; // Closer vertical spacing
    
    return { x, y };
  }

  // Convert pixel coordinates (x, y) to grid coordinates (q, r)
  pixelToAxial(x: number, y: number): CellCoordinate {
    const triangleWidth = this.size * Math.sqrt(3);
    const triangleHeight = this.size * 1.5;
    
    // Calculate approximate grid position
    const q = Math.round((x * 2) / (triangleWidth));
    const r = Math.round((y * 1.5) / triangleHeight);
    
    return { q, r };
  }

  // Get triangle vertices for drawing - MUCH LARGER triangles that overlap
  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    // Get the grid coordinates for this center point
    const { q, r } = this.pixelToAxial(centerX, centerY);
    
    // Determine triangle orientation
    const isUpward = (q + r) % 2 === 0;
    
    // Get the true center for this triangle
    const trueCenter = this.axialToPixel(q, r);
    const cx = trueCenter.x;
    const cy = trueCenter.y;
    
    // Make triangles MUCH larger to ensure proper coverage
    const height = this.size * 2.0; // Much larger height
    const width = this.size * 2.2;  // Much larger width
    
    if (isUpward) {
      // Upward pointing triangle
      return [
        { x: cx, y: cy - height * 0.5 },           // Top vertex
        { x: cx - width * 0.5, y: cy + height * 0.5 }, // Bottom left
        { x: cx + width * 0.5, y: cy + height * 0.5 }  // Bottom right
      ];
    } else {
      // Downward pointing triangle
      return [
        { x: cx, y: cy + height * 0.5 },           // Bottom vertex
        { x: cx - width * 0.5, y: cy - height * 0.5 }, // Top left
        { x: cx + width * 0.5, y: cy - height * 0.5 }  // Top right
      ];
    }
  }

  // Get the neighbors of a triangle cell
  getNeighbors(q: number, r: number): CellCoordinate[] {
    // For triangles, each triangle has 3 edge neighbors plus some corner neighbors
    return [
      { q: q - 1, r: r },     // Left
      { q: q + 1, r: r },     // Right
      { q: q, r: r - 1 },     // Up
      { q: q, r: r + 1 },     // Down
      { q: q - 1, r: r - 1 }, // Up-left
      { q: q + 1, r: r + 1 }  // Down-right
    ];
  }

  // Check if a point is inside a triangle using barycentric coordinates
  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const vertices = this.getCellVertices(cellX, cellY);
    
    // Simple bounding box check first for performance
    const minX = Math.min(vertices[0].x, vertices[1].x, vertices[2].x);
    const maxX = Math.max(vertices[0].x, vertices[1].x, vertices[2].x);
    const minY = Math.min(vertices[0].y, vertices[1].y, vertices[2].y);
    const maxY = Math.max(vertices[0].y, vertices[1].y, vertices[2].y);
    
    if (x < minX || x > maxX || y < minY || y > maxY) {
      return false;
    }
    
    // Barycentric coordinate test
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
  }

  getSize(): number {
    return this.size;
  }
}