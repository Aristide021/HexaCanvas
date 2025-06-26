import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '../services/canvasStore';
import { useHexGrid } from '../hooks/useHexGrid';
import { throttle } from '../utils/performance';
import { calculateViewportBounds, isCellInViewport } from '../utils/performance';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { grid } = useHexGrid(20);
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

  // Calculate viewport bounds for performance optimization
  const viewportBounds = useMemo(() => 
    calculateViewportBounds(width, height, zoom, panX, panY, grid.getSize()),
    [width, height, zoom, panX, panY, grid]
  );

  // Filter visible cells for performance
  const visibleCells = useMemo(() => {
    const cells: Array<{ q: number; r: number; color: string; layerId: string }> = [];
    layers.filter(layer => layer.visible).forEach(layer => {
      layer.cells.forEach(cell => {
        if (isCellInViewport(cell.q, cell.r, viewportBounds)) {
          cells.push(cell);
        }
      });
    });
    return cells;
  }, [layers, viewportBounds]);

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

    // Draw visible cells only (performance optimization)
    visibleCells.forEach(cell => {
      const layer = layers.find(l => l.id === cell.layerId);
      if (layer) {
        ctx.globalAlpha = layer.opacity;
        drawHexCell(ctx, cell.q, cell.r, cell.color);
      }
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
    width, height, layers, zoom, panX, panY, showGrid, 
    users, currentUser, grid, visibleCells
  ]);

  const drawHexGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = grid.getSize();
    const visibleRadius = Math.ceil(Math.max(width, height) / (zoom * gridSize * 2)) + 2;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoom;

    for (let q = -visibleRadius; q <= visibleRadius; q++) {
      for (let r = Math.max(-visibleRadius, -q - visibleRadius); 
           r <= Math.min(visibleRadius, -q + visibleRadius); r++) {
        const { x, y } = grid.axialToPixel(q, r);
        const vertices = grid.getHexVertices(x, y);
        
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        
        ctx.closePath();
        ctx.stroke();
      }
    }
  }, [grid, width, height, zoom]);

  const drawHexCell = useCallback((ctx: CanvasRenderingContext2D, q: number, r: number, color: string) => {
    const { x, y } = grid.axialToPixel(q, r);
    const vertices = grid.getHexVertices(x, y);
    
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
  }, [grid, zoom]);

  const drawUserCursor = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5 / zoom, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = `${12 / zoom}px Arial`;
    ctx.fillText(name, x + 8 / zoom, y - 8 / zoom);
  }, [zoom]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - width / 2 - panX) / zoom);
    const y = ((e.clientY - rect.top - height / 2 - panY) / zoom);
    
    return { x, y };
  }, [width, height, panX, panY, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      panOffset.current = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }

    if (e.button === 0) {
      const { x, y } = getMousePos(e);
      const axial = grid.pixelToAxial(x, y);
      
      if (activeTool === 'brush') {
        paintCell(axial.q, axial.r, selectedColor);
      } else if (activeTool === 'eraser') {
        eraseCell(axial.q, axial.r);
      }
    }
  }, [getMousePos, grid, activeTool, selectedColor, paintCell, eraseCell, panX, panY]);

  // Throttled mouse move for performance
  const handleMouseMove = useMemo(() => throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const newPanX = e.clientX - panOffset.current.x;
      const newPanY = e.clientY - panOffset.current.y;
      setPan(newPanX, newPanY);
      return;
    }

    // Update cursor position for collaboration
    const { x, y } = getMousePos(e);
    // In a real app, this would broadcast cursor position to other users
  }, 16), [isDragging, setPan, getMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    setZoom(newZoom);
  }, [zoom, setZoom]);

  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

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
      className="border border-gray-300 cursor-crosshair rounded-lg shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    />
  );
};