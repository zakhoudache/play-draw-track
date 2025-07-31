import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Circle, Goal, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export type CalibrationMode = "away-goal" | "home-goal" | "center-circle";

export interface CalibrationPoint {
  x: number;
  y: number;
  label: string;
}

interface FieldCalibrationProps {
  mode: CalibrationMode;
  onModeChange: (mode: CalibrationMode) => void;
  calibrationPoints: CalibrationPoint[];
  onPointClick: (x: number, y: number) => void;
  onReset: () => void;
  onComplete: () => void;
  isCompleted: boolean;
  className?: string;
}

const CALIBRATION_CONFIGS = {
  "away-goal": {
    title: "Away Team Goal Area",
    icon: Goal,
    color: "bg-red-500",
    description: "Click on the corners of the goal area (small and large boxes)",
    points: [
      "Top-left corner of small goal area",
      "Top-right corner of small goal area", 
      "Bottom-left corner of small goal area",
      "Bottom-right corner of small goal area",
      "Top-left corner of large goal area",
      "Top-right corner of large goal area",
      "Bottom-left corner of large goal area",
      "Bottom-right corner of large goal area"
    ]
  },
  "home-goal": {
    title: "Home Team Goal Area", 
    icon: Goal,
    color: "bg-blue-500",
    description: "Click on the corners of the goal area (small and large boxes)",
    points: [
      "Top-left corner of small goal area",
      "Top-right corner of small goal area",
      "Bottom-left corner of small goal area", 
      "Bottom-right corner of small goal area",
      "Top-left corner of large goal area",
      "Top-right corner of large goal area",
      "Bottom-left corner of large goal area",
      "Bottom-right corner of large goal area"
    ]
  },
  "center-circle": {
    title: "Center Circle Field",
    icon: Circle,
    color: "bg-green-500", 
    description: "Click on key points of the center circle and field",
    points: [
      "Center Spot of the pitch",
      "Top of the Center Circle (closest to a goal)",
      "Right point of the Center Circle (on halfway line)",
      "Bottom of the Center Circle (furthest from a goal)",
      "Left point of the Center Circle (on halfway line)",
      "Midpoint of the Top Touchline",
      "Midpoint of the Bottom Touchline"
    ]
  }
};

export const FieldCalibration = ({
  mode,
  onModeChange,
  calibrationPoints,
  onPointClick,
  onReset,
  onComplete,
  isCompleted,
  className
}: FieldCalibrationProps) => {
  const config = CALIBRATION_CONFIGS[mode];
  const currentPointIndex = calibrationPoints.length;
  const totalPoints = config.points.length;
  const isCalibrationComplete = currentPointIndex >= totalPoints;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCalibrationComplete) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    onPointClick(x, y);
    
    if (currentPointIndex + 1 >= totalPoints) {
      toast.success("Calibration completed! You can now start annotating.");
      onComplete();
    } else {
      toast.success(`Point ${currentPointIndex + 1}/${totalPoints} placed`);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Field Calibration</h3>
          </div>
          
          {isCompleted && (
            <Badge variant="default" className="bg-green-500">
              Completed
            </Badge>
          )}
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select calibration mode based on camera view:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.entries(CALIBRATION_CONFIGS).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <Button
                  key={key}
                  variant={mode === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => onModeChange(key as CalibrationMode)}
                  className="justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {cfg.title}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Mode Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span className="font-medium">{config.title}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Progress: {currentPointIndex}/{totalPoints}
            </span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${config.color}`}
                style={{ width: `${(currentPointIndex / totalPoints) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Instruction */}
        {!isCalibrationComplete && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium">
              Step {currentPointIndex + 1}: Click on "{config.points[currentPointIndex]}"
            </p>
          </div>
        )}

        {/* Calibration Canvas Area */}
        <div 
          className="relative min-h-[300px] border-2 border-dashed border-border rounded-lg bg-muted/50 cursor-crosshair flex items-center justify-center"
          onClick={handleCanvasClick}
        >
          {calibrationPoints.length === 0 ? (
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Click here to start calibration
              </p>
            </div>
          ) : (
            <div className="absolute inset-0">
              {calibrationPoints.map((point, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                  style={{ left: point.x, top: point.y }}
                >
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-primary text-primary-foreground px-1 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
            disabled={calibrationPoints.length === 0}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Points
          </Button>

          <Button
            size="sm"
            onClick={onComplete}
            disabled={!isCalibrationComplete}
          >
            Start Annotating
          </Button>
        </div>

        {/* Point List */}
        {calibrationPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Calibration Points:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {calibrationPoints.map((point, index) => (
                <div key={index} className="text-xs text-muted-foreground flex justify-between">
                  <span>
                    {index + 1}. {config.points[index]}
                  </span>
                  <span>
                    ({point.x.toFixed(0)}, {point.y.toFixed(0)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};