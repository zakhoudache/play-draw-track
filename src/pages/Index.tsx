import { useState, useRef } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DrawingCanvas, DrawingCanvasRef } from "@/components/DrawingCanvas";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { Timeline } from "@/components/Timeline";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileVideo, Info } from "lucide-react";
import { toast } from "sonner";

interface Clip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
}

const Index = () => {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text">("select");
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [brushSize, setBrushSize] = useState(3);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip>();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast("Please select a valid video file");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    toast(`Loaded ${file.name}`);
  };

  const handleVideoLoadedData = (duration: number) => {
    setVideoDuration(duration);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
  };

  const handleClipCreate = (clipData: Omit<Clip, "id">) => {
    const newClip: Clip = {
      ...clipData,
      id: Date.now().toString(),
    };
    setClips(prev => [...prev, newClip]);
  };

  const handleClipSelect = (clip: Clip) => {
    setSelectedClip(clip);
  };

  const handleClearCanvas = () => {
    if (canvasRef.current?.clearCanvas) {
      canvasRef.current.clearCanvas();
    }
  };

  const handleDeleteSelected = () => {
    if (canvasRef.current?.deleteSelected) {
      canvasRef.current.deleteSelected();
    }
  };

  const handleUndo = () => {
    if (canvasRef.current?.undo) {
      canvasRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (canvasRef.current?.redo) {
      canvasRef.current.redo();
    }
  };

  const handleSave = () => {
    if (canvasRef.current?.saveAnnotations) {
      canvasRef.current.saveAnnotations();
    }
  };

  const handleExport = () => {
    if (canvasRef.current?.exportAsImage) {
      canvasRef.current.exportAsImage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileVideo className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PlayDrawTrack
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Video
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-4">
        {!videoSrc ? (
          /* Upload State */
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <FileVideo className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Upload a Video to Start</h2>
                <p className="text-muted-foreground mb-4">
                  Upload your video to begin creating clips and annotations
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Choose Video File
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Main Interface */
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Video and Canvas */}
            <div className="xl:col-span-3 space-y-4">
              {/* Drawing Toolbar */}
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                activeColor={activeColor}
                onColorChange={setActiveColor}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                onClear={handleClearCanvas}
                onDelete={handleDeleteSelected}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onSave={handleSave}
                onExport={handleExport}
              />

              {/* Video Player with Drawing Canvas */}
              <div className="relative">
                <VideoPlayer
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedData={handleVideoLoadedData}
                  className="relative"
                />
                
                {/* Drawing Canvas Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative w-full h-full">
                    <DrawingCanvas
                      ref={canvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      activeTool={activeTool}
                      activeColor={activeColor}
                      brushSize={brushSize}
                      className="absolute top-0 left-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline and Clips */}
            <div className="space-y-4">
              <Timeline
                duration={videoDuration}
                currentTime={currentTime}
                clips={clips}
                onClipCreate={handleClipCreate}
                onClipSelect={handleClipSelect}
                selectedClip={selectedClip}
              />
              
              {selectedClip && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Selected Clip</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{selectedClip.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">{Math.round(selectedClip.endTime - selectedClip.startTime)}s</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start: </span>
                      <span className="font-medium">{Math.round(selectedClip.startTime)}s</span>
                    </div>
                  </div>
                </Card>
              )}
              
              <KeyboardShortcuts />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
