import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Line, FabricObject, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Square, Triangle } from "lucide-react";

interface FormationDrawingProps {
  fabricCanvas: FabricCanvas | null;
  currentTime: number;
  onFormationChange?: (formations: Formation[]) => void;
}

interface Formation {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  type: "line" | "area" | "triangle";
  timestamp: number;
}

export const FormationDrawing: React.FC<FormationDrawingProps> = ({
  fabricCanvas,
  currentTime,
  onFormationChange
}) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentFormation, setCurrentFormation] = useState<{ x: number; y: number }[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [activeColor, setActiveColor] = useState("#FF6B35");
  const [drawingType, setDrawingType] = useState<"line" | "area" | "triangle">("line");

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (!isDrawingMode) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      const newPoint = { x: pointer.x, y: pointer.y };
      
      setCurrentFormation(prev => {
        const updated = [...prev, newPoint];
        
        // Auto-complete formation based on type
        if ((drawingType === "triangle" && updated.length === 3) ||
            (drawingType === "area" && updated.length >= 4)) {
          completeFormation(updated);
          return [];
        }
        
        return updated;
      });
    };

    const handleDoubleClick = () => {
      if (isDrawingMode && currentFormation.length >= 2) {
        completeFormation(currentFormation);
        setCurrentFormation([]);
      }
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);
    fabricCanvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
      fabricCanvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [fabricCanvas, isDrawingMode, currentFormation, drawingType, activeColor]);

  const completeFormation = (points: { x: number; y: number }[]) => {
    if (!fabricCanvas || points.length < 2) return;

    const formation: Formation = {
      id: `formation-${Date.now()}`,
      points,
      color: activeColor,
      type: drawingType,
      timestamp: currentTime
    };

    // Draw formation on canvas
    drawFormation(formation);
    
    // Update formations list
    setFormations(prev => {
      const updated = [...prev, formation];
      onFormationChange?.(updated);
      return updated;
    });
  };

  const drawFormation = (formation: Formation) => {
    if (!fabricCanvas) return;

    // Remove existing formation preview
    removeFormationPreview();

    const { points, color, type } = formation;
    
    if (type === "line" || type === "triangle") {
      // Draw lines connecting points
      for (let i = 0; i < points.length; i++) {
        const start = points[i];
        const end = points[(i + 1) % points.length];
        
        // For line type, don't connect back to start unless it's a triangle
        if (type === "line" && i === points.length - 1) break;
        
        const line = new Line([start.x, start.y, end.x, end.y], {
          stroke: color,
          strokeWidth: 3,
          strokeDashArray: type === "triangle" ? [] : [8, 4],
          selectable: false,
          evented: false,
          shadow: new Shadow({
            color: color,
            blur: 8,
            offsetX: 0,
            offsetY: 0,
            affectStroke: false,
            includeDefaultValues: true,
            nonScaling: false
          }),
          data: { 
            type: "formation", 
            formationId: formation.id,
            timestamp: formation.timestamp 
          } as any
        });
        
        fabricCanvas.add(line);
      }
    }

    // Add point markers
    points.forEach((point, index) => {
      const marker = new FabricObject({
        left: point.x - 4,
        top: point.y - 4,
        width: 8,
        height: 8,
        fill: color,
        stroke: "white",
        strokeWidth: 2,
        selectable: false,
        evented: false,
        data: { 
          type: "formation-marker", 
          formationId: formation.id,
          pointIndex: index 
        } as any
      });
      
      fabricCanvas.add(marker);
    });

    fabricCanvas.renderAll();
  };

  const removeFormationPreview = () => {
    if (!fabricCanvas) return;
    
    const previewObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type === "formation-preview"
    );
    previewObjects.forEach(obj => fabricCanvas.remove(obj));
  };

  const clearAllFormations = () => {
    if (!fabricCanvas) return;
    
    const formationObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type?.startsWith("formation")
    );
    formationObjects.forEach(obj => fabricCanvas.remove(obj));
    
    setFormations([]);
    setCurrentFormation([]);
    onFormationChange?.([]);
    fabricCanvas.renderAll();
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (isDrawingMode) {
      // Finish current formation if any
      if (currentFormation.length >= 2) {
        completeFormation(currentFormation);
      }
      setCurrentFormation([]);
    }
  };

  const colors = [
    "#FF6B35", "#F7931E", "#FFD23F", "#06FFA5", 
    "#118AB2", "#073B4C", "#EF476F", "#8338EC"
  ];

  return (
    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 space-y-3 shadow-lg border">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">Formation Drawing</span>
      </div>
      
      {/* Drawing Type Selection */}
      <div className="flex gap-1">
        <Button
          variant={drawingType === "line" ? "default" : "outline"}
          size="sm"
          onClick={() => setDrawingType("line")}
          className="p-2"
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant={drawingType === "triangle" ? "default" : "outline"}
          size="sm"
          onClick={() => setDrawingType("triangle")}
          className="p-2"
        >
          <Triangle className="h-3 w-3" />
        </Button>
      </div>

      {/* Color Selection */}
      <div className="grid grid-cols-4 gap-1">
        {colors.map(color => (
          <button
            key={color}
            className={`w-6 h-6 rounded border-2 ${
              activeColor === color ? "border-white shadow-lg" : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setActiveColor(color)}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <Button
          variant={isDrawingMode ? "destructive" : "default"}
          size="sm"
          onClick={toggleDrawingMode}
          className="w-full"
        >
          {isDrawingMode ? "Stop Drawing" : "Start Drawing"}
        </Button>
        
        {formations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFormations}
            className="w-full"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status */}
      {isDrawingMode && (
        <Badge variant="secondary" className="text-xs">
          {currentFormation.length > 0 
            ? `${currentFormation.length} points | ${drawingType === "line" ? "Double-click to finish" : `${drawingType === "triangle" ? 3 - currentFormation.length : 4 - currentFormation.length} more needed`}`
            : "Click to add points"
          }
        </Badge>
      )}

      {formations.length > 0 && (
        <Badge variant="outline" className="text-xs">
          {formations.length} formation{formations.length !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
};