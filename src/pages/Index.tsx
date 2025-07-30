// pages/Index.tsx
import { useState, useRef, useEffect } from "react";
import { VideoPlayer, VideoPlayerRef } from "@/components/VideoPlayer";
import { DrawingCanvas, DrawingCanvasRef } from "@/components/DrawingCanvas";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { Timeline, type Clip } from "@/components/Timeline";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { TacticalOverlay } from "@/components/TacticalOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileVideo, Info } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text" | "ellipse">("select");
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [brushSize, setBrushSize] = useState(3);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
  const [tacticalInsights, setTacticalInsights] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const videoRef = useRef<VideoPlayerRef>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Match Info
  const [matchInfo, setMatchInfo] = useState({
    date: "",
    homeTeam: "",
    awayTeam: "",
    competition: "",
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast("Please select a valid video file");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setMatchInfo({
      date: new Date().toLocaleDateString(),
      homeTeam: "",
      awayTeam: "",
      competition: "",
    });
    resetState();
  };

  const resetState = () => {
    setVideoDuration(0);
    setCurrentTime(0);
    setClips([]);
    setSelectedClip(undefined);
  };

  // Sync canvas size with video
  useEffect(() => {
    const updateSize = () => {
      if (videoContainerRef.current) {
        const video = videoContainerRef.current.querySelector('video');
        if (video) {
          setCanvasSize({
            width: video.clientWidth,
            height: video.clientHeight,
          });
        }
      }
    };
    window.addEventListener("resize", updateSize);
    if (videoSrc) {
      setTimeout(updateSize, 100); // Allow video to load
    }
    return () => window.removeEventListener("resize", updateSize);
  }, [videoSrc]);

  const handleVideoLoadedData = (duration: number) => {
    setVideoDuration(duration);
  };

  const handleTimeUpdate = (time: number, duration: number) => {
    setCurrentTime(time);
  };

  const handleClipCreate = (clipData: Omit<Clip, "id">) => {
    const newClip = {
      ...clipData,
      id: crypto.randomUUID(),
      annotations: "", // Will store Fabric.js JSON
    };
    setClips((prev) => [...prev, newClip]);
    setSelectedClip(newClip);
    toast.success(`Clip created: ${newClip.name}`);
  };

  const handleClipSelect = (clip: Clip) => {
    setSelectedClip(clip);
    if (videoRef.current) {
      videoRef.current.seek(clip.startTime);
      setCurrentTime(clip.startTime);
    }
    if (!canvasRef.current) return;

    canvasRef.current.clearCanvas();

    if (clip.annotations) {
      try {
        const json = JSON.parse(clip.annotations);
        const fabricCanvas = (canvasRef.current as any).fabricCanvas;
        fabricCanvas.loadFromJSON(json, () => fabricCanvas.renderAll());
      } catch (e) {
        toast.error("Failed to load drawings");
      }
    }
  };

  const handleSave = () => {
    if (!selectedClip || !canvasRef.current) {
      toast.error("No clip selected");
      return;
    }
    const json = canvasRef.current.saveAnnotations();
    setClips((prev) =>
      prev.map((c) => (c.id === selectedClip.id ? { ...c, annotations: json } : c))
    );
    toast.success("Annotations saved");
  };

  const handleExport = () => {
    if (!selectedClip) {
      toast.error("Select a clip first");
      return;
    }
    canvasRef.current?.exportAsImage();
  };

  const handleAddTacticalInsight = (insight: any) => {
    const newInsight = {
      ...insight,
      id: crypto.randomUUID(),
      clipId: selectedClip?.id
    };
    setTacticalInsights(prev => [...prev, newInsight]);
    toast.success("Tactical insight added");
  };

  const handleClearCanvas = () => canvasRef.current?.clearCanvas();
  const handleDeleteSelected = () => canvasRef.current?.deleteSelected();
  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileVideo className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
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
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Video
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
                  <Upload className="h-5 w-5" /> Choose Video File
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Main Interface */
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Video and Canvas */}
            <div className="xl:col-span-3 space-y-4">
              {/* Match Info Form */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Date"
                  value={matchInfo.date}
                  onChange={(e) => setMatchInfo({ ...matchInfo, date: e.target.value })}
                  className="px-3 py-2 border rounded text-sm"
                />
                <input
                  placeholder="Competition"
                  value={matchInfo.competition}
                  onChange={(e) => setMatchInfo({ ...matchInfo, competition: e.target.value })}
                  className="px-3 py-2 border rounded text-sm"
                />
                <input
                  placeholder="Home Team"
                  value={matchInfo.homeTeam}
                  onChange={(e) => setMatchInfo({ ...matchInfo, homeTeam: e.target.value })}
                  className="px-3 py-2 border rounded text-sm"
                />
                <input
                  placeholder="Away Team"
                  value={matchInfo.awayTeam}
                  onChange={(e) => setMatchInfo({ ...matchInfo, awayTeam: e.target.value })}
                  className="px-3 py-2 border rounded text-sm"
                />
              </div>

              {/* Toolbar */}
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

              {/* Video + Canvas */}
              <div ref={videoContainerRef} className="relative">
                <VideoPlayer
                  ref={videoRef}
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedData={handleVideoLoadedData}
                />
                <div className="absolute inset-0">
                  <DrawingCanvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    activeTool={activeTool}
                    activeColor={activeColor}
                    brushSize={brushSize}
                    currentTime={currentTime}
                  />
                </div>

                {/* Tactical Overlay */}
                <TacticalOverlay
                  currentTime={currentTime}
                  onAddInsight={handleAddTacticalInsight}
                  insights={tacticalInsights.filter(i => i.clipId === selectedClip?.id)}
                />

                {/* Match Overlay */}
                {matchInfo.homeTeam && matchInfo.awayTeam && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {matchInfo.date} – {matchInfo.homeTeam} vs {matchInfo.awayTeam}
                  </div>
                )}
                {selectedClip?.name && (
                  <div className="absolute bottom-20 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {selectedClip.name}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
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
                      <span className="font-medium">{(selectedClip.endTime - selectedClip.startTime).toFixed(1)}s</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start: </span>
                      <span className="font-medium">{selectedClip.startTime.toFixed(1)}s</span>
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
