import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Ellipse, Polygon, IText } from "fabric";

interface Player {
  id: string;
  number: string;
  team: "home" | "away";
  x: number; // Field coordinates (0-105m)
  y: number; // Field coordinates (0-68m)
  confidence: number;
}

interface PlayerTrackingProps {
  fabricCanvas: FabricCanvas | null;
  currentTime: number;
  homography: number[] | null;
  fieldToScreen: (point: { x: number; y: number }, H: number[]) => { x: number; y: number } | null;
}

export const PlayerTracking = ({ 
  fabricCanvas, 
  currentTime, 
  homography,
  fieldToScreen 
}: PlayerTrackingProps) => {
  const [players, setPlayers] = useState<Player[]>([]);

  // Simulate player tracking data (in production, this would come from ML/CV pipeline)
  useEffect(() => {
    if (!homography) return;

    // Mock player positions that change over time
    const mockPlayers: Player[] = [
      // Home team (blue)
      { id: "home_10", number: "10", team: "home", x: 35 + Math.sin(currentTime * 0.1) * 5, y: 34 + Math.cos(currentTime * 0.1) * 3, confidence: 0.95 },
      { id: "home_9", number: "9", team: "home", x: 45 + Math.sin(currentTime * 0.15) * 4, y: 30 + Math.cos(currentTime * 0.12) * 4, confidence: 0.88 },
      { id: "home_8", number: "8", team: "home", x: 30 + Math.sin(currentTime * 0.08) * 6, y: 25 + Math.cos(currentTime * 0.1) * 5, confidence: 0.92 },
      { id: "home_7", number: "7", team: "home", x: 40 + Math.sin(currentTime * 0.12) * 3, y: 40 + Math.cos(currentTime * 0.09) * 4, confidence: 0.87 },
      
      // Away team (white/green)
      { id: "away_10", number: "10", team: "away", x: 65 + Math.sin(currentTime * 0.11) * 4, y: 34 + Math.cos(currentTime * 0.13) * 3, confidence: 0.91 },
      { id: "away_9", number: "9", team: "away", x: 70 + Math.sin(currentTime * 0.14) * 5, y: 28 + Math.cos(currentTime * 0.11) * 4, confidence: 0.85 },
      { id: "away_11", number: "11", team: "away", x: 60 + Math.sin(currentTime * 0.09) * 4, y: 42 + Math.cos(currentTime * 0.12) * 3, confidence: 0.89 },
      { id: "away_7", number: "7", team: "away", x: 75 + Math.sin(currentTime * 0.13) * 3, y: 35 + Math.cos(currentTime * 0.08) * 5, confidence: 0.93 },
    ];

    setPlayers(mockPlayers);
  }, [currentTime, homography]);

  // Render player spotlights
  useEffect(() => {
    if (!fabricCanvas || !homography || !fieldToScreen) return;

    // Remove existing player tracking objects
    const existingTracking = fabricCanvas.getObjects().filter(obj => 
      (obj as any).data?.type === "player-tracking"
    );
    fabricCanvas.remove(...existingTracking);

    // Add player spotlights and labels
    players.forEach(player => {
      const screenPos = fieldToScreen({ x: player.x, y: player.y }, homography);
      if (!screenPos) return;

      // Player spotlight (elliptical)
      const spotlight = new Ellipse({
        left: screenPos.x - 25,
        top: screenPos.y - 35,
        rx: 25,
        ry: 35,
        fill: "transparent",
        stroke: player.team === "home" ? "#3B82F6" : "#10B981",
        strokeWidth: 3,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        opacity: 0.8,
        data: { type: "player-tracking", playerId: player.id } as any
      });

      // Player number label
      const label = new IText(player.number, {
        left: screenPos.x - 8,
        top: screenPos.y - 8,
        fill: "white",
        fontSize: 14,
        fontWeight: "bold",
        selectable: false,
        evented: false,
        backgroundColor: player.team === "home" ? "#3B82F6" : "#10B981",
        borderRadius: 10,
        data: { type: "player-tracking", playerId: player.id } as any
      });

      // Motion arrow (if player is moving)
      const motionVector = getPlayerMotion(player.id, currentTime);
      if (motionVector && (Math.abs(motionVector.x) > 0.1 || Math.abs(motionVector.y) > 0.1)) {
        const arrowEnd = fieldToScreen({ 
          x: player.x + motionVector.x * 10, 
          y: player.y + motionVector.y * 10 
        }, homography);
        
        if (arrowEnd) {
          const arrow = new Polygon([
            { x: screenPos.x, y: screenPos.y },
            { x: arrowEnd.x - 5, y: arrowEnd.y - 5 },
            { x: arrowEnd.x, y: arrowEnd.y },
            { x: arrowEnd.x - 5, y: arrowEnd.y + 5 }
          ], {
            fill: "white",
            stroke: "#1F2937",
            strokeWidth: 2,
            selectable: false,
            evented: false,
            opacity: 0.9
          } as any);
          (arrow as any).data = { type: "player-tracking", playerId: player.id };
          
          fabricCanvas.add(arrow);
        }
      }

      fabricCanvas.add(spotlight, label);
    });

    fabricCanvas.renderAll();
  }, [players, fabricCanvas, homography, fieldToScreen]);

  return null; // This component only manages canvas objects
};

// Helper function to simulate player motion
function getPlayerMotion(playerId: string, currentTime: number): { x: number; y: number } | null {
  // Simple motion simulation - in production this would be calculated from tracking data
  const motionPhase = currentTime * 0.1;
  const baseMotion = Math.sin(motionPhase + playerId.length);
  
  if (Math.abs(baseMotion) < 0.3) return null; // Player not moving much
  
  return {
    x: baseMotion * 0.5,
    y: Math.cos(motionPhase + playerId.length) * 0.3
  };
}