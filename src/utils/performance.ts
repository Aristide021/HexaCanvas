// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Debounce function for input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Check if a cell is within the viewport bounds
export const isCellInViewport = (
  cellQ: number,
  cellR: number,
  viewportBounds: {
    minQ: number;
    maxQ: number;
    minR: number;
    maxR: number;
  }
): boolean => {
  return (
    cellQ >= viewportBounds.minQ &&
    cellQ <= viewportBounds.maxQ &&
    cellR >= viewportBounds.minR &&
    cellR <= viewportBounds.maxR
  );
};

// Calculate viewport bounds based on canvas size, zoom, and pan
export const calculateViewportBounds = (
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  gridSize: number
) => {
  const halfWidth = canvasWidth / (2 * zoom);
  const halfHeight = canvasHeight / (2 * zoom);
  
  // Convert screen bounds to hex coordinates
  const centerQ = -panX / (gridSize * 1.5 * zoom);
  const centerR = (-panY + panX * Math.sqrt(3) / 3) / (gridSize * Math.sqrt(3) * zoom);
  
  const radiusQ = halfWidth / (gridSize * 1.5);
  const radiusR = halfHeight / (gridSize * Math.sqrt(3));
  
  return {
    minQ: Math.floor(centerQ - radiusQ) - 1,
    maxQ: Math.ceil(centerQ + radiusQ) + 1,
    minR: Math.floor(centerR - radiusR) - 1,
    maxR: Math.ceil(centerR + radiusR) + 1
  };
};