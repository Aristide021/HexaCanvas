import { Layer } from '../types';
import { HexGrid } from '../utils/hexGrid';

export class ExportService {
  private static hexGrid = new HexGrid(20);

  static async exportToPNG(
    layers: Layer[], 
    width: number = 1024, 
    height: number = 1024,
    backgroundColor: string = '#FFFFFF'
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Calculate center offset
      const centerX = width / 2;
      const centerY = height / 2;

      // Render each visible layer
      layers.filter(layer => layer.visible).forEach(layer => {
        ctx.globalAlpha = layer.opacity;
        
        layer.cells.forEach(cell => {
          const { x, y } = this.hexGrid.axialToPixel(cell.q, cell.r);
          const vertices = this.hexGrid.getHexVertices(centerX + x, centerY + y);
          
          ctx.fillStyle = cell.color;
          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          
          for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
        });
      });

      ctx.globalAlpha = 1;
      resolve(canvas.toDataURL('image/png'));
    });
  }

  static async exportToSVG(layers: Layer[]): Promise<string> {
    const svgElements: string[] = [];
    const minMax = this.calculateBounds(layers);
    
    const width = (minMax.maxX - minMax.minX + 2) * this.hexGrid.getSize() * 2;
    const height = (minMax.maxY - minMax.minY + 2) * this.hexGrid.getSize() * 2;

    svgElements.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
    svgElements.push(`<rect width="100%" height="100%" fill="white"/>`);

    layers.filter(layer => layer.visible).forEach(layer => {
      const groupOpacity = layer.opacity !== 1 ? ` opacity="${layer.opacity}"` : '';
      svgElements.push(`<g${groupOpacity}>`);
      
      layer.cells.forEach(cell => {
        const { x, y } = this.hexGrid.axialToPixel(cell.q, cell.r);
        const vertices = this.hexGrid.getHexVertices(x - minMax.minX, y - minMax.minY);
        
        const pathData = vertices.map((v, i) => 
          `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`
        ).join(' ') + ' Z';
        
        svgElements.push(`<path d="${pathData}" fill="${cell.color}" stroke="none"/>`);
      });
      
      svgElements.push('</g>');
    });

    svgElements.push('</svg>');
    return svgElements.join('\n');
  }

  static exportToHex(layers: Layer[]): ArrayBuffer {
    // Simplified .hex format implementation
    const header = new TextEncoder().encode('HEXELS\x02\x01');
    const data: number[] = [];

    // Add header
    data.push(...Array.from(header));

    // Add layers count
    data.push(layers.length);

    layers.forEach(layer => {
      // Layer name length and name
      const nameBytes = new TextEncoder().encode(layer.name);
      data.push(nameBytes.length);
      data.push(...Array.from(nameBytes));
      
      // Layer flags (visible, opacity, etc.)
      let flags = 0;
      if (layer.visible) flags |= 1;
      if (layer.locked) flags |= 2;
      data.push(flags);
      data.push(Math.floor(layer.opacity * 255));

      // Cell count
      const cellCount = layer.cells.size;
      data.push((cellCount >> 8) & 0xFF);
      data.push(cellCount & 0xFF);

      // Cells
      layer.cells.forEach(cell => {
        // q coordinate (2 bytes)
        data.push((cell.q >> 8) & 0xFF);
        data.push(cell.q & 0xFF);
        
        // r coordinate (2 bytes)
        data.push((cell.r >> 8) & 0xFF);
        data.push(cell.r & 0xFF);
        
        // Color as ARGB (4 bytes)
        const color = this.hexToArgb(cell.color);
        data.push((color >> 24) & 0xFF);
        data.push((color >> 16) & 0xFF);
        data.push((color >> 8) & 0xFF);
        data.push(color & 0xFF);
      });
    });

    return new Uint8Array(data).buffer;
  }

  static parseHexFile(buffer: ArrayBuffer): any {
    const data = new Uint8Array(buffer);
    const header = new TextDecoder().decode(data.slice(0, 8));
    
    if (!header.startsWith('HEXELS')) {
      throw new Error('Invalid .hex file format');
    }

    let offset = 8;
    const layerCount = data[offset++];
    const layers = [];

    for (let l = 0; l < layerCount; l++) {
      const nameLength = data[offset++];
      const name = new TextDecoder().decode(data.slice(offset, offset + nameLength));
      offset += nameLength;
      
      const flags = data[offset++];
      const opacity = data[offset++] / 255;
      
      const cellCount = (data[offset] << 8) | data[offset + 1];
      offset += 2;

      const cells = new Map();
      
      for (let c = 0; c < cellCount; c++) {
        const q = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        const r = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        
        const argb = (data[offset] << 24) | (data[offset + 1] << 16) | 
                     (data[offset + 2] << 8) | data[offset + 3];
        offset += 4;
        
        const color = this.argbToHex(argb);
        const cellId = `${q},${r}`;
        
        cells.set(cellId, {
          id: cellId,
          q, r, color,
          layerId: `layer-${l}`,
          timestamp: Date.now()
        });
      }

      layers.push({
        id: `layer-${l}`,
        name,
        visible: (flags & 1) !== 0,
        locked: (flags & 2) !== 0,
        opacity,
        cells
      });
    }

    return { layers };
  }

  private static calculateBounds(layers: Layer[]) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    layers.forEach(layer => {
      layer.cells.forEach(cell => {
        const { x, y } = this.hexGrid.axialToPixel(cell.q, cell.r);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
    });

    return { minX, maxX, minY, maxY };
  }

  private static hexToArgb(hex: string): number {
    const rgb = parseInt(hex.slice(1), 16);
    return 0xFF000000 | rgb; // Full alpha
  }

  private static argbToHex(argb: number): string {
    const rgb = argb & 0xFFFFFF;
    return '#' + rgb.toString(16).padStart(6, '0').toUpperCase();
  }
}