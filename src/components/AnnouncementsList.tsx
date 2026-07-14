import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, AlertTriangle, CheckCircle, Info, AlertCircle, X, ExternalLink, ArrowRight 
} from "lucide-react";
import { Announcement } from "../types";

interface AnnouncementsListProps {
  announcements?: Announcement[];
}

export default function AnnouncementsList({ announcements = [] }: AnnouncementsListProps) {
  // Session-based dismiss list so users can hide read announcements
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("kreatif_dismissed_announcements");
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

  const activeAnnouncements = announcements.filter(
    (ann) => ann.active && !dismissedIds.includes(ann.id)
  );

  if (activeAnnouncements.length === 0) return null;

  // Icon selector based on type
  const getIcon = (type: string) => {
    switch (type) {
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
  const getTypeClasses = (type: string) => {
    switch (type) {
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
    <div className="space-y-3.5 w-full">
      <AnimatePresence>
        {activeAnnouncements.map((ann, index) => {
          const classes = getTypeClasses(ann.type);
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`p-4 md:p-5 ${classes.bg} border ${classes.border} rounded-2xl md:rounded-3xl shadow-xl shadow-black/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group`}
            >
              {/* Left-side subtle glow light */}
              <div className={`absolute top-0 left-0 w-[3px] h-full ${classes.glow} filter blur-[1px]`} />
              
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {getIcon(ann.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">
                      DUYURU
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {new Date(ann.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <h4 className="text-sm font-display font-black text-white uppercase tracking-tight leading-snug">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {ann.message}
                  </p>
                </div>
              </div>

              {/* Action and Dismiss Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end md:justify-start pt-1 md:pt-0 border-t md:border-t-0 border-zinc-900/60 md:border-none">
                {ann.linkUrl && (
                  <a
                    href={ann.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer select-none"
                  >
                    <span>{ann.linkText || "İncele"}</span>
                    <ExternalLink size={12} className="text-zinc-500 group-hover:text-white" />
                  </a>
                )}
                
                <button
                  onClick={() => dismissAnnouncement(ann.id)}
                  className="p-2 text-zinc-600 hover:text-white bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-pointer select-none active:scale-95"
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
