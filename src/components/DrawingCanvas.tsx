import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Path, Line, Polygon, IText } from "fabric";
import { toast } from "sonner";

interface DrawingCanvasProps {
  width: number;
  height: number;
  activeTool: "select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text";
  activeColor: string;
  brushSize: number;
  onAnnotationChange?: (annotations: any) => void;
  className?: string;
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
  className
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

    // Handle shape creation
    if (activeTool === "rectangle") {
      const rect = new Rect({
        left: 50,
        top: 50,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        width: 100,
        height: 60,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      saveToHistory();
    } else if (activeTool === "circle") {
      const circle = new Circle({
        left: 50,
        top: 50,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        radius: 50,
        cornerStyle: "circle",
        cornerColor: activeColor,
        cornerSize: 8,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      saveToHistory();
    } else if (activeTool === "line") {
      const line = new Line([50, 50, 150, 50], {
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
      const triangle = new Polygon([
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: 200, y: 100 }
      ], {
        left: 50,
        top: 50,
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
      const text = new IText("Click to edit", {
        left: 50,
        top: 50,
        fill: activeColor,
        fontSize: Math.max(16, brushSize * 4),
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
