import { CellCoordinate, IGrid } from '../types';

export class TriangleGrid implements IGrid {
  private size: number;

  constructor(size: number = 20) {
    this.size = size;
  }

  // Convert axial coordinates to pixel coordinates for triangular grid
  axialToPixel(q: number, r: number): { x: number; y: number } {
    // Triangular grid uses a different coordinate system
    // Each triangle has a base width and height
    const width = this.size * Math.sqrt(3);
    const height = this.size * 1.5;
    
    // Calculate base position
    const x = q * width * 0.5 + (r % 2) * width * 0.25;
    const y = r * height * 0.67;
    
    return { x, y };
  }

  // Convert pixel coordinates to axial coordinates
  pixelToAxial(x: number, y: number): CellCoordinate {
    const width = this.size * Math.sqrt(3);
    const height = this.size * 1.5;
    
    // Approximate grid position
    const r = Math.round(y / (height * 0.67));
    const q = Math.round((x - (r % 2) * width * 0.25) / (width * 0.5));
    
    return this.roundTriangle({ q, r });
  }

  // Round fractional triangle coordinates to nearest triangle
  private roundTriangle(coord: CellCoordinate): CellCoordinate {
    const q = Math.round(coord.q);
    const r = Math.round(coord.r);
    return { q, r };
  }

  // Get triangle vertices for drawing
  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const height = this.size;
    const width = this.size * Math.sqrt(3) / 2;
    
    // Determine triangle orientation based on grid position
    // We'll use a checkerboard pattern: even sum = up, odd sum = down
    const { q, r } = this.pixelToAxial(centerX, centerY);
    const isUpward = (q + r) % 2 === 0;
    
    if (isUpward) {
      // Upward pointing triangle
      return [
        { x: centerX, y: centerY - height * 0.67 },           // Top vertex
        { x: centerX - width, y: centerY + height * 0.33 },   // Bottom left
        { x: centerX + width, y: centerY + height * 0.33 }    // Bottom right
      ];
    } else {
      // Downward pointing triangle
      return [
        { x: centerX - width, y: centerY - height * 0.33 },   // Top left
        { x: centerX + width, y: centerY - height * 0.33 },   // Top right
        { x: centerX, y: centerY + height * 0.67 }            // Bottom vertex
      ];
    }
  }

  // Get neighbors of a triangle cell
  getNeighbors(q: number, r: number): CellCoordinate[] {
    // Triangle neighbors depend on orientation
    const isUpward = (q + r) % 2 === 0;
    
    if (isUpward) {
      // Upward triangle has 3 neighbors below and sides
      return [
        { q: q - 1, r: r },     // Left
        { q: q + 1, r: r },     // Right
        { q: q, r: r + 1 }      // Below
      ];
    } else {
      // Downward triangle has 3 neighbors above and sides
      return [
        { q: q - 1, r: r },     // Left
        { q: q + 1, r: r },     // Right
        { q: q, r: r - 1 }      // Above
      ];
    }
  }

  // Check if point is inside triangle cell bounds
  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const vertices = this.getCellVertices(cellX, cellY);
    
    // Use barycentric coordinates to check if point is inside triangle
    const v0 = { x: vertices[2].x - vertices[0].x, y: vertices[2].y - vertices[0].y };
    const v1 = { x: vertices[1].x - vertices[0].x, y: vertices[1].y - vertices[0].y };
    const v2 = { x: x - vertices[0].x, y: y - vertices[0].y };

    const dot00 = v0.x * v0.x + v0.y * v0.y;
    const dot01 = v0.x * v1.x + v0.y * v1.y;
    const dot02 = v0.x * v2.x + v0.y * v2.y;
    const dot11 = v1.x * v1.x + v1.y * v1.y;
    const dot12 = v1.x * v2.x + v1.y * v2.y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }

  // Snap point to grid
  snapToGrid(x: number, y: number, threshold: number = 3): { x: number; y: number } {
    const axial = this.pixelToAxial(x, y);
    const snapped = this.axialToPixel(axial.q, axial.r);
    
    const distance = Math.sqrt(Math.pow(x - snapped.x, 2) + Math.pow(y - snapped.y, 2));
    
    if (distance <= threshold) {
      return snapped;
    }
    
    return { x, y };
  }

  setSize(size: number) {
    this.size = size;
  }

  getSize(): number {
    return this.size;
  }
}