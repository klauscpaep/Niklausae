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
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative aspect-video w-full overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-900 select-none cursor-ew-resize touch-none ${className}`}
    >
      {/* After Image (Sonrası) - Underneath */}
      <img
        src={afterImage}
        alt="Sonrası"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      {/* Before Image (Öncesi) - Clipped on top */}
      <img
        src={beforeImage}
        alt="Öncesi"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
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
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] border border-zinc-200 pointer-events-none z-15">
          <ChevronsLeftRight size={15} className="text-zinc-950" />
        </div>
      </div>

      {/* Text Labels */}
      <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur border border-zinc-850 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black tracking-wider text-zinc-300 select-none pointer-events-none z-10">
        ÖNCESİ
      </div>
      <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur border border-zinc-850 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black tracking-wider text-red-400 select-none pointer-events-none z-10">
        SONRASI
      </div>
    </div>
  );
}
