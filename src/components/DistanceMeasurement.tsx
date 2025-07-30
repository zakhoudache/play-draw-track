import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Line, IText, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, Eye, EyeOff } from "lucide-react";
import { Point, Homography } from "@/lib/homography";

interface DistanceMeasurementProps {
  fabricCanvas: FabricCanvas | null;
  homography: number[] | null;
  currentTime: number;
  screenToField: (point: Point, homography: number[]) => Point | null;
}

interface DistanceLine {
  id: string;
  start: Point;
  end: Point;
  screenStart: Point;
  screenEnd: Point;
  distance: number; // in meters
  timestamp: number;
}

export const DistanceMeasurement: React.FC<DistanceMeasurementProps> = ({
  fabricCanvas,
  homography,
  currentTime,
  screenToField
}) => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [distances, setDistances] = useState<DistanceLine[]>([]);
  const [showDistances, setShowDistances] = useState(true);
  const [currentMeasurement, setCurrentMeasurement] = useState<{
    start: Point;
    current: Point;
  } | null>(null);

  useEffect(() => {
    if (!fabricCanvas || !homography) return;

    const handleMouseDown = (e: any) => {
      if (!isMeasuring) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      setCurrentMeasurement({
        start: pointer,
        current: pointer
      });
    };

    const handleMouseMove = (e: any) => {
      if (!isMeasuring || !currentMeasurement) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      setCurrentMeasurement(prev => prev ? {
        ...prev,
        current: pointer
      } : null);
      
      // Draw preview line
      drawPreviewLine(currentMeasurement.start, pointer);
    };

    const handleMouseUp = (e: any) => {
      if (!isMeasuring || !currentMeasurement || !homography) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      const startField = screenToField(currentMeasurement.start, homography);
      const endField = screenToField(pointer, homography);
      
      if (startField && endField) {
        const distance = calculateDistance(startField, endField);
        
        const distanceLine: DistanceLine = {
          id: `distance-${Date.now()}`,
          start: startField,
          end: endField,
          screenStart: currentMeasurement.start,
          screenEnd: pointer,
          distance,
          timestamp: currentTime
        };
        
        addDistanceMeasurement(distanceLine);
      }
      
      setCurrentMeasurement(null);
      removePreviewLine();
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, isMeasuring, currentMeasurement, homography]);

  // Update distance lines when showDistances changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    updateDistanceDisplay();
  }, [showDistances, distances, fabricCanvas]);

  const calculateDistance = (point1: Point, point2: Point): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const addDistanceMeasurement = (distanceLine: DistanceLine) => {
    setDistances(prev => [...prev, distanceLine]);
    
    if (showDistances) {
      drawDistanceLine(distanceLine);
    }
  };

  const drawPreviewLine = (start: Point, end: Point) => {
    if (!fabricCanvas) return;
    
    removePreviewLine();
    
    const line = new Line([start.x, start.y, end.x, end.y], {
      stroke: "#FFD700",
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      opacity: 0.8,
      data: { type: "distance-preview" } as any
    });
    
    fabricCanvas.add(line);
    fabricCanvas.renderAll();
  };

  const removePreviewLine = () => {
    if (!fabricCanvas) return;
    
    const previewObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type === "distance-preview"
    );
    previewObjects.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
  };

  const drawDistanceLine = (distanceLine: DistanceLine) => {
    if (!fabricCanvas) return;

    const { screenStart, screenEnd, distance } = distanceLine;
    
    // Draw measurement line
    const line = new Line([screenStart.x, screenStart.y, screenEnd.x, screenEnd.y], {
      stroke: "#00FF7F",
      strokeWidth: 2,
      strokeDashArray: [6, 3],
      selectable: false,
      evented: false,
      shadow: new Shadow({
        color: "#00FF7F",
        blur: 8,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        includeDefaultValues: true,
        nonScaling: false
      }),
      data: { 
        type: "distance-line", 
        distanceId: distanceLine.id 
      } as any
    });
    
    fabricCanvas.add(line);

    // Draw distance label
    const midX = (screenStart.x + screenEnd.x) / 2;
    const midY = (screenStart.y + screenEnd.y) / 2;
    
    const label = new IText(`${distance.toFixed(1)}m`, {
      left: midX - 20,
      top: midY - 10,
      fill: "white",
      fontSize: 14,
      fontWeight: "bold",
      fontFamily: "Arial",
      textAlign: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: 4,
      selectable: false,
      evented: false,
      shadow: new Shadow({
        color: "#00FF7F",
        blur: 4,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        includeDefaultValues: true,
        nonScaling: false
      }),
      data: { 
        type: "distance-label", 
        distanceId: distanceLine.id 
      } as any
    });
    
    fabricCanvas.add(label);
    fabricCanvas.renderAll();
  };

  const updateDistanceDisplay = () => {
    if (!fabricCanvas) return;

    // Remove existing distance objects
    const distanceObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type?.startsWith("distance-")
    );
    distanceObjects.forEach(obj => fabricCanvas.remove(obj));

    // Redraw if showing distances
    if (showDistances) {
      distances.forEach(drawDistanceLine);
    }
    
    fabricCanvas.renderAll();
  };

  const clearAllDistances = () => {
    if (!fabricCanvas) return;
    
    const distanceObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type?.startsWith("distance-")
    );
    distanceObjects.forEach(obj => fabricCanvas.remove(obj));
    
    setDistances([]);
    fabricCanvas.renderAll();
  };

  const toggleMeasuring = () => {
    setIsMeasuring(!isMeasuring);
    if (isMeasuring) {
      setCurrentMeasurement(null);
      removePreviewLine();
    }
  };

  return (
    <div className="absolute bottom-20 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 space-y-3 shadow-lg border">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4" />
        <span className="text-sm font-medium">Distance Measurement</span>
      </div>

      <div className="space-y-2">
        <Button
          variant={isMeasuring ? "destructive" : "default"}
          size="sm"
          onClick={toggleMeasuring}
          className="w-full"
          disabled={!homography}
        >
          {isMeasuring ? "Stop Measuring" : "Start Measuring"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDistances(!showDistances)}
          className="w-full"
        >
          {showDistances ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          {showDistances ? "Hide" : "Show"} Distances
        </Button>

        {distances.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllDistances}
            className="w-full"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status */}
      {!homography && (
        <Badge variant="destructive" className="text-xs">
          Field calibration required
        </Badge>
      )}

      {isMeasuring && homography && (
        <Badge variant="secondary" className="text-xs">
          Click and drag to measure
        </Badge>
      )}

      {distances.length > 0 && (
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {distances.length} measurement{distances.length !== 1 ? "s" : ""}
          </Badge>
          
          {distances.slice(-3).map((dist, index) => (
            <div key={dist.id} className="text-xs text-muted-foreground">
              Distance {distances.length - 2 + index}: {dist.distance.toFixed(1)}m
            </div>
          ))}
        </div>
      )}
    </div>
  );
};