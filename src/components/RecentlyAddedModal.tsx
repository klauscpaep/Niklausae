import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Download, Play, Film, Layers, Zap } from "lucide-react";
import { SiteContent, Category, EditPackItem } from "../types";

interface RecentlyAddedModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SiteContent;
  onPlayVideo: (video: { id: string; name: string; url: string }) => void;
}

export default function RecentlyAddedModal({
  isOpen,
  onClose,
  content,
  onPlayVideo
}: RecentlyAddedModalProps) {
  
  // Collect recently added items
  // An item is "recent" if its status is "new" or "updated", or we fall back to the most recent items
  const getRecentItems = (): { item: EditPackItem; category: Category }[] => {
    const list: { item: EditPackItem; category: Category }[] = [];
    
    // First, try to get items with status === "new" or "updated"
    content.categories.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.status === "new" || item.status === "updated") {
            list.push({ item, category });
          }
        });
      }
    });

    // If we don't have enough explicitly flagged items, collect the last 2 items from each category
    if (list.length < 3) {
      content.categories.forEach(category => {
        if (category.items && category.items.length > 0) {
          // Take the last 2 items (most recently added/created in the array)
          const sliceCount = Math.min(category.items.length, 2);
          const recentInCat = category.items.slice(-sliceCount);
          recentInCat.forEach(item => {
            // Avoid duplicates
            if (!list.some(existing => existing.item.id === item.id)) {
              list.push({ item, category });
            }
          });
        }
      });
    }

    return list.slice(0, 8); // return top 8 items max
  };

  const recentItems = getRecentItems();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0c0d12] border border-zinc-900/90 rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10"
        >
          {/* Top subtle red/orange neon bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-orange-500 to-purple-600" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-850/60 hover:border-zinc-800 transition-all cursor-pointer z-20 animate-pulse"
          >
            <X size={15} />
          </button>

          <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Header section */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles size={11} className="animate-spin" /> Son Eklenenler / Güncellemeler
              </div>
              <h3 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">
                Yenilikleri Keşfet
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Son 7 gün içinde arşive eklenen veya güncellenen en popüler After Effects efekt ve kurgu araçları.
              </p>
            </div>

            {/* Recent Items List */}
            <div className="space-y-3.5 pt-1">
              {recentItems.length > 0 ? (
                recentItems.map(({ item, category }) => (
                  <div
                    key={item.id}
                    className="group relative p-4 bg-[#050609] hover:bg-zinc-950/80 border border-zinc-900/80 hover:border-zinc-800 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
                  >
                    {/* Hover Glow Spot */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="flex items-start gap-3.5 relative z-10">
                      {/* Icon representation depending on category */}
                      <div className="p-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-red-400 group-hover:text-red-500 group-hover:border-red-500/20 transition-all duration-300 shrink-0">
                        {category.title.toUpperCase().includes("TWIXTOR") ? (
                          <Film size={16} />
                        ) : category.title.toUpperCase().includes("COLOR") ? (
                          <Zap size={16} />
                        ) : (
                          <Layers size={16} />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                            {category.title}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                            {item.status === "updated" ? "GÜNCELLENDİ" : "YENİ"}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors uppercase truncate">
                          {item.name}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {item.description || "After Effects için özel kurgu preset dosyası."}
                        </p>
                      </div>
                    </div>

                    {/* Download & Play Actions */}
                    <div className="flex items-center gap-2 sm:self-center self-end shrink-0 relative z-10">
                      {/* Preview Button if exists */}
                      {item.previewVideo && (
                        <button
                          onClick={() => onPlayVideo({ id: item.id, name: item.name, url: item.previewVideo! })}
                          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-850 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Play size={10} fill="currentColor" />
                          <span>İZLE</span>
                        </button>
                      )}

                      {/* Download Link */}
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md shadow-red-600/10"
                      >
                        <Download size={10} />
                        <span>İNDİR</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border border-dashed border-zinc-900 rounded-3xl text-center space-y-2">
                  <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Henüz yeni öge yok</p>
                  <p className="text-zinc-600 text-xs">Arşivdeki tüm ögeleri kategoriler kısmından inceleyebilirsiniz.</p>
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl border border-zinc-900 font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
