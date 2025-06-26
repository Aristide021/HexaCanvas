import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../services/canvasStore';
import { HexGrid } from '../utils/hexGrid';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hexGrid] = useState(() => new HexGrid(20));
  const [isDragging, setIsDragging] = useState(false);
  const panOffset = useRef({ x: 0, y: 0 });

  const {
    layers,
    activeLayerId,
    zoom,
    panX,
    panY,
    showGrid,
    selectedColor,
    activeTool,
    paintCell,
    eraseCell,
    setPan,
    setZoom,
    users,
    currentUser
  } = useCanvasStore();

  // FIX #1: Complete dependency array for draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);

    // Draw grid if enabled
    if (showGrid) {
      drawHexGrid(ctx);
    }

    // Draw layers
    layers.filter(layer => layer.visible).forEach(layer => {
      ctx.globalAlpha = layer.opacity;
      layer.cells.forEach(cell => {
        drawHexCell(ctx, cell.q, cell.r, cell.color);
      });
    });

    // Draw user cursors
    ctx.globalAlpha = 1;
    users.forEach(user => {
      if (user.cursor && user.id !== currentUser.id) {
        drawUserCursor(ctx, user.cursor.x, user.cursor.y, user.color, user.name);
      }
    });

    ctx.restore();
  }, [
    // FIX #1: Include ALL dependencies that draw function uses
    width, height, layers, zoom, panX, panY, showGrid, 
    users, currentUser, hexGrid
  ]);

  const drawHexGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = hexGrid.getSize();
    // Calculate visible area based on current zoom and pan
    const visibleRadius = Math.ceil(Math.max(width, height) / (zoom * gridSize * 2)) + 2;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoom;

    // Draw grid centered around origin (0,0)
    for (let q = -visibleRadius; q <= visibleRadius; q++) {
      for (let r = Math.max(-visibleRadius, -q - visibleRadius); 
           r <= Math.min(visibleRadius, -q + visibleRadius); r++) {
        const { x, y } = hexGrid.axialToPixel(q, r);
        const vertices = hexGrid.getHexVertices(x, y);
        
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  const drawHexCell = (ctx: CanvasRenderingContext2D, q: number, r: number, color: string) => {
    const { x, y } = hexGrid.axialToPixel(q, r);
    const vertices = hexGrid.getHexVertices(x, y);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    ctx.fill();

    // Add subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoom;
    ctx.stroke();
  };

  const drawUserCursor = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5 / zoom, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = `${12 / zoom}px Arial`;
    ctx.fillText(name, x + 8 / zoom, y - 8 / zoom);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - width / 2 - panX) / zoom);
    const y = ((e.clientY - rect.top - height / 2 - panY) / zoom);
    
    return { x, y };
  };

  // FIX #2: Improved panning with useRef to avoid stale state
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+click for panning
      setIsDragging(true);
      panOffset.current = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }

    if (e.button === 0) {
      const { x, y } = getMousePos(e);
      const axial = hexGrid.pixelToAxial(x, y);
      
      if (activeTool === 'brush') {
        paintCell(axial.q, axial.r, selectedColor);
      } else if (activeTool === 'eraser') {
        eraseCell(axial.q, axial.r);
      }
    }
  };

  // FIX #2: Fixed panning logic using panOffset ref
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const newPanX = e.clientX - panOffset.current.x;
      const newPanY = e.clientY - panOffset.current.y;
      setPan(newPanX, newPanY);
      return;
    }

    // Update cursor position for collaboration
    const { x, y } = getMousePos(e);
    // In a real app, this would broadcast cursor position to other users
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * zoomFactor);
  };

  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // This effect will now properly re-run when draw dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    />
  );
};