// pages/Index.tsx
import { useState, useRef, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DrawingCanvas, DrawingCanvasRef } from "@/components/DrawingCanvas";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { Timeline, type Clip } from "@/components/Timeline";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { FieldCalibration, type CalibrationMode, type CalibrationPoint } from "@/components/FieldCalibration";
import { FieldOverlay } from "@/components/FieldOverlay";
import { Homography, getFieldReferencePoints } from "@/lib/homography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileVideo, Info, Target } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "line" | "triangle" | "text">("select");
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [brushSize, setBrushSize] = useState(3);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });

  // Calibration state
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>("center-circle");
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [showFieldOverlay, setShowFieldOverlay] = useState(true);
  const [homography, setHomography] = useState<number[] | null>(null);
  const [inverseHomography, setInverseHomography] = useState<number[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    setIsCalibrated(false);
    setCalibrationPoints([]);
    setHomography(null);
    setInverseHomography(null);
  };

  // Sync canvas size with video
  useEffect(() => {
    const updateSize = () => {
      if (videoRef.current) {
        setCanvasSize({
          width: videoRef.current.clientWidth,
          height: videoRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", updateSize);
    if (videoSrc) updateSize();
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
      annotations: "",
    };
    setClips((prev) => [...prev, newClip]);
    setSelectedClip(newClip);
    toast.success(`Clip created: ${clipData.name}`);
  };

  const handleClipSelect = (clip: Clip) => {
    setSelectedClip(clip);
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

  const handleClearCanvas = () => canvasRef.current?.clearCanvas();
  const handleDeleteSelected = () => canvasRef.current?.deleteSelected();
  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();

  // Calibration handlers
  const handleCalibrationPointClick = (x: number, y: number) => {
    const newPoint: CalibrationPoint = {
      x,
      y,
      label: `Point ${calibrationPoints.length + 1}`
    };
    setCalibrationPoints(prev => [...prev, newPoint]);
  };

  const handleCalibrationReset = () => {
    setCalibrationPoints([]);
    setIsCalibrated(false);
    setHomography(null);
    setInverseHomography(null);
  };

  const handleCalibrationComplete = () => {
    // Compute homography matrices
    const fieldPoints = getFieldReferencePoints(calibrationMode);
    const imagePoints = calibrationPoints.map(p => ({ x: p.x, y: p.y }));
    
    if (imagePoints.length >= fieldPoints.length) {
      const inverseH = Homography.compute(fieldPoints, imagePoints);
      const forwardH = inverseH ? Homography.invert(inverseH) : null;
      
      if (inverseH && forwardH) {
        setInverseHomography(inverseH);
        setHomography(forwardH);
        setIsCalibrated(true);
        toast.success("Calibration completed! You can now start annotating.");
      } else {
        toast.error("Calibration failed. Please try again with more accurate points.");
      }
    } else {
      toast.error("Not enough calibration points.");
    }
  };

  const handleCalibrationModeChange = (mode: CalibrationMode) => {
    setCalibrationMode(mode);
    setCalibrationPoints([]);
    setIsCalibrated(false);
    setHomography(null);
    setInverseHomography(null);
  };

  // Helper functions for calibration
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
              {/* Video + Canvas Section */}
              <div className="relative">
                <VideoPlayer
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedData={handleVideoLoadedData}
                />
                {/* Calibration Overlay */}
                {!isCalibrated && (
                  <div 
                    className="absolute inset-0 bg-black/30 cursor-crosshair z-20"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      handleCalibrationPointClick(x, y);
                    }}
                  >
                    {/* Calibration Points */}
                    {calibrationPoints.map((point, index) => (
                      <div
                        key={index}
                        className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"
                        style={{ left: point.x, top: point.y }}
                      >
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-primary text-primary-foreground px-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                    
                    {/* Calibration Instructions Overlay */}
                    <div className="absolute top-4 left-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5" />
                        <h3 className="font-semibold">Field Calibration</h3>
                      </div>
                      
                      {/* Mode Selection */}
                      <div className="mb-3">
                        <p className="text-sm mb-2">Camera view:</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={calibrationMode === "away-goal" ? "default" : "outline"}
                            onClick={() => handleCalibrationModeChange("away-goal")}
                            className="text-xs px-2 py-1"
                          >
                            Away Goal
                          </Button>
                          <Button
                            size="sm"
                            variant={calibrationMode === "home-goal" ? "default" : "outline"}
                            onClick={() => handleCalibrationModeChange("home-goal")}
                            className="text-xs px-2 py-1"
                          >
                            Home Goal
                          </Button>
                          <Button
                            size="sm"
                            variant={calibrationMode === "center-circle" ? "default" : "outline"}
                            onClick={() => handleCalibrationModeChange("center-circle")}
                            className="text-xs px-2 py-1"
                          >
                            Center Circle
                          </Button>
                        </div>
                      </div>
                      
                      {/* Current Instruction */}
                      <div className="mb-3">
                        <div className="text-sm">
                          <strong>Step {calibrationPoints.length + 1}:</strong>
                          <br />
                          {getCalibrationInstruction(calibrationMode, calibrationPoints.length)}
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                          Progress: {calibrationPoints.length}/{getRequiredPoints(calibrationMode)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCalibrationReset}
                          disabled={calibrationPoints.length === 0}
                          className="text-xs px-2 py-1"
                        >
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCalibrationComplete}
                          disabled={calibrationPoints.length < getRequiredPoints(calibrationMode)}
                          className="text-xs px-2 py-1"
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              {isCalibrated && (
                <>
                  {/* Match Info Form */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
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
                  <div className="flex items-center justify-between mb-4">
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
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFieldOverlay(!showFieldOverlay)}
                      className="gap-2"
                    >
                      <Target className="h-4 w-4" />
                      {showFieldOverlay ? "Hide" : "Show"} Field
                    </Button>
                  </div>
                </>
              )}

                {/* Field Overlay */}
                <FieldOverlay
                  width={canvasSize.width}
                  height={canvasSize.height}
                  calibrationMode={calibrationMode}
                  calibrationPoints={calibrationPoints}
                  isVisible={showFieldOverlay && isCalibrated}
                />
                
                {/* Drawing Canvas */}
                {isCalibrated && (
                  <div className="absolute inset-0">
                    <DrawingCanvas
                      ref={canvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      activeTool={activeTool}
                      activeColor={activeColor}
                      brushSize={brushSize}
                      homography={homography}
                      inverseHomography={inverseHomography}
                    />
                  </div>
                )}

                {/* Match Overlay */}
                {matchInfo.homeTeam && matchInfo.awayTeam && isCalibrated && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {matchInfo.date} – {matchInfo.homeTeam} vs {matchInfo.awayTeam}
                  </div>
                )}
                {selectedClip?.name && isCalibrated && (
                  <div className="absolute bottom-20 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
                    {selectedClip.name}
                  </div>
                )}
                
                {/* Calibration Status */}
                {isCalibrated && (
                  <div className="absolute top-2 right-2 bg-green-500/80 text-white px-2 py-1 rounded text-xs font-mono">
                    {calibrationMode.toUpperCase()} CALIBRATED
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
