import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer, 
  Pen, 
  Square, 
  Circle, 
  Trash2, 
  RotateCcw,
  Palette,
  Triangle,
  Minus,
  Type,
  Undo,
  Redo,
  Save,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingToolbarProps {
  activeTool: "select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text";
  onToolChange: (tool: "select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text") => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
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
  onUndo,
  onRedo,
  onSave,
  onExport,
  className
}: DrawingToolbarProps) => {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-elegant",
      className
    )}>
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
          <Button
            variant={activeTool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("select")}
            className="h-8 w-8 p-0"
            title="Select Tool (V)"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "draw" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("draw")}
            className="h-8 w-8 p-0"
            title="Free Draw (B)"
          >
            <Pen className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "line" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("line")}
            className="h-8 w-8 p-0"
            title="Line Tool (L)"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "rectangle" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("rectangle")}
            className="h-8 w-8 p-0"
            title="Rectangle (R)"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "circle" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("circle")}
            className="h-8 w-8 p-0"
            title="Circle (C)"
          >
            <Circle className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "triangle" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("triangle")}
            className="h-8 w-8 p-0"
            title="Triangle (T)"
          >
            <Triangle className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTool === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => onToolChange("text")}
            className="h-8 w-8 p-0"
            title="Text Tool (X)"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>
        
        {activeTool !== "select" && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
          </Badge>
        )}
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

      {/* History Actions */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Destructive Actions */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Delete Selected (Delete)"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Clear All (Ctrl+Alt+C)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Save Actions */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="h-8 w-8 p-0"
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-8 w-8 p-0"
          title="Export (Ctrl+E)"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};