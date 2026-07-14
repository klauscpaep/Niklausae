import React, { useState, useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, className = "" }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current || e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={(e) => { isDragging.current = true; handleTouchMove(e); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      className={`relative aspect-video w-full overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-850/60 select-none cursor-ew-resize ${className}`}
    >
      {/* After Image (Sonrası) - Underneath */}
      <img
        src={afterImage}
        alt="Sonrası"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before Image (Öncesi) - Clipped on top */}
      <img
        src={beforeImage}
        alt="Öncesi"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      />

      {/* Vertical Slider Line */}
      <div 
        className="absolute inset-y-0 w-0.5 bg-white/80 backdrop-blur-sm z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl border border-zinc-200/50 pointer-events-none z-15">
          <ChevronsLeftRight size={16} className="text-zinc-900" />
        </div>
      </div>

      {/* Text Labels */}
      <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur border border-zinc-800/80 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold tracking-wider text-zinc-300 select-none pointer-events-none z-10">
        ÖNCESİ
      </div>
      <div className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800/80 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold tracking-wider text-zinc-300 select-none pointer-events-none z-10">
        SONRASI
      </div>
    </div>
  );
}
