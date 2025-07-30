import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Polygon, IText, Ellipse, Object as FabricObject } from "fabric";
import { toast } from "sonner";
import { computeHomography, screenToField, fieldToScreen, Point2D } from "@/lib/homography";
import { SOCCER_FIELD_KEYPOINTS, getSoccerFieldMarkings } from "@/lib/soccerField";
import { PlayerTracking } from "./PlayerTracking";

type ToolType = "select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text" | "ellipse";

interface DrawingCanvasProps {
  width: number;
  height: number;
  activeTool: ToolType;
  activeColor: string;
  brushSize: number;
  currentTime?: number;
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

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, activeTool, activeColor, brushSize, currentTime = 0, onAnnotationChange, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [homography, setHomography] = useState<number[] | null>(null);

    // Auto-calibrate on mount: assume fixed screen corners
    useEffect(() => {
      if (!width || !height) return;

      // Simulate detected screen points (in practice: use AI or config)
      const screenCorners: Point2D[] = [
        { x: width * 0.2, y: height * 0.2 },   // TL
        { x: width * 0.8, y: height * 0.2 },   // TR
        { x: width * 0.75, y: height * 0.8 },  // BR
        { x: width * 0.25, y: height * 0.8 },  // BL
      ];

      const H = computeHomography(screenCorners, SOCCER_FIELD_KEYPOINTS);
      if (H) {
        setHomography(H);
        renderFieldOverlay(H);
      } else {
        toast.error("Auto-calibration failed");
      }
    }, [width, height]);

    const renderFieldOverlay = (H: number[]) => {
      if (!fabricCanvas) return;
      fabricCanvas.remove(...fabricCanvas.getObjects().filter(o => (o as any).data?.type === "field"));

      getSoccerFieldMarkings().forEach(mark => {
        let obj: FabricObject | null = null;
        if (mark.x1 !== undefined) {
          const p1 = fieldToScreen({ x: mark.x1, y: mark.y1! }, H)!;
          const p2 = fieldToScreen({ x: mark.x2!, y: mark.y2! }, H)!;
          obj = new Line([p1.x, p1.y, p2.x, p2.y], {
            stroke: "rgba(255,255,255,0.7)",
            strokeWidth: 2,
            selectable: false,
            evented: false,
            data: { type: "field" } as any
          });
        } else if (mark.cx !== undefined) {
          const center = fieldToScreen({ x: mark.cx, y: mark.cy! }, H)!;
          const radiusPoint = fieldToScreen({ x: mark.cx + mark.r!, y: mark.cy! }, H)!;
          const radius = Math.sqrt((radiusPoint.x - center.x)**2 + (radiusPoint.y - center.y)**2);
          obj = new Circle({
            left: center.x - radius,
            top: center.y - radius,
            radius,
            fill: "transparent",
            stroke: "rgba(255,255,255,0.7)",
            strokeWidth: 2,
            selectable: false,
            evented: false,
            data: { type: "field" } as any
          });
        }
        if (obj) fabricCanvas.add(obj);
      });
      fabricCanvas.renderAll();
    };

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "transparent",
        selection: activeTool === "select",
      });
      setFabricCanvas(canvas);
      return () => {
        canvas.dispose();
      };
    }, [width, height]);

    // Update canvas mode
    useEffect(() => {
      if (!fabricCanvas) return;
      fabricCanvas.isDrawingMode = activeTool === "draw";
      fabricCanvas.selection = activeTool === "select";
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      }
    }, [activeTool, activeColor, brushSize, fabricCanvas]);

    // Handle canvas clicks for shape creation
    useEffect(() => {
      if (!fabricCanvas || !homography) return;

      const handleCanvasClick = (e: any) => {
        if (!["rectangle", "circle", "line", "triangle", "text", "ellipse"].includes(activeTool)) return;
        
        const pointer = fabricCanvas.getPointer(e.e);
        let obj: FabricObject;

        if (activeTool === "ellipse") {
          // Create player spotlight at click position
          const fieldPos = screenToField(pointer, homography) || { x: 52.5, y: 34 };
          const screenPos = fieldToScreen(fieldPos, homography) || pointer;

          obj = new Ellipse({
            left: screenPos.x - 40,
            top: screenPos.y - 60,
            rx: 40,
            ry: 60,
            fill: "transparent",
            stroke: activeColor,
            strokeWidth: brushSize,
            cornerStyle: "circle",
            cornerColor: activeColor,
            cornerSize: 8,
            hasRotatingPoint: false,
            data: { type: "player", fieldX: fieldPos.x, fieldY: fieldPos.y } as any
          });

          const text = new IText("10", {
            left: screenPos.x - 10,
            top: screenPos.y - 20,
            fill: "white",
            fontSize: 16,
            fontWeight: "bold",
            selectable: false
          });
          fabricCanvas.add(obj, text);
        } else if (activeTool === "rectangle") {
          obj = new Rect({
            left: pointer.x - 50, top: pointer.y - 30,
            width: 100, height: 60,
            fill: "transparent", stroke: activeColor, strokeWidth: brushSize,
            cornerStyle: "circle", cornerColor: activeColor, cornerSize: 8
          });
          fabricCanvas.add(obj);
        }

        if (obj) {
          fabricCanvas.setActiveObject(obj);
          saveToHistory();
        }
      };

      fabricCanvas.on('mouse:down', handleCanvasClick);
      
      return () => {
        fabricCanvas.off('mouse:down', handleCanvasClick);
      };
    }, [activeTool, activeColor, brushSize, homography, fabricCanvas]);

    const saveToHistory = () => {
      if (!fabricCanvas) return;
      const state = JSON.stringify(fabricCanvas.toJSON());
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(state);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    };

    useEffect(() => {
      if (!fabricCanvas) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          // Simulate ellipse tool activation
          const temp = activeTool;
          // You'd need to control activeTool via parent state
          console.log("Pressing E → add player");
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          deleteSelected();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTool]);

    // Public methods
    const clearCanvas = () => {
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      if (homography) renderFieldOverlay(homography);
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
        if (homography) renderFieldOverlay(homography);
        toast("Undone");
      });
    };

    const redo = () => {
      if (!fabricCanvas || historyIndex >= history.length - 1) return;
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      fabricCanvas.loadFromJSON(nextState, () => {
        fabricCanvas.renderAll();
        if (homography) renderFieldOverlay(homography);
        toast("Redone");
      });
    };

    const saveAnnotations = () => {
      if (!fabricCanvas) return "";
      const data = {
        ...fabricCanvas.toJSON(),
        homography,
        field: "soccer_105x68"
      };
      const json = JSON.stringify(data, null, 2);
      toast("Annotations saved with real-world coordinates");
      return json;
    };

    const exportAsImage = () => {
      if (!fabricCanvas) return;
      const dataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `soccer-tactical-${Date.now()}.png`;
      a.click();
      toast("Exported tactical image");
    };

    useImperativeHandle(ref, () => ({
      clearCanvas,
      deleteSelected,
      undo,
      redo,
      saveAnnotations,
      exportAsImage,
    }), [fabricCanvas, historyIndex, homography]);

    return (
      <>
        <canvas
          ref={canvasRef}
          className={className}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "auto",
            zIndex: 10,
            border: homography ? "2px solid #10B981" : "2px dashed #F59E0B"
          }}
        />
        
        {/* Player Tracking Overlay */}
        <PlayerTracking
          fabricCanvas={fabricCanvas}
          currentTime={currentTime}
          homography={homography}
          fieldToScreen={fieldToScreen}
        />
      </>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
