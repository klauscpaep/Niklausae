import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Heart, Download, Play, FileArchive, ImageIcon, Video, Maximize2, Sparkles, Search, Trash2 
} from "lucide-react";
import { SiteContent, Category, EditPackItem } from "../types";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SiteContent;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlayVideo: (video: { id: string; name: string; url: string }) => void;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube Shorts check
  if (url.includes("/shorts/")) {
    const parts = url.split("/shorts/");
    if (parts[1]) {
      const videoId = parts[1].split(/[?#&]/)[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0`;
    }
  }
  
  // YouTube standard match
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}&rel=0`;
  }
  
  return url;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  content,
  favorites,
  onToggleFavorite,
  onPlayVideo
}: FavoritesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabs, setActiveTabs] = useState<Record<string, "image" | "video">>({});

  // Helper to determine active tab for an item
  const getActiveTab = (item: EditPackItem) => {
    if (activeTabs[item.id]) return activeTabs[item.id];
    if (item.previewBefore || item.previewAfter) return "image";
    if (item.previewVideo) return "video";
    return "image";
  };

  const handleToggleTab = (itemId: string, tab: "image" | "video") => {
    setActiveTabs(prev => ({ ...prev, [itemId]: tab }));
  };

  // Find all items that are currently favorited
  const favoritedItems = useMemo(() => {
    const list: { item: EditPackItem; category: Category }[] = [];
    content.categories.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (favorites.includes(item.id)) {
            const matchesSearch = 
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (matchesSearch) {
              list.push({ item, category });
            }
          }
        });
      }
    });
    return list;
  }, [content, favorites, searchTerm]);

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
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0c0d12] border border-zinc-900/95 rounded-[32px] shadow-[0_24px_80px_rgba(239,68,68,0.08)] overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Top accent neon line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-600 via-red-600 to-amber-500" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-zinc-900/85 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-850/60 transition-all cursor-pointer z-20"
          >
            <X size={15} />
          </button>

          {/* Scrollable Content wrapper */}
          <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto flex flex-col">
            {/* Header section */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/25 text-pink-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                <Heart size={11} className="fill-current animate-pulse text-pink-500" /> FAVORİ PAKETLERİM ({favorites.length})
              </div>
              <h3 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">
                Hızlı Erişim Odası
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Beğendiğiniz, sık kullandığınız veya daha sonra indirmek istediğiniz tüm After Effects araç ve kaynakları.
              </p>
            </div>

            {/* Search Bar (Only show if there are favorites) */}
            {favorites.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Favorilerinizde ara (Dosya adı, kategori veya açıklama)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#050608] hover:bg-[#07090c] focus:bg-zinc-950 border border-zinc-850 focus:border-pink-500/50 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Favorites List Container */}
            <div className="space-y-4 flex-1">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center flex-1 my-auto">
                  <div className="p-5 bg-zinc-900/40 border border-zinc-850 rounded-full text-pink-500/30 mb-4 animate-bounce">
                    <Heart size={32} className="text-pink-500/30 fill-none" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-300">Henüz favori eklemediniz</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mt-2 leading-relaxed">
                    Arşivimizdeki paketlerden beğendiklerinizin yanındaki kalp simgesine tıklayarak buraya ekleyebilir, her seferinde aramadan hızlıca indirebilirsiniz!
                  </p>
                </div>
              ) : favoritedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <h4 className="text-sm font-bold text-zinc-400">Aranan kriterde favori bulunamadı</h4>
                  <p className="text-xs text-zinc-600 mt-1">
                    Yazdığınız kelimeyle eşleşen favori öğe bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoritedItems.map(({ item, category }) => {
                    const hasBeforeAfter = !!(item.previewBefore && item.previewAfter);
                    const hasSingleImage = !hasBeforeAfter && !!(item.previewBefore || item.previewAfter);
                    const hasVideo = !!item.previewVideo;
                    const hasAnyPreview = hasBeforeAfter || hasVideo || hasSingleImage;
                    const activeTab = getActiveTab(item);

                    return (
                      <div
                        key={item.id}
                        className="group relative p-4 bg-[#050609] hover:bg-zinc-950/40 border border-zinc-900/80 hover:border-pink-500/20 rounded-2xl transition-all duration-300 flex flex-col gap-4 overflow-hidden"
                      >
                        {/* Hover glow line */}
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 via-pink-600/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Top Info Header */}
                        <div className="flex items-start justify-between gap-3 relative z-10">
                          <div className="flex gap-3">
                            <div className="p-2.5 bg-zinc-900/90 border border-zinc-850 rounded-xl text-pink-500 shrink-0">
                              <FileArchive size={15} />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                                  {category.title}
                                </span>
                                <span className="font-mono text-[8px] text-zinc-400 bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 rounded">
                                  {item.size}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-200 group-hover:text-pink-400 transition-colors uppercase truncate">
                                {item.name}
                              </h4>
                            </div>
                          </div>

                          {/* Heart Toggle */}
                          <button
                            onClick={() => onToggleFavorite(item.id)}
                            className="p-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 hover:text-pink-400 rounded-xl border border-pink-500/20 transition-all cursor-pointer select-none"
                            title="Favorilerden Çıkar"
                          >
                            <Heart size={14} className="fill-current" />
                          </button>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-zinc-400 pl-1 leading-relaxed relative z-10">
                            {item.description}
                          </p>
                        )}

                        {/* Mini preview container if has previews */}
                        {hasAnyPreview && (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 shadow-inner">
                            {/* Tabs if both exist */}
                            {(hasBeforeAfter || hasSingleImage) && hasVideo && (
                              <div className="absolute top-2 right-2 z-20 flex bg-black/90 backdrop-blur border border-zinc-850 p-0.5 rounded-lg shadow-lg">
                                <button
                                  onClick={() => handleToggleTab(item.id, "image")}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                    activeTab === "image" ? "bg-pink-600 text-white" : "text-zinc-400"
                                  }`}
                                >
                                  <ImageIcon size={8} />
                                  <span>GÖRSEL</span>
                                </button>
                                <button
                                  onClick={() => handleToggleTab(item.id, "video")}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                    activeTab === "video" ? "bg-pink-600 text-white" : "text-zinc-400"
                                  }`}
                                >
                                  <Video size={8} />
                                  <span>VİDEO</span>
                                </button>
                              </div>
                            )}

                            {activeTab === "image" && hasBeforeAfter && (
                              <BeforeAfterSlider 
                                beforeImage={item.previewBefore!} 
                                  afterImage={item.previewAfter!}
                                  className="w-full h-full rounded-none border-none"
                              />
                            )}

                            {activeTab === "image" && hasSingleImage && (
                              <img 
                                src={item.previewBefore || item.previewAfter} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            )}

                            {activeTab === "video" && hasVideo && (
                              <div className="w-full h-full relative">
                                {item.previewVideo!.includes("youtube.com") || item.previewVideo!.includes("youtu.be") ? (
                                  <iframe
                                    src={getEmbedUrl(item.previewVideo!) || ""}
                                    className="w-full h-full absolute inset-0 rounded-none border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video 
                                    src={item.previewVideo} 
                                    controls 
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full absolute inset-0 object-cover"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-end gap-2 relative z-10 pt-1 border-t border-zinc-900/60">
                          {hasVideo && onPlayVideo && (
                            <button
                              onClick={() => onPlayVideo({ id: item.id, name: item.name, url: item.previewVideo! })}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-pink-500 hover:text-pink-400 rounded-lg font-mono text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <Play size={9} fill="currentColor" />
                              <span>İZLE</span>
                            </button>
                          )}

                          <a
                            href={item.downloadUrl}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-[9px] font-black font-mono tracking-wider rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-pink-600/10"
                          >
                            <span>DİREKT İNDİR</span>
                            <Download size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
