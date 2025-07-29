import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, MessageSquare, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TacticalInsight {
  id: string;
  type: "tactical" | "player" | "movement";
  text: string;
  timestamp: number;
  position: { x: number; y: number };
}

interface TacticalOverlayProps {
  currentTime: number;
  onAddInsight?: (insight: Omit<TacticalInsight, "id">) => void;
  insights?: TacticalInsight[];
  className?: string;
}

export const TacticalOverlay = ({ 
  currentTime, 
  onAddInsight, 
  insights = [], 
  className 
}: TacticalOverlayProps) => {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0 });
  const [selectedType, setSelectedType] = useState<"tactical" | "player" | "movement">("tactical");

  // Get insights for current time (within 2 second window)
  const currentInsights = insights.filter(insight => 
    Math.abs(insight.timestamp - currentTime) < 2
  );

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setInputPosition({ x, y });
      setShowInput(true);
    }
  };

  const handleAddInsight = () => {
    if (!inputText.trim()) return;
    
    onAddInsight?.({
      type: selectedType,
      text: inputText.trim(),
      timestamp: currentTime,
      position: inputPosition
    });
    
    setInputText("");
    setShowInput(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "player": return <Target className="h-3 w-3" />;
      case "movement": return <TrendingUp className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "player": return "bg-red-500/90";
      case "movement": return "bg-green-500/90"; 
      default: return "bg-blue-500/90";
    }
  };

  return (
    <div 
      className={cn("absolute inset-0 pointer-events-auto", className)}
      onClick={handleContainerClick}
    >
      {/* Current Time Insights */}
      {currentInsights.map((insight) => (
        <div
          key={insight.id}
          className={cn(
            "absolute max-w-xs px-3 py-2 text-white text-sm font-medium rounded-lg shadow-lg pointer-events-none",
            "animate-fade-in border border-white/20",
            getInsightColor(insight.type)
          )}
          style={{
            left: `${insight.position.x}px`,
            top: `${insight.position.y}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <div className="flex items-start gap-2">
            {getInsightIcon(insight.type)}
            <span>{insight.text}</span>
          </div>
        </div>
      ))}

      {/* Input Dialog */}
      {showInput && (
        <div 
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${inputPosition.x}px`,
            top: `${inputPosition.y}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <Card className="p-3 min-w-[280px] shadow-xl border-primary/20">
            <div className="space-y-3">
              {/* Type Selection */}
              <div className="flex gap-1">
                {[
                  { type: "tactical" as const, label: "Tactical", icon: MessageSquare },
                  { type: "player" as const, label: "Player", icon: Target },
                  { type: "movement" as const, label: "Movement", icon: TrendingUp }
                ].map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="flex-1 h-8 text-xs gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Text Input */}
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Add tactical insight..."
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleAddInsight();
                    if (e.key === "Escape") setShowInput(false);
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddInsight}
                  className="h-8 px-3"
                  disabled={!inputText.trim()}
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInput(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scoreboard Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-sm border border-white/20">
          <div className="flex items-center gap-4">
            <span>16:00</span>
            <span className="text-blue-400">BAR</span>
            <span className="text-2xl font-bold">0</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-2xl font-bold">0</span>
            <span className="text-green-400">BET</span>
          </div>
        </div>
      </div>
    </div>
  );
};