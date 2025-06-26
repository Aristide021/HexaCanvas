import { CellCoordinate, IGrid } from '../types';

export class PixelGrid implements IGrid {
  private size: number;

  constructor(size: number = 20) {
    this.size = size;
  }

  // Convert axial coordinates to pixel coordinates for rectangular pixel grid
  axialToPixel(q: number, r: number): { x: number; y: number } {
    // For pixel grid, we treat q as x and r as y in a simple rectangular grid
    const x = q * this.size;
    const y = r * this.size;
    return { x, y };
  }

  // Convert pixel coordinates to axial coordinates
  pixelToAxial(x: number, y: number): CellCoordinate {
    const q = Math.floor(x / this.size);
    const r = Math.floor(y / this.size);
    return { q, r };
  }

  // Get square vertices for drawing
  getCellVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const halfSize = this.size / 2;
    
    return [
      { x: centerX - halfSize, y: centerY - halfSize }, // Top-left
      { x: centerX + halfSize, y: centerY - halfSize }, // Top-right
      { x: centerX + halfSize, y: centerY + halfSize }, // Bottom-right
      { x: centerX - halfSize, y: centerY + halfSize }  // Bottom-left
    ];
  }

  // Get neighbors of a pixel cell (4-directional)
  getNeighbors(q: number, r: number): CellCoordinate[] {
    return [
      { q: q + 1, r: r },     // Right
      { q: q - 1, r: r },     // Left
      { q: q, r: r + 1 },     // Down
      { q: q, r: r - 1 }      // Up
    ];
  }

  // Check if point is inside pixel cell bounds
  pointInCell(x: number, y: number, cellX: number, cellY: number): boolean {
    const halfSize = this.size / 2;
    return (
      x >= cellX - halfSize &&
      x <= cellX + halfSize &&
      y >= cellY - halfSize &&
      y <= cellY + halfSize
    );
  }

  // Snap point to grid
  snapToGrid(x: number, y: number, threshold: number = 3): { x: number; y: number } {
    const axial = this.pixelToAxial(x, y);
    const snapped = this.axialToPixel(axial.q, axial.r);
    
    // Adjust to center of pixel
    snapped.x += this.size / 2;
    snapped.y += this.size / 2;
    
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