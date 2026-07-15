import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minimize2, Maximize2, Play, Pause, Volume2, VolumeX, Sparkles, Tv, Move } from "lucide-react";

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
    // Handle YouTube Shorts first
    if (url.includes("/shorts/")) {
      const parts = url.split("/shorts/");
      if (parts[1]) {
        const videoId = parts[1].split(/[?#&]/)[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=1&rel=0`;
      }
    }

    // Handle standard YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=1&rel=0`;
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
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? "200px" : "340px",
          height: isMinimized ? "52px" : "250px"
        }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        drag
        dragMomentum={false}
        dragElastic={0.05}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed bottom-6 right-6 z-50 bg-zinc-950/95 border border-red-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-red-500/50 overflow-hidden flex flex-col backdrop-blur-xl transition-colors select-none"
        id="mini-preview-player"
      >
        {/* Header - Drag Handler */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-900/80 cursor-move">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Move size={11} className="text-zinc-500 shrink-0" />
            <Tv size={12} className="text-red-500 shrink-0 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-zinc-200 truncate uppercase tracking-widest">
              {video.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? "Genişlet" : "Küçült"}
            >
              {isMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Video Player Display */}
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

            {/* Custom On-Hover Controls for direct HTML5 MP4/MOV videos */}
            {!isYouTube && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-10">
                <button
                  onClick={handlePlayPause}
                  className="p-1.5 bg-zinc-900/90 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-all active:scale-95"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-zinc-400 bg-black/55 px-1.5 py-0.5 rounded mr-1">LOCAL VIDEO</span>
                  <button
                    onClick={handleMuteToggle}
                    className="p-1.5 bg-zinc-900/90 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                </div>
              </div>
            )}
            
            {/* Watermark badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] font-mono text-zinc-400 pointer-events-none border border-zinc-850">
              MINI OYNATICI
            </div>
          </div>
        )}

        {/* Minimized bar contents */}
        {isMinimized && (
          <div 
            className="flex-1 flex items-center justify-between px-3.5 py-1 bg-red-600/5 hover:bg-red-600/10 transition-colors cursor-pointer" 
            onClick={() => setIsMinimized(false)}
          >
            <span className="text-[9px] font-black text-red-500 font-mono flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
              <Sparkles size={9} className="animate-spin-slow text-red-500" /> VİDEO ARKADA ÇALIŞIYOR
            </span>
            <span className="text-[8px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-bold">AÇ</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
