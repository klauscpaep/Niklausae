import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minimize2, Maximize2, Play, Pause, Volume2, VolumeX, Sparkles, Tv } from "lucide-react";

interface MiniPlayerProps {
  video: { id: string; name: string; url: string } | null;
  onClose: () => void;
}

export default function MiniPlayer({ video, onClose }: MiniPlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (video) {
      setIsMinimized(false);
      setIsPlaying(true);
    }
  }, [video]);

  if (!video) return null;

  const isYouTube = video.url.includes("youtube.com") || video.url.includes("youtu.be");

  const getEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${match[2]}&controls=1`;
    }
    return url;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          x: 0,
          width: isMinimized ? "180px" : "320px",
          height: isMinimized ? "48px" : "240px"
        }}
        exit={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-6 right-6 z-50 bg-zinc-950/95 border border-zinc-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col backdrop-blur-md"
        id="mini-preview-player"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 border-b border-zinc-900/80 select-none">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Tv size={12} className="text-red-500 shrink-0 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-zinc-300 truncate uppercase tracking-wider">
              {video.name}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-md transition-colors cursor-pointer"
              title={isMinimized ? "Genişlet" : "Simge Durumuna Getir"}
            >
              {isMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={10} />
            </button>
          </div>
        </div>

        {/* Video Area */}
        {!isMinimized && (
          <div className="flex-1 bg-black relative group flex items-center justify-center overflow-hidden">
            {isYouTube ? (
              <iframe
                src={getEmbedUrl(video.url)}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={video.url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Custom overlays for raw videos */}
            {!isYouTube && (
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                <button
                  onClick={handlePlayPause}
                  className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg cursor-pointer"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg cursor-pointer"
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minimized Quick Info */}
        {isMinimized && (
          <div className="flex-1 flex items-center justify-between px-3 py-1 bg-red-600/5 hover:bg-red-600/10 transition-colors cursor-pointer" onClick={() => setIsMinimized(false)}>
            <span className="text-[9px] font-bold text-red-400 font-mono flex items-center gap-1">
              <Sparkles size={10} className="animate-spin-slow" /> OYNATILIYOR...
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">Tıkla aç</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
