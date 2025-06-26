import { CellCoordinate } from '../types';

export class HexGrid {
  private size: number;

  constructor(size: number = 20) {
    this.size = size;
  }

  // Convert axial coordinates to pixel coordinates
  axialToPixel(q: number, r: number): { x: number; y: number } {
    const x = this.size * (3/2 * q);
    const y = this.size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  }

  // Convert pixel coordinates to axial coordinates
  pixelToAxial(x: number, y: number): CellCoordinate {
    const q = (2/3 * x) / this.size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / this.size;
    return this.roundHex({ q, r, s: -q - r });
  }

  // Round fractional hex coordinates to nearest hex
  private roundHex(hex: CellCoordinate): CellCoordinate {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    let s = Math.round(hex.s || -hex.q - hex.r);

    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - (hex.s || -hex.q - hex.r));

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }

    return { q, r, s };
  }

  // Get cell ID from coordinates
  getCellId(q: number, r: number): string {
    return `${q},${r}`;
  }

  // Get neighbors of a hex cell
  getNeighbors(q: number, r: number): CellCoordinate[] {
    const directions = [
      { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    
    return directions.map(dir => ({
      q: q + dir.q,
      r: r + dir.r
    }));
  }

  // Check if point is inside hex cell bounds
  pointInHex(x: number, y: number, hexX: number, hexY: number): boolean {
    const dx = Math.abs(x - hexX);
    const dy = Math.abs(y - hexY);
    
    return dx <= this.size * Math.sqrt(3) / 2 && 
           dy <= this.size && 
           dx * Math.sqrt(3) + dy <= this.size * Math.sqrt(3);
  }

  // Get hex vertices for drawing
  getHexVertices(centerX: number, centerY: number): { x: number; y: number }[] {
    const vertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      vertices.push({
        x: centerX + this.size * Math.cos(angle),
        y: centerY + this.size * Math.sin(angle)
      });
    }
    return vertices;
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