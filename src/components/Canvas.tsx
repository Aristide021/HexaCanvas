import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '../services/canvasStore';
import { useGridManager } from '../hooks/useHexGrid';
import { calculateViewportBounds, isCellInViewport } from '../utils/performance';
import { TriangleGrid } from '../utils/triangleGrid';

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
    globalGridType,
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

  const { gridManager, getGridForLayer } = useGridManager(gridSize, globalGridType);

  const activeLayer = layers.find(l => l.id === activeLayerId);
  const interactionGrid = activeLayer ? getGridForLayer(activeLayer.gridType) : gridManager.getGrid();

  const viewportBounds = useMemo(() => 
    calculateViewportBounds(width, height, zoom, panX, panY, gridSize),
    [width, height, zoom, panX, panY, gridSize]
  );

  const visibleCells = useMemo(() => {
    const cells: Array<{ q: number; r: number; color: string; layerId: string; gridType: string }> = [];
    layers.filter(layer => layer.visible).forEach(layer => {
      layer.cells.forEach(cell => {
        // Use a more generous viewport check for non-square grids
        if (isCellInViewport(cell.q, cell.r, viewportBounds)) {
          cells.push({ ...cell, gridType: layer.gridType });
        }
      });
    });
    return cells;
  }, [layers, viewportBounds]);
  
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoom;

    const grid = gridManager.getGrid(globalGridType);
    
    // Calculate viewport corners in world coordinates
    const halfW = width / (2 * zoom);
    const halfH = height / (2 * zoom);
    const view = {
      left: -panX / zoom - halfW,
      right: -panX / zoom + halfW,
      top: -panY / zoom - halfH,
      bottom: -panY / zoom + halfH,
    };
    
    const startCoords = grid.pixelToAxial(view.left, view.top);
    const endCoords = grid.pixelToAxial(view.right, view.bottom);

    const qMin = Math.min(startCoords.q, endCoords.q) - 2;
    const qMax = Math.max(startCoords.q, endCoords.q) + 2;
    const rMin = Math.min(startCoords.r, endCoords.r) - 2;
    const rMax = Math.max(startCoords.r, endCoords.r) + 2;
    
    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        const { x, y } = grid.axialToPixel(q, r);
        const vertices = grid.getCellVertices(x, y);
        
        if (vertices.length > 0) {
          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  }, [gridManager, globalGridType, width, height, zoom, panX, panY, gridSize]);

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, q: number, r: number, color: string, layerGridType: string) => {
    const grid = getGridForLayer(layerGridType);
    const { x, y } = grid.axialToPixel(q, r);
    const vertices = grid.getCellVertices(x, y);
    
    if (vertices.length === 0) return;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoom;
    ctx.stroke();
  }, [getGridForLayer, zoom]);

  const drawHoverPreview = useCallback((ctx: CanvasRenderingContext2D, q: number, r: number) => {
    const { x, y } = interactionGrid.axialToPixel(q, r);
    const vertices = interactionGrid.getCellVertices(x, y);
    if (vertices.length === 0) return;

    if (activeTool === 'brush') {
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
      ctx.closePath();
      ctx.fill();
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTool === 'fill') {
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.5;
    }

    ctx.strokeStyle = activeTool === 'picker' ? '#10B981' : activeTool === 'fill' ? '#F59E0B' : '#3B82F6';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
    ctx.stroke();
  }, [interactionGrid, zoom, activeTool, selectedColor]);

  const drawUserCursor = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = `${12 / zoom}px Arial`;
    ctx.fillText(name, x + 8 / zoom, y - 8 / zoom);
  }, [zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);

    if (showGrid) drawGrid(ctx);

    visibleCells.forEach(cell => {
      const layer = layers.find(l => l.id === cell.layerId);
      if (layer) {
        ctx.globalAlpha = layer.opacity;
        drawCell(ctx, cell.q, cell.r, cell.color, layer.gridType);
      }
    });

    if (hoverCell && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'picker' || activeTool === 'fill')) {
      ctx.globalAlpha = 0.5;
      drawHoverPreview(ctx, hoverCell.q, hoverCell.r);
    }

    ctx.globalAlpha = 1;
    users.forEach(user => {
      if (user.cursor && user.id !== currentUser.id) {
        drawUserCursor(ctx, user.cursor.x, user.cursor.y, user.color, user.name);
      }
    });

    ctx.restore();
  }, [width, height, layers, zoom, panX, panY, showGrid, users, currentUser, visibleCells, hoverCell, activeTool, selectedColor, drawGrid, drawCell, drawHoverPreview, drawUserCursor]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - width / 2 - panX) / zoom;
    const y = (e.clientY - rect.top - height / 2 - panY) / zoom;
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
      const axial = interactionGrid.pixelToAxial(x, y);
      if (activeTool === 'picker') { pickColor(axial.q, axial.r); return; }
      if (activeTool === 'fill') { fillArea(axial.q, axial.r, selectedColor); return; }
      if (activeTool === 'brush' || activeTool === 'eraser') {
        startPainting();
        if (activeTool === 'brush') paintCell(axial.q, axial.r, selectedColor);
        else if (activeTool === 'eraser') eraseCell(axial.q, axial.r);
      }
    }
  }, [getMousePos, interactionGrid, activeTool, selectedColor, paintCell, eraseCell, fillArea, pickColor, startPainting, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const axial = interactionGrid.pixelToAxial(x, y);
    if (!hoverCell || hoverCell.q !== axial.q || hoverCell.r !== axial.r) setHoverCell({ q: axial.q, r: axial.r });
    if (isDragging) {
      setPan(e.clientX - panOffset.current.x, e.clientY - panOffset.current.y);
      return;
    }
    if (isPainting && (activeTool === 'brush' || activeTool === 'eraser')) {
      if (activeTool === 'brush') paintCell(axial.q, axial.r, selectedColor);
      else if (activeTool === 'eraser') eraseCell(axial.q, axial.r);
    }
  }, [isDragging, isPainting, setPan, getMousePos, interactionGrid, activeTool, selectedColor, paintCell, eraseCell, hoverCell]);

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
    setZoom(Math.max(0.1, Math.min(5, zoom * zoomFactor)));
  }, [zoom, setZoom]);

  useEffect(() => {
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); document.body.style.cursor = 'grab'; } };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') { document.body.style.cursor = 'default'; } };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getCursorStyle = () => {
    switch (activeTool) {
      case 'move': return isDragging ? 'grabbing' : 'grab';
      default: return 'crosshair';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 rounded-lg shadow-inner"
      style={{ touchAction: 'none', cursor: getCursorStyle() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
};