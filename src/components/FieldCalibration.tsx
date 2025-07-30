import { useState, useEffect } from "react";
import { Canvas as FabricCanvas, Circle, IText, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Target, Check, RotateCcw } from "lucide-react";
import { Point, Homography, CALIBRATION_PROMPTS, CALIBRATION_DST_POINTS } from "@/lib/homography";

interface FieldCalibrationProps {
  fabricCanvas: FabricCanvas | null;
  onCalibrationComplete: (homography: number[], inverseHomography: number[]) => void;
  onCalibrationReset: () => void;
}

export const FieldCalibration: React.FC<FieldCalibrationProps> = ({
  fabricCanvas,
  onCalibrationComplete,
  onCalibrationReset
}) => {
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (!isCalibrating || calibrationPoints.length >= 7) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      const newPoint = { x: pointer.x, y: pointer.y };
      
      setCalibrationPoints(prev => {
        const updated = [...prev, newPoint];
        
        // Auto-complete when we have 7 points
        if (updated.length === 7) {
          computeHomography(updated);
        }
        
        return updated;
      });
      
      // Draw calibration point
      drawCalibrationPoint(newPoint, calibrationPoints.length);
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
    };
  }, [fabricCanvas, isCalibrating, calibrationPoints]);

  // Update current step when points change
  useEffect(() => {
    setCurrentStep(calibrationPoints.length);
  }, [calibrationPoints]);

  const drawCalibrationPoint = (point: Point, index: number) => {
    if (!fabricCanvas) return;

    // Draw calibration marker
    const marker = new Circle({
      left: point.x - 8,
      top: point.y - 8,
      radius: 8,
      fill: "#FF6B35",
      stroke: "white",
      strokeWidth: 2,
      selectable: false,
      evented: false,
      shadow: new Shadow({
        color: "#FF6B35",
        blur: 10,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        includeDefaultValues: true,
        nonScaling: false
      }),
      data: { type: "calibration-point", index } as any
    });

    // Draw point number
    const label = new IText((index + 1).toString(), {
      left: point.x - 5,
      top: point.y - 7,
      fill: "white",
      fontSize: 12,
      fontWeight: "bold",
      fontFamily: "Arial",
      textAlign: "center",
      selectable: false,
      evented: false,
      data: { type: "calibration-label", index } as any
    });

    fabricCanvas.add(marker, label);
    fabricCanvas.renderAll();
  };

  const computeHomography = (points: Point[]) => {
    if (points.length !== 7) return;

    // Compute homography using the enhanced implementation
    const inverseHomography = Homography.compute(CALIBRATION_DST_POINTS, points);
    
    if (inverseHomography) {
      const homography = Homography.invert(inverseHomography);
      
      if (homography) {
        setIsComplete(true);
        setIsCalibrating(false);
        onCalibrationComplete(homography, inverseHomography);
        
        // Show success feedback
        setTimeout(() => {
          alert("✅ Field calibration successful! You can now use distance measurements and field overlay.");
        }, 100);
      } else {
        alert("❌ Calibration failed: Matrix could not be inverted. Please try again with clearer points.");
        resetCalibration();
      }
    } else {
      alert("❌ Calibration failed: Could not compute transform. Please try again with more accurate point selection.");
      resetCalibration();
    }
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setIsComplete(false);
    resetCalibrationPoints();
  };

  const resetCalibration = () => {
    setIsCalibrating(false);
    setIsComplete(false);
    resetCalibrationPoints();
    onCalibrationReset();
  };

  const resetCalibrationPoints = () => {
    if (!fabricCanvas) return;
    
    // Remove existing calibration objects
    const calibrationObjects = fabricCanvas.getObjects().filter(
      (obj: any) => obj.data?.type?.startsWith("calibration-")
    );
    calibrationObjects.forEach(obj => fabricCanvas.remove(obj));
    
    setCalibrationPoints([]);
    setCurrentStep(0);
    fabricCanvas.renderAll();
  };

  const getCurrentPrompt = () => {
    if (currentStep >= CALIBRATION_PROMPTS.length) {
      return "✅ <strong>Calibration complete!</strong>";
    }
    return CALIBRATION_PROMPTS[currentStep];
  };

  return (
    <div className="absolute top-4 left-4 max-w-sm">
      <Card className="p-4 bg-background/90 backdrop-blur-sm border shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="font-medium">Field Calibration</span>
            {isComplete && <Check className="h-4 w-4 text-green-500" />}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Badge 
              variant={isComplete ? "default" : isCalibrating ? "secondary" : "outline"}
              className="w-full justify-center"
            >
              {isComplete ? "Calibrated" : isCalibrating ? `Step ${currentStep + 1}/7` : "Not Calibrated"}
            </Badge>

            {(isCalibrating || isComplete) && (
              <div 
                className="text-sm text-center p-2 bg-amber-50 border border-amber-200 rounded"
                dangerouslySetInnerHTML={{ __html: getCurrentPrompt() }}
              />
            )}
          </div>

          {/* Progress Bar */}
          {isCalibrating && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>
          )}

          {/* Controls */}
          <div className="space-y-2">
            {!isCalibrating && !isComplete && (
              <Button onClick={startCalibration} className="w-full">
                Start Calibration
              </Button>
            )}

            {(isCalibrating || isComplete) && (
              <Button 
                variant="outline" 
                onClick={resetCalibration}
                className="w-full"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset Calibration
              </Button>
            )}
          </div>

          {/* Help Text */}
          {!isCalibrating && !isComplete && (
            <p className="text-xs text-muted-foreground">
              Calibrate the field perspective by clicking on 7 key points. This enables accurate distance measurements and field overlay.
            </p>
          )}

          {isCalibrating && (
            <p className="text-xs text-muted-foreground">
              Click on the highlighted areas of the football pitch. Be as precise as possible for best results.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};