import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalibrationMode, CalibrationPoint } from "@/components/FieldCalibration";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface CalibrationSidebarProps {
  calibrationMode: CalibrationMode;
  calibrationPoints: CalibrationPoint[];
  onModeChange: (mode: CalibrationMode) => void;
  onReset: () => void;
  onComplete: () => void;
}

export const CalibrationSidebar = ({
  calibrationMode,
  calibrationPoints,
  onModeChange,
  onReset,
  onComplete,
}: CalibrationSidebarProps) => {
  const getCalibrationInstruction = (mode: CalibrationMode, pointIndex: number): string => {
    const instructions = {
      "away-goal": [
        "Click top-left corner of small goal area",
        "Click top-right corner of small goal area", 
        "Click bottom-left corner of small goal area",
        "Click bottom-right corner of small goal area",
        "Click top-left corner of large goal area",
        "Click top-right corner of large goal area",
        "Click bottom-left corner of large goal area",
        "Click bottom-right corner of large goal area"
      ],
      "home-goal": [
        "Click top-left corner of small goal area",
        "Click top-right corner of small goal area",
        "Click bottom-left corner of small goal area", 
        "Click bottom-right corner of small goal area",
        "Click top-left corner of large goal area",
        "Click top-right corner of large goal area",
        "Click bottom-left corner of large goal area",
        "Click bottom-right corner of large goal area"
      ],
      "center-circle": [
        "Click the Center Spot of the pitch",
        "Click the Top of the Center Circle (closest to a goal)",
        "Click the Right point of the Center Circle (on halfway line)",
        "Click the Bottom of the Center Circle (furthest from a goal)",
        "Click the Left point of the Center Circle (on halfway line)",
        "Click the Midpoint of the Top Touchline",
        "Click the Midpoint of the Bottom Touchline"
      ]
    };
    
    return instructions[mode][pointIndex] || "Calibration complete";
  };

  const getRequiredPoints = (mode: CalibrationMode): number => {
    const requiredPoints = {
      "away-goal": 8,
      "home-goal": 8,
      "center-circle": 7
    };
    return requiredPoints[mode];
  };

  return (
    <Sidebar side="right" className="w-80">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Field Calibration</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Camera View</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <Button
                size="sm"
                variant={calibrationMode === "away-goal" ? "default" : "outline"}
                onClick={() => onModeChange("away-goal")}
                className="w-full justify-start"
              >
                Away Goal Area
              </Button>
              <Button
                size="sm"
                variant={calibrationMode === "home-goal" ? "default" : "outline"}
                onClick={() => onModeChange("home-goal")}
                className="w-full justify-start"
              >
                Home Goal Area
              </Button>
              <Button
                size="sm"
                variant={calibrationMode === "center-circle" ? "default" : "outline"}
                onClick={() => onModeChange("center-circle")}
                className="w-full justify-start"
              >
                Center Circle
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Instructions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium mb-2">
                  Step {calibrationPoints.length + 1} of {getRequiredPoints(calibrationMode)}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {getCalibrationInstruction(calibrationMode, calibrationPoints.length)}
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Progress: {calibrationPoints.length}/{getRequiredPoints(calibrationMode)} points placed
              </div>
              
              {calibrationPoints.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Click on the video to place calibration points
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onReset}
                disabled={calibrationPoints.length === 0}
                className="w-full"
              >
                Reset Points
              </Button>
              <Button
                size="sm"
                onClick={onComplete}
                disabled={calibrationPoints.length < getRequiredPoints(calibrationMode)}
                className="w-full"
              >
                Complete Calibration
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {calibrationPoints.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Placed Points</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1">
                {calibrationPoints.map((point, index) => (
                  <div key={index} className="text-xs text-muted-foreground flex justify-between">
                    <span>Point {index + 1}</span>
                    <span>({Math.round(point.x)}, {Math.round(point.y)})</span>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};