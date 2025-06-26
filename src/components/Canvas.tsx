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
  const [isDragging, setIsDragging] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ q: number; r: number } | null>(null);
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
    isPainting,
    gridSize,
    paintCell,
    eraseCell,
    fillArea,
    pickColor,
    startPainting,
    stopPainting,
    setPan,
    setZoom,
    users,
    currentUser
  } = useCanvasStore();

  // Create hex grid with dynamic size
  const { grid } = useHexGrid(gridSize);

  // Update grid size when it changes
  useEffect(() => {
    grid.setSize(gridSize);
  }, [grid, gridSize]);

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

    // Draw hover preview
    if (hoverCell && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'picker' || activeTool === 'fill')) {
      ctx.globalAlpha = 0.5;
      drawHoverPreview(ctx, hoverCell.q, hoverCell.r);
    }

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
    users, currentUser, grid, visibleCells, hoverCell, activeTool, selectedColor
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

  const drawHoverPreview = useCallback((ctx: CanvasRenderingContext2D, q: number, r: number) => {
    const { x, y } = grid.axialToPixel(q, r);
    const vertices = grid.getHexVertices(x, y);
    
    if (activeTool === 'brush') {
      // Show brush preview with selected color
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      
      ctx.closePath();
      ctx.fill();
    } else if (activeTool === 'eraser') {
      // Show eraser preview with red outline
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTool === 'fill') {
      // Show fill preview with pattern
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.5;
    }

    // Add outline for all tools
    ctx.strokeStyle = activeTool === 'picker' ? '#10B981' : 
                     activeTool === 'fill' ? '#F59E0B' : '#3B82F6';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    ctx.stroke();
  }, [grid, zoom, activeTool, selectedColor]);

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
      // Pan mode
      setIsDragging(true);
      panOffset.current = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }

    if (e.button === 0) {
      const { x, y } = getMousePos(e);
      const axial = grid.pixelToAxial(x, y);
      
      if (activeTool === 'picker') {
        // Color picker tool
        pickColor(axial.q, axial.r);
        return;
      }

      if (activeTool === 'fill') {
        // Fill tool
        fillArea(axial.q, axial.r, selectedColor);
        return;
      }
      
      // Start painting for brush and eraser
      if (activeTool === 'brush' || activeTool === 'eraser') {
        startPainting();
        
        if (activeTool === 'brush') {
          paintCell(axial.q, axial.r, selectedColor);
        } else if (activeTool === 'eraser') {
          eraseCell(axial.q, axial.r);
        }
      }
    }
  }, [getMousePos, grid, activeTool, selectedColor, paintCell, eraseCell, fillArea, pickColor, startPainting, panX, panY]);

  // FIXED: Reduced throttle delay for smoother brush strokes
  const handleMouseMove = useMemo(() => throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const axial = grid.pixelToAxial(x, y);
    
    // Update hover cell for preview
    setHoverCell({ q: axial.q, r: axial.r });

    if (isDragging) {
      const newPanX = e.clientX - panOffset.current.x;
      const newPanY = e.clientY - panOffset.current.y;
      setPan(newPanX, newPanY);
      return;
    }

    // FIXED: Continue painting/erasing while dragging with better responsiveness
    if (isPainting && (activeTool === 'brush' || activeTool === 'eraser')) {
      if (activeTool === 'brush') {
        paintCell(axial.q, axial.r, selectedColor);
      } else if (activeTool === 'eraser') {
        eraseCell(axial.q, axial.r);
      }
    }

    // Update cursor position for collaboration
    // In a real app, this would broadcast cursor position to other users
  }, 8), [isDragging, isPainting, setPan, getMousePos, grid, activeTool, selectedColor, paintCell, eraseCell]); // Reduced from 16ms to 8ms

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    stopPainting();
  }, [stopPainting]);

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
    setIsDragging(false);
    stopPainting();
  }, [stopPainting]);

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

  // Dynamic cursor based on active tool
  const getCursorStyle = () => {
    switch (activeTool) {
      case 'brush':
        return 'crosshair';
      case 'eraser':
        return 'crosshair';
      case 'picker':
        return 'crosshair';
      case 'fill':
        return 'crosshair';
      case 'move':
        return isDragging ? 'grabbing' : 'grab';
      default:
        return 'crosshair';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 rounded-lg shadow-inner"
      style={{ 
        touchAction: 'none',
        cursor: getCursorStyle()
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
};