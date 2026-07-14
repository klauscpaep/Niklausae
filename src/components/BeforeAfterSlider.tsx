import React, { useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, className = "" }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-850/60 select-none ${className}`}>
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
        }}
      />

      {/* Vertical Slider Line */}
      <div 
        className="absolute inset-y-0 w-0.5 bg-white/80 backdrop-blur-sm z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl border border-zinc-200/50 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform z-15">
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

      {/* Hidden range input covering the entire slider for cross-platform input */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        aria-label="Öncesi Sonrası Karşılaştırma Kaydırıcısı"
      />
    </div>
  );
}
