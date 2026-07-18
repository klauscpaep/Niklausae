import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, AlertTriangle, CheckCircle, Info, AlertCircle, X, ExternalLink, 
  Heart, Pin, Calendar, Flame, Gift, Youtube, Disc, Tv, Sparkles 
} from "lucide-react";
import { SiteContent, Announcement } from "../types";

interface AnnouncementsListProps {
  content?: SiteContent;
  onSaveContent?: (updatedContent: SiteContent) => Promise<void>;
  announcements?: Announcement[]; // Fallback support
}

// Sparkle sound synthesizer for liking an announcement
const playLikeSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq: number, delay: number, vol = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    };
    
    // Sparkly ascending arpeggio
    playTone(523.25, 0);       // C5
    playTone(659.25, 0.08);    // E5
    playTone(783.99, 0.16);    // G5
    playTone(987.77, 0.24);    // B5
    playTone(1174.66, 0.32);   // D6
  } catch (e) {
    console.warn("Audio Context failed to play like sound:", e);
  }
};

export default function AnnouncementsList({ content, onSaveContent, announcements = [] }: AnnouncementsListProps) {
  const finalAnnouncements = content?.announcements || announcements || [];

  // Session-based dismiss list so users can hide read announcements
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("kreatif_dismissed_announcements");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track liked announcements in localStorage so they can only like once
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("kreatif_liked_announcements");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissAnnouncement = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem("kreatif_dismissed_announcements", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (id: string) => {
    if (likedIds.includes(id)) return; // Already liked
    
    playLikeSound();
    const updatedLikes = [...likedIds, id];
    setLikedIds(updatedLikes);
    try {
      localStorage.setItem("kreatif_liked_announcements", JSON.stringify(updatedLikes));
    } catch (e) {
      console.error(e);
    }

    if (content && onSaveContent) {
      const updatedAnnouncements = (content.announcements || []).map((ann) => {
        if (ann.id === id) {
          return { ...ann, likes: (ann.likes || 0) + 1 };
        }
        return ann;
      });

      try {
        await onSaveContent({
          ...content,
          announcements: updatedAnnouncements
        });
      } catch (err) {
        console.error("Failed to save announcement likes:", err);
      }
    }
  };

  // Filter & Sort Announcements
  const now = new Date();
  const activeAnnouncements = finalAnnouncements
    .filter((ann) => {
      // 1. Must be active
      if (!ann.active) return false;
      
      // 2. Must not be dismissed by current session
      if (dismissedIds.includes(ann.id)) return false;

      // 3. Expiry Date Check
      if (ann.expiryDate) {
        const exp = new Date(ann.expiryDate);
        if (exp < now) return false; // Expired
      }

      // 4. Scheduled Publish Check
      if (ann.publishAt) {
        const pub = new Date(ann.publishAt);
        if (pub > now) return false; // Not yet published
      }

      return true;
    })
    .sort((a, b) => {
      // Sort pinned announcements to top, then by createdAt desc
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      
      if (aPinned !== bPinned) {
        return bPinned - aPinned; // Pinned first
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (activeAnnouncements.length === 0) return null;

  // Icon selector based on type or custom selection
  const getIcon = (ann: Announcement) => {
    if (ann.customIcon) {
      switch (ann.customIcon) {
        case "megaphone":
          return <Megaphone size={18} className="text-rose-500 shrink-0" />;
        case "flame":
          return <Flame size={18} className="text-orange-500 shrink-0 animate-pulse" />;
        case "gift":
          return <Gift size={18} className="text-amber-500 shrink-0" />;
        case "youtube":
          return <Youtube size={18} className="text-red-500 shrink-0" />;
        case "disc":
          return <Disc size={18} className="text-blue-400 shrink-0 animate-spin-slow" />;
        case "sparkles":
          return <Sparkles size={18} className="text-yellow-400 shrink-0 animate-pulse" />;
        case "tv":
          return <Tv size={18} className="text-cyan-400 shrink-0" />;
        case "info":
          return <Info size={18} className="text-indigo-400 shrink-0" />;
        case "warning":
          return <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
        case "success":
          return <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
        case "danger":
          return <AlertCircle size={18} className="text-red-500 shrink-0" />;
      }
    }

    // Fallback to type icons
    switch (ann.type) {
      case "warning":
        return <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
      case "success":
        return <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
      case "danger":
        return <AlertCircle size={18} className="text-red-500 shrink-0" />;
      case "info":
        return <Info size={18} className="text-blue-400 shrink-0" />;
      case "announcement":
      default:
        return <Megaphone size={18} className="text-rose-500 shrink-0 animate-bounce" />;
    }
  };

  // Border/gradient selector based on type
  const getTypeClasses = (ann: Announcement) => {
    if (ann.pinned) {
      return {
        bg: "bg-gradient-to-r from-yellow-500/10 via-zinc-950/95 to-amber-500/5",
        border: "border-yellow-500/40 hover:border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.06)]",
        glow: "bg-gradient-to-b from-yellow-500 to-amber-500",
        badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      };
    }

    switch (ann.type) {
      case "warning":
        return {
          bg: "bg-gradient-to-r from-amber-500/10 via-zinc-950/90 to-amber-500/5",
          border: "border-amber-500/20 hover:border-amber-500/30",
          glow: "bg-amber-500/20",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        };
      case "success":
        return {
          bg: "bg-gradient-to-r from-emerald-500/10 via-zinc-950/90 to-emerald-500/5",
          border: "border-emerald-500/20 hover:border-emerald-500/30",
          glow: "bg-emerald-500/20",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        };
      case "danger":
        return {
          bg: "bg-gradient-to-r from-red-500/10 via-zinc-950/90 to-red-500/5",
          border: "border-red-500/20 hover:border-red-500/30",
          glow: "bg-red-500/20",
          badge: "bg-red-500/10 text-red-400 border-red-500/20"
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-500/10 via-zinc-950/90 to-blue-500/5",
          border: "border-blue-500/20 hover:border-blue-500/30",
          glow: "bg-blue-500/20",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        };
      case "announcement":
      default:
        return {
          bg: "bg-gradient-to-r from-red-600/10 via-zinc-950/90 to-amber-600/5",
          border: "border-red-500/20 hover:border-red-500/30",
          glow: "bg-red-500/20",
          badge: "bg-red-500/10 text-red-400 border-red-500/20"
        };
    }
  };

  return (
    <div className="space-y-4 w-full">
      <AnimatePresence>
        {activeAnnouncements.map((ann, index) => {
          const classes = getTypeClasses(ann);
          const isLiked = likedIds.includes(ann.id);
          
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`p-5 md:p-6 ${classes.bg} border ${classes.border} rounded-2xl md:rounded-[24px] shadow-xl shadow-black/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative overflow-hidden group`}
            >
              {/* Left-side decorative glow strip */}
              <div className={`absolute top-0 left-0 w-[4px] h-full ${classes.glow} filter blur-[0.5px] z-10`} />

              {/* Animated background particles for pinned announcements */}
              {ann.pinned && (
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
              )}
              
              <div className="flex flex-col md:flex-row items-start gap-4.5 flex-1 min-w-0">
                {/* Visual Icon Box */}
                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-2xl shrink-0 self-start md:self-center">
                  {getIcon(ann)}
                </div>

                {/* Announcement Content */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.pinned && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[8px] font-mono font-black tracking-widest rounded-md uppercase flex items-center gap-1 shrink-0 animate-pulse">
                        <Pin size={8} className="rotate-45" /> SABİTLENMİŞ
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                      {ann.pinned ? "ÖNEMLİ DUYURU" : "GÜNCELLEME DUYURUSU"}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {new Date(ann.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-display font-black text-white uppercase tracking-tight leading-snug">
                    {ann.title}
                  </h4>
                  
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans whitespace-pre-wrap max-w-3xl">
                    {ann.message}
                  </p>

                  {/* Expiring tag display if present */}
                  {ann.expiryDate && (
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-zinc-500">
                      <Calendar size={10} />
                      <span>Geçerlilik Tarihi: {new Date(ann.expiryDate).toLocaleDateString("tr-TR")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Image Support */}
              {ann.imageUrl && (
                <div className="relative aspect-[16/9] md:w-32 md:h-[72px] rounded-xl overflow-hidden border border-zinc-850/80 shrink-0 shadow-lg select-none group-hover:scale-102 transition-transform duration-300">
                  <img 
                    src={ann.imageUrl} 
                    alt="Duyuru Görseli" 
                    className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}

              {/* Actions Stack: Link + Reactions + Dismiss */}
              <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2.5 shrink-0 justify-end md:justify-center pt-3 md:pt-0 border-t md:border-t-0 border-zinc-900/60 md:border-none self-stretch md:self-auto">
                
                {/* Like / Reaction Counter */}
                <button
                  onClick={() => handleLike(ann.id)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-extrabold transition-all flex items-center gap-2 active:scale-90 cursor-pointer select-none ${
                    isLiked 
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                      : "bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-900 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400"
                  }`}
                  title={isLiked ? "Zaten beğendiniz" : "Beğen"}
                >
                  <Heart size={14} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
                  <span>{ann.likes || 0}</span>
                </button>

                {ann.linkUrl && (
                  <a
                    href={ann.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 border border-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer select-none grow md:grow-0 text-center justify-center"
                  >
                    <span>{ann.linkText || "İncele"}</span>
                    <ExternalLink size={12} className="text-white/80" />
                  </a>
                )}
                
                <button
                  onClick={() => dismissAnnouncement(ann.id)}
                  className="p-2.5 text-zinc-600 hover:text-white bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer select-none active:scale-95 shrink-0"
                  title="Kapat"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
