import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Film, Layers, ShieldCheck } from "lucide-react";

interface LoadingScreenProps {
  loadingText: string;
  isDataReady: boolean;
  onFinished: () => void;
}

export default function LoadingScreen({ loadingText, isDataReady, onFinished }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [techStep, setTechStep] = useState("Varlıklar taranıyor...");

  // Progress logic: simulates a real cinematic progress load
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateProgress = () => {
      setProgress((prev) => {
        // If data is ready, accelerate to 100%
        if (isDataReady) {
          if (prev >= 100) {
            clearInterval(intervalId);
            // Slight delay before finalizing for transition feel
            setTimeout(() => {
              onFinished();
            }, 300);
            return 100;
          }
          return Math.min(prev + Math.floor(Math.random() * 15) + 8, 100);
        }

        // If data is not yet ready, smoothly climb to 92% and wait
        if (prev >= 92) {
          return 92;
        }
        return prev + Math.floor(Math.random() * 4) + 1;
      });
    };

    intervalId = setInterval(updateProgress, 60);

    return () => clearInterval(intervalId);
  }, [isDataReady, onFinished]);

  // Rotate technical messages based on progress for an immersive edit-pack vibe
  useEffect(() => {
    if (progress < 25) {
      setTechStep("Proje ayarları yapılandırılıyor...");
    } else if (progress < 50) {
      setTechStep("Geçiş efektleri ve SFX veritabanı senkronize ediliyor...");
    } else if (progress < 75) {
      setTechStep("Adobe Premiere & AE önizleme şablonları yükleniyor...");
    } else if (progress < 95) {
      setTechStep("Kreatif varlıklar render ediliyor...");
    } else {
      setTechStep("Sistem hazır! Başlatılıyor...");
    }
  }, [progress]);

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans select-none">
      
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/[0.04] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-600/[0.04] blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Top Header of Preloader */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto relative z-10 border-b border-zinc-900/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase font-black">SYSTEM BOOTING v3.5</span>
        </div>
        <div className="text-[9px] font-mono text-zinc-600">NIKLAUSAE // PORTAL</div>
      </div>

      {/* Center Cinematic Branding and Progress Block */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full text-center space-y-8"
        >
          {/* Logo / Title Area */}
          <div className="space-y-3">
            <motion.h1 
              initial={{ letterSpacing: "0.1em" }}
              animate={{ letterSpacing: "0.35em" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-2xl sm:text-3xl font-display font-black text-white tracking-[0.35em] uppercase text-center pl-[0.35em]"
            >
              NIKLAUSAE
            </motion.h1>
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono tracking-widest text-red-500 font-extrabold uppercase bg-red-500/5 px-4 py-1.5 rounded-full border border-red-500/10 max-w-xs mx-auto">
              <Sparkles size={10} className="text-red-500 animate-pulse" />
              <span>KREATİF EDİT ARCHIVE</span>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="space-y-3.5 max-w-xs sm:max-w-sm mx-auto">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold uppercase px-1">
              <span className="tracking-widest">{loadingText}</span>
              <span className="text-red-400 font-black">{progress}%</span>
            </div>

            {/* The Bar */}
            <div className="h-[4px] bg-zinc-900/90 rounded-full w-full overflow-hidden relative border border-zinc-950">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full relative shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                style={{ width: `${progress}%` }}
                layoutId="loaderBar"
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>

            {/* Simulated terminal step message */}
            <div className="text-[9px] font-mono text-zinc-500 h-4 flex items-center justify-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
              <p className="truncate tracking-wide">{techStep}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Shimmering Layout Skeleton at bottom for context / preview structure */}
      <div className="w-full max-w-6xl mx-auto relative z-10 opacity-35 sm:opacity-45 pointer-events-none mt-auto">
        <div className="border border-zinc-900/60 rounded-3xl p-5 bg-zinc-950/20 backdrop-blur-sm space-y-6">
          
          {/* Skeleton Header bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-900/80 animate-pulse" />
              <div className="space-y-1.5">
                <div className="w-24 h-2.5 bg-zinc-900 animate-pulse rounded" />
                <div className="w-14 h-1.5 bg-zinc-900 animate-pulse rounded" />
              </div>
            </div>
            <div className="w-32 h-8 bg-zinc-900/80 animate-pulse rounded-full" />
          </div>

          {/* Skeleton Bento/Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
            {/* Left side card block skeleton */}
            <div className="md:col-span-5 p-5 bg-zinc-900/30 rounded-2xl border border-zinc-900/40 space-y-4">
              <div className="h-6 w-1/2 bg-zinc-900 animate-pulse rounded-md" />
              <div className="aspect-[4/3] w-full bg-zinc-900/50 animate-pulse rounded-xl" />
              <div className="space-y-2">
                <div className="h-2 w-full bg-zinc-900 animate-pulse rounded" />
                <div className="h-2 w-5/6 bg-zinc-900 animate-pulse rounded" />
              </div>
            </div>

            {/* Right side category rows skeleton */}
            <div className="md:col-span-7 space-y-3">
              <div className="h-4 w-1/4 bg-zinc-900 animate-pulse rounded" />
              <div className="p-4 bg-zinc-900/20 rounded-xl border border-zinc-900/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-900 animate-pulse rounded" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-2.5 bg-zinc-900 animate-pulse rounded" />
                    <div className="w-16 h-1.5 bg-zinc-900 animate-pulse rounded" />
                  </div>
                </div>
                <div className="w-6 h-6 bg-zinc-900/60 animate-pulse rounded" />
              </div>
              <div className="p-4 bg-zinc-900/20 rounded-xl border border-zinc-900/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-900 animate-pulse rounded" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-2.5 bg-zinc-900 animate-pulse rounded" />
                    <div className="w-20 h-1.5 bg-zinc-900 animate-pulse rounded" />
                  </div>
                </div>
                <div className="w-6 h-6 bg-zinc-900/60 animate-pulse rounded" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer credits */}
      <div className="w-full max-w-6xl mx-auto relative z-10 flex items-center justify-between border-t border-zinc-900/40 pt-4 mt-6 text-[8px] font-mono text-zinc-600">
        <div>© 2026 NIKLAUSAE EDIT PACK</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Film size={8} /> VIDEO ENGINES SYNCED</span>
          <span className="flex items-center gap-1"><Layers size={8} /> PRESETS LOADED</span>
        </div>
      </div>

    </div>
  );
}
