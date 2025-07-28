import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  className?: string;
}

export const KeyboardShortcuts = ({ className }: KeyboardShortcutsProps) => {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Keyboard Shortcuts</h3>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-medium mb-2 text-muted-foreground">Tools</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span>Select</span>
              <Badge variant="outline" className="text-xs">V</Badge>
            </div>
            <div className="flex justify-between">
              <span>Draw</span>
              <Badge variant="outline" className="text-xs">B</Badge>
            </div>
           <div className="flex justify-between">
  <span>Rectangle</span>
  <Badge variant="outline" className="text-xs">Alt+R</Badge>
</div>
            <div className="flex justify-between">
              <span>Circle</span>
              <Badge variant="outline" className="text-xs">C</Badge>
            </div>
            <div className="flex justify-between">
              <span>Line</span>
              <Badge variant="outline" className="text-xs">L</Badge>
            </div>
            <div className="flex justify-between">
              <span>Triangle</span>
              <Badge variant="outline" className="text-xs">T</Badge>
            </div>
            <div className="flex justify-between">
              <span>Text</span>
              <Badge variant="outline" className="text-xs">X</Badge>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium mb-2 text-muted-foreground">Actions</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Undo</span>
              <Badge variant="outline" className="text-xs">Ctrl+Z</Badge>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <Badge variant="outline" className="text-xs">Ctrl+Y</Badge>
            </div>
            <div className="flex justify-between">
              <span>Delete</span>
              <Badge variant="outline" className="text-xs">Del</Badge>
            </div>
            <div className="flex justify-between">
              <span>Save</span>
              <Badge variant="outline" className="text-xs">Ctrl+S</Badge>
            </div>
            <div className="flex justify-between">
              <span>Export</span>
              <Badge variant="outline" className="text-xs">Ctrl+E</Badge>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium mb-2 text-muted-foreground">Video</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Record Clip</span>
              <Badge variant="outline" className="text-xs">R</Badge>
            </div>
            <div className="flex justify-between">
              <span>Play/Pause</span>
              <Badge variant="outline" className="text-xs">Space</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
