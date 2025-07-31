import { useEffect, useRef } from "react";
import { Homography, type Point, getFieldReferencePoints } from "@/lib/homography";
import type { CalibrationMode, CalibrationPoint } from "./FieldCalibration";

interface FieldOverlayProps {
  width: number;
  height: number;
  calibrationMode: CalibrationMode;
  calibrationPoints: CalibrationPoint[];
  isVisible: boolean;
  className?: string;
}

export const FieldOverlay = ({
  width,
  height,
  calibrationMode,
  calibrationPoints,
  isVisible,
  className
}: FieldOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isVisible || calibrationPoints.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get field reference points based on calibration mode
    const fieldPoints = getFieldReferencePoints(calibrationMode);
    
    // Convert calibration points to format needed for homography
    const imagePoints: Point[] = calibrationPoints.map(p => ({ x: p.x, y: p.y }));
    
    if (imagePoints.length < fieldPoints.length) return;

    // Compute homography from field coordinates to image coordinates
    const homography = Homography.compute(fieldPoints, imagePoints);
    if (!homography) return;

    // Draw field elements based on calibration mode
    drawFieldElements(ctx, homography, calibrationMode);
  }, [width, height, calibrationMode, calibrationPoints, isVisible]);

  const drawFieldElements = (ctx: CanvasRenderingContext2D, homography: number[], mode: CalibrationMode) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    const L = 105; // Field length
    const W = 68;  // Field width
    const R = 9.15; // Center circle radius

    const transformPoint = (p: Point) => Homography.transform(p, homography);

    const drawLine = (p1: Point, p2: Point) => {
      const tp1 = transformPoint(p1);
      const tp2 = transformPoint(p2);
      
      if (isFinite(tp1.x) && isFinite(tp1.y) && isFinite(tp2.x) && isFinite(tp2.y)) {
        ctx.beginPath();
        ctx.moveTo(tp1.x, tp1.y);
        ctx.lineTo(tp2.x, tp2.y);
        ctx.stroke();
      }
    };

    const drawCircle = (center: Point, radius: number) => {
      const transformedCenter = transformPoint(center);
      if (!isFinite(transformedCenter.x) || !isFinite(transformedCenter.y)) return;

      // Approximate circle with many line segments
      const segments = 64;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const p = {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        };
        const tp = transformPoint(p);
        
        if (isFinite(tp.x) && isFinite(tp.y)) {
          if (i === 0) {
            ctx.moveTo(tp.x, tp.y);
          } else {
            ctx.lineTo(tp.x, tp.y);
          }
        }
      }
      ctx.stroke();
    };

    const drawRectangle = (topLeft: Point, bottomRight: Point) => {
      const topRight = { x: bottomRight.x, y: topLeft.y };
      const bottomLeft = { x: topLeft.x, y: bottomRight.y };
      
      drawLine(topLeft, topRight);
      drawLine(topRight, bottomRight);
      drawLine(bottomRight, bottomLeft);
      drawLine(bottomLeft, topLeft);
    };

    // Draw field elements based on mode
    switch (mode) {
      case "away-goal":
        // Draw goal areas and penalty areas for away goal
        // Small goal area (6-yard box)
        drawRectangle(
          { x: 0, y: W/2 - 9.16 },
          { x: 5.5, y: W/2 + 9.16 }
        );
        
        // Large goal area (18-yard box)
        drawRectangle(
          { x: 0, y: W/2 - 20.16 },
          { x: 16.5, y: W/2 + 20.16 }
        );
        
        // Penalty spot
        const penaltySpot = transformPoint({ x: 11, y: W/2 });
        if (isFinite(penaltySpot.x) && isFinite(penaltySpot.y)) {
          ctx.beginPath();
          ctx.arc(penaltySpot.x, penaltySpot.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Goal line
        drawLine({ x: 0, y: 0 }, { x: 0, y: W });
        break;

      case "home-goal":
        // Draw goal areas and penalty areas for home goal
        // Small goal area (6-yard box)
        drawRectangle(
          { x: L - 5.5, y: W/2 - 9.16 },
          { x: L, y: W/2 + 9.16 }
        );
        
        // Large goal area (18-yard box)
        drawRectangle(
          { x: L - 16.5, y: W/2 - 20.16 },
          { x: L, y: W/2 + 20.16 }
        );
        
        // Penalty spot
        const homePenaltySpot = transformPoint({ x: L - 11, y: W/2 });
        if (isFinite(homePenaltySpot.x) && isFinite(homePenaltySpot.y)) {
          ctx.beginPath();
          ctx.arc(homePenaltySpot.x, homePenaltySpot.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Goal line
        drawLine({ x: L, y: 0 }, { x: L, y: W });
        break;

      case "center-circle":
      default:
        // Draw center circle and halfway line
        drawCircle({ x: L/2, y: W/2 }, R);
        
        // Center spot
        const centerSpot = transformPoint({ x: L/2, y: W/2 });
        if (isFinite(centerSpot.x) && isFinite(centerSpot.y)) {
          ctx.beginPath();
          ctx.arc(centerSpot.x, centerSpot.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Halfway line
        drawLine({ x: L/2, y: 0 }, { x: L/2, y: W });
        
        // Touchlines
        drawLine({ x: 0, y: 0 }, { x: L, y: 0 });
        drawLine({ x: 0, y: W }, { x: L, y: W });
        
        // Field outline (partial based on visible area)
        drawLine({ x: 0, y: 0 }, { x: 0, y: W });
        drawLine({ x: L, y: 0 }, { x: L, y: W });
        break;
    }
  };

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 5 }}
    />
  );
};