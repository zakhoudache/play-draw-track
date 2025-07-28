import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer, 
  Pen, 
  Square, 
  Circle, 
  Trash2, 
  RotateCcw,
  Palette 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingToolbarProps {
  activeTool: "select" | "draw" | "rectangle" | "circle";
  onToolChange: (tool: "select" | "draw" | "rectangle" | "circle") => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onDelete: () => void;
  className?: string;
}

const PRESET_COLORS = [
  "#0EA5E9", // Primary blue
  "#10B981", // Accent green  
  "#F59E0B", // Warning yellow
  "#EF4444", // Danger red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#EC4899", // Pink
  "#FFFFFF", // White
];

export const DrawingToolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  onDelete,
  className
}: DrawingToolbarProps) => {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-lg",
      className
    )}>
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeTool === "select" ? "default" : "secondary"}
          size="sm"
          onClick={() => onToolChange("select")}
          className="h-9 w-9 p-0"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === "draw" ? "default" : "secondary"}
          size="sm"
          onClick={() => onToolChange("draw")}
          className="h-9 w-9 p-0"
        >
          <Pen className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === "rectangle" ? "default" : "secondary"}
          size="sm"
          onClick={() => onToolChange("rectangle")}
          className="h-9 w-9 p-0"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === "circle" ? "default" : "secondary"}
          size="sm"
          onClick={() => onToolChange("circle")}
          className="h-9 w-9 p-0"
        >
          <Circle className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded border-2 transition-all",
                activeColor === color 
                  ? "border-primary scale-110" 
                  : "border-border hover:border-muted-foreground"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        
        {/* Custom Color Input */}
        <input
          type="color"
          value={activeColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer"
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Brush Size */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-sm text-muted-foreground">Size:</span>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          min={1}
          max={20}
          step={1}
          className="flex-1"
        />
        <span className="text-sm font-mono w-6 text-center">{brushSize}</span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onDelete}
          className="h-9 w-9 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onClear}
          className="h-9 w-9 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};