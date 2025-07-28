import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Clip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: Clip[];
  onClipCreate: (clip: Omit<Clip, "id">) => void;
  onClipSelect: (clip: Clip) => void;
  selectedClip?: Clip;
  className?: string;
}

export const Timeline = ({
  duration,
  currentTime,
  clips,
  onClipCreate,
  onClipSelect,
  selectedClip,
  className
}: TimelineProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStart, setRecordingStart] = useState(0);
  const [newClipName, setNewClipName] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    if (duration === 0) {
      toast("Please load a video first");
      return;
    }
    
    setIsRecording(true);
    setRecordingStart(currentTime);
    setNewClipName(`Clip ${clips.length + 1}`);
    toast("Started recording clip");
  };

  const stopRecording = () => {
    if (!isRecording) return;
    
    const endTime = currentTime;
    const startTime = recordingStart;
    
    if (endTime <= startTime) {
      toast("Clip must be longer than 0 seconds");
      setIsRecording(false);
      return;
    }

    const newClip = {
      name: newClipName || `Clip ${clips.length + 1}`,
      startTime,
      endTime,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };

    onClipCreate(newClip);
    setIsRecording(false);
    toast(`Created clip: ${newClip.name}`);
  };

  const getClipStyle = (clip: Clip) => {
    if (duration === 0) return {};
    
    const left = (clip.startTime / duration) * 100;
    const width = ((clip.endTime - clip.startTime) / duration) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: clip.color,
    };
  };

  const getCurrentTimeStyle = () => {
    if (duration === 0) return { left: "0%" };
    return { left: `${(currentTime / duration) * 100}%` };
  };

  const getRecordingStyle = () => {
    if (!isRecording || duration === 0) return {};
    
    const left = (recordingStart / duration) * 100;
    const width = ((currentTime - recordingStart) / duration) * 100;
    
    return {
      left: `${left}%`,
      width: `${Math.max(0, width)}%`,
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording, currentTime, recordingStart, newClipName, clips.length]);

  return (
    <div className={cn("bg-timeline-bg border border-border rounded-lg p-4", className)}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isRecording && (
            <Input
              value={newClipName}
              onChange={(e) => setNewClipName(e.target.value)}
              placeholder="Clip name..."
              className="w-32 h-8"
            />
          )}
          
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-1"
          >
            {isRecording ? (
              <>
                <Scissors className="h-4 w-4" />
                Stop (R)
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Clip (R)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="relative">
        {/* Time markers */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i}>{formatTime((duration * i) / 10)}</span>
          ))}
        </div>

        {/* Timeline Track */}
        <div
          ref={timelineRef}
          className="relative h-16 bg-muted rounded border border-border overflow-hidden"
        >
          {/* Existing Clips */}
          {clips.map((clip) => (
            <div
              key={clip.id}
              className={cn(
                "absolute top-0 h-full rounded cursor-pointer transition-all",
                "border-2 hover:brightness-110",
                selectedClip?.id === clip.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-transparent"
              )}
              style={getClipStyle(clip)}
              onClick={() => onClipSelect(clip)}
            >
              <div className="p-1 text-xs font-medium text-white truncate">
                {clip.name}
              </div>
            </div>
          ))}

          {/* Recording Clip Preview */}
          {isRecording && (
            <div
              className="absolute top-0 h-full bg-clip-active/70 border-2 border-clip-active rounded animate-pulse"
              style={getRecordingStyle()}
            >
              <div className="p-1 text-xs font-medium text-white">
                Recording...
              </div>
            </div>
          )}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 w-0.5 h-full bg-primary z-20 transition-all duration-100"
            style={getCurrentTimeStyle()}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Clips List */}
      {clips.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Clips ({clips.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                  selectedClip?.id === clip.id 
                    ? "bg-primary/20 border border-primary" 
                    : "bg-muted hover:bg-muted/80"
                )}
                onClick={() => onClipSelect(clip)}
              >
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: clip.color }}
                />
                <span className="flex-1 text-sm font-medium">{clip.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClipSelect(clip);
                  }}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
