import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Path, Line, Polygon, IText } from "fabric";
import { toast } from "sonner";
import { Homography, type Point } from "@/lib/homography";

interface DrawingCanvasProps {
  width: number;
  height: number;
  activeTool: "select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text";
  activeColor: string;
  brushSize: number;
  onAnnotationChange?: (annotations: any) => void;
  className?: string;
  homography?: number[] | null;
  inverseHomography?: number[] | null;
}

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  saveAnnotations: () => string;
  exportAsImage: () => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  width,
  height,
  activeTool,
  activeColor,
  brushSize,
  onAnnotationChange,
  className,
  homography,
  inverseHomography
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "transparent",
      selection: activeTool === "select",
      enableRetinaScaling: false, // Important for coordinate consistency
    });

    // Configure free drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Update canvas interaction mode
    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";

    // Update brush properties
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }

    // Handle shape creation with field-aware sizing if homography is available
    const getFieldAwareSize = (pixelSize: number) => {
      if (!homography) return pixelSize;
      // Transform a reference distance to get field-aware scaling
      const p1 = { x: width / 2, y: height / 2 };
      const p2 = { x: width / 2 + pixelSize, y: height / 2 };
      const realP1 = Homography.transform(p1, homography);
      const realP2 = Homography.transform(p2, homography);
      const realDistance = Math.hypot(realP2.x - realP1.x, realP2.y - realP1.y);
      // Keep size reasonable (1-5 meters on field)
      return Math.max(20, Math.min(100, pixelSize * (3 / Math.max(0.1, realDistance))));
    };

    if (activeTool === "rectangle") {
      const size = getFieldAwareSize(80);
      const rect = new Rect({
        left: width / 2 - size / 2,
        top: height / 2 - size / 2,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        width: size,
        height: size * 0.6,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      saveToHistory();
    } else if (activeTool === "circle") {
      const radius = getFieldAwareSize(50);
      const circle = new Circle({
        left: width / 2 - radius,
        top: height / 2 - radius,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        radius: radius,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      saveToHistory();
    } else if (activeTool === "line") {
      const lineLength = getFieldAwareSize(100);
      const startX = width / 2 - lineLength / 2;
      const endX = width / 2 + lineLength / 2;
      const centerY = height / 2;
      const line = new Line([startX, centerY, endX, centerY], {
        stroke: activeColor,
        strokeWidth: brushSize,
        selectable: true,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(line);
      fabricCanvas.setActiveObject(line);
      saveToHistory();
    } else if (activeTool === "triangle") {
      const size = getFieldAwareSize(80);
      const triangle = new Polygon([
        { x: size / 2, y: 0 },
        { x: 0, y: size },
        { x: size, y: size }
      ], {
        left: width / 2 - size / 2,
        top: height / 2 - size / 2,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(triangle);
      fabricCanvas.setActiveObject(triangle);
      saveToHistory();
    } else if (activeTool === "text") {
      const fontSize = homography ? Math.max(12, getFieldAwareSize(20)) : Math.max(16, brushSize * 4);
      const text = new IText("Click to edit", {
        left: width / 2 - 50,
        top: height / 2 - fontSize / 2,
        fill: activeColor,
        fontSize: fontSize,
        fontFamily: "Arial",
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      saveToHistory();
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const saveToHistory = () => {
    if (!fabricCanvas) return;
    const canvasState = JSON.stringify(fabricCanvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasChange = () => {
      const annotations = fabricCanvas.toJSON();
      onAnnotationChange?.(annotations);
    };

    const handleObjectModified = () => {
      saveToHistory();
    };

    const handlePathCreated = () => {
      saveToHistory();
    };

    fabricCanvas.on("object:added", handleCanvasChange);
    fabricCanvas.on("object:modified", handleObjectModified);
    fabricCanvas.on("object:removed", handleCanvasChange);
    fabricCanvas.on("path:created", handlePathCreated);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveAnnotations();
            break;
          case 'e':
            e.preventDefault();
            exportAsImage();
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'delete':
          case 'backspace':
            deleteSelected();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.off("object:added", handleCanvasChange);
      fabricCanvas.off("object:modified", handleObjectModified);
      fabricCanvas.off("object:removed", handleCanvasChange);
      fabricCanvas.off("path:created", handlePathCreated);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricCanvas, onAnnotationChange, history, historyIndex]);

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    toast("Canvas cleared");
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      fabricCanvas.remove(...activeObjects);
      fabricCanvas.discardActiveObject();
      saveToHistory();
      toast(`Deleted ${activeObjects.length} object(s)`);
    }
  };

  const undo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    const prevState = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    fabricCanvas.loadFromJSON(prevState, () => {
      fabricCanvas.renderAll();
      toast("Undone");
    });
  };

  const redo = () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    const nextState = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    fabricCanvas.loadFromJSON(nextState, () => {
      fabricCanvas.renderAll();
      toast("Redone");
    });
  };

  const saveAnnotations = () => {
  if (!fabricCanvas) return "";
  const json = JSON.stringify(fabricCanvas.toJSON());
  toast("Annotations saved");
  return json; // Just return — don't download
};

  const exportAsImage = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `canvas-export-${Date.now()}.png`;
    a.click();
    toast("Canvas exported as image");
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    clearCanvas,
    deleteSelected,
    undo,
    redo,
    saveAnnotations,
    exportAsImage,
  }), [fabricCanvas, history, historyIndex]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "auto",
        zIndex: 10,
      }}
    />
  );
});
