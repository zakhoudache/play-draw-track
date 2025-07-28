import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Path } from "fabric";
import { toast } from "sonner";

interface DrawingCanvasProps {
  width: number;
  height: number;
  activeTool: "select" | "draw" | "rectangle" | "circle";
  activeColor: string;
  brushSize: number;
  onAnnotationChange?: (annotations: any) => void;
  className?: string;
}

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  deleteSelected: () => void;
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
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasChange = () => {
      const annotations = fabricCanvas.toJSON();
      onAnnotationChange?.(annotations);
    };

    fabricCanvas.on("object:added", handleCanvasChange);
    fabricCanvas.on("object:modified", handleCanvasChange);
    fabricCanvas.on("object:removed", handleCanvasChange);
    fabricCanvas.on("path:created", handleCanvasChange);

    return () => {
      fabricCanvas.off("object:added", handleCanvasChange);
      fabricCanvas.off("object:modified", handleCanvasChange);
      fabricCanvas.off("object:removed", handleCanvasChange);
      fabricCanvas.off("path:created", handleCanvasChange);
    };
  }, [fabricCanvas, onAnnotationChange]);

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
      toast(`Deleted ${activeObjects.length} object(s)`);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    clearCanvas,
    deleteSelected,
  }), [fabricCanvas]);

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