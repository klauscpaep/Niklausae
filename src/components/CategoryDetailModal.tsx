import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Download, FileArchive, ArrowUpRight, HelpCircle, Maximize2, 
  Video, Image as ImageIcon, Play, Sparkles, Filter, Eye, ListFilter,
  CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { Category, EditPackItem } from "../types";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface CategoryDetailModalProps {
  category: Category | null;
  onClose: () => void;
  onPlayVideo?: (video: { id: string; name: string; url: string }) => void;
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

export default function CategoryDetailModal({ category, onClose, onPlayVideo }: CategoryDetailModalProps) {
  // Store tab selection (image comparison vs. video preview) for each item
  const [activeTabs, setActiveTabs] = useState<Record<string, "image" | "video">>({});
  // Lightbox view for full-screen comparison/video
  const [lightboxItem, setLightboxItem] = useState<EditPackItem | null>(null);
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "preview" | "download">("all");

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

  // Filter items in real time
  const filteredItems = useMemo(() => {
    if (!category) return [];
    return category.items.filter(item => {
      // Name or description search match
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Type filters
      const hasBeforeAfter = !!(item.previewBefore && item.previewAfter);
      const hasSingleImage = !hasBeforeAfter && !!(item.previewBefore || item.previewAfter);
      const hasVideo = !!item.previewVideo;
      const hasAnyPreview = hasBeforeAfter || hasVideo || hasSingleImage;

      if (filterType === "preview") return hasAnyPreview;
      if (filterType === "download") return !hasAnyPreview;
      return true;
    });
  }, [category, searchTerm, filterType]);

  return (
    <AnimatePresence>
      {category && (
        <div className="fixed inset-0 z-45 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          {/* Backdrop Click */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-850 rounded-3xl shadow-[0_0_80px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col max-h-[92vh] z-10"
          >
            {/* Ambient Background Glow matching category gradient color */}
            <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b ${category.gradient.split(" ")[0]} opacity-25 blur-3xl pointer-events-none`} />

            {/* Header */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-red-500 font-black bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                  {category.index} • {category.badge}
                </span>
                <h3 className="text-xl font-display font-black text-white tracking-tight uppercase">
                  {category.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-900">
                  {category.items.length} Dosya Mevcut
                </span>
                <button 
                  onClick={onClose}
                  className="p-2.5 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-xl border border-zinc-850 transition-all cursor-pointer"
                  title="Kapat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Description Area & Filters */}
            <div className="relative px-6 py-4 bg-zinc-900/20 border-b border-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  {category.description || "Bu paket altındaki tüm premium dosyaları aşağıdan hızlıca indirebilir, canlı olarak karşılaştırabilirsiniz."}
                </p>
              </div>

              {/* In-Room Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-wider transition-all ${
                      filterType === "all" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    HEPSİ
                  </button>
                  <button
                    onClick={() => setFilterType("preview")}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-wider transition-all flex items-center gap-1 ${
                      filterType === "preview" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Eye size={10} />
                    <span>ÖNİZLEMELİ</span>
                  </button>
                  <button
                    onClick={() => setFilterType("download")}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-wider transition-all flex items-center gap-1 ${
                      filterType === "download" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Download size={10} />
                    <span>DİREKT LİNK</span>
                  </button>
                </div>

                <input 
                  type="text" 
                  placeholder="Dosya ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none transition-all w-28 sm:w-36"
                />
              </div>
            </div>

            {/* Item List Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-2xl text-zinc-500 mb-3">
                    <FileArchive size={24} className="animate-pulse text-zinc-500" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-300">Herhangi bir dosya bulunamadı</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    {searchTerm ? "Yazdığınız kelimeyle eşleşen içerik bulunamadı." : "Bu filtrede gösterilecek içerik bulunmuyor."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const hasBeforeAfter = !!(item.previewBefore && item.previewAfter);
                  const hasSingleImage = !hasBeforeAfter && !!(item.previewBefore || item.previewAfter);
                  const hasVideo = !!item.previewVideo;
                  const hasAnyPreview = hasBeforeAfter || hasVideo || hasSingleImage;
                  const activeTab = getActiveTab(item);

                  if (hasAnyPreview) {
                    // Render rich interactive comparison/video item
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                        className="group relative bg-zinc-900/10 border border-zinc-900 hover:border-red-500/20 rounded-3xl p-5 flex flex-col gap-4 transition-all"
                      >
                        {/* Interactive Tab Switcher & Preview Container */}
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950 shadow-inner">
                          {/* Tabs (If both media types exist) */}
                          {(hasBeforeAfter || hasSingleImage) && hasVideo && (
                            <div className="absolute top-3 right-3 z-30 flex bg-black/90 backdrop-blur border border-zinc-800 p-1 rounded-xl shadow-lg">
                              <button
                                onClick={() => handleToggleTab(item.id, "image")}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                  activeTab === "image" 
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/10" 
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                <ImageIcon size={10} />
                                <span>GÖRSEL</span>
                              </button>
                              <button
                                onClick={() => handleToggleTab(item.id, "video")}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                  activeTab === "video" 
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/10" 
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                <Video size={10} />
                                <span>VİDEO</span>
                              </button>
                            </div>
                          )}

                          {/* Render comparison slider, single image or video player */}
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
                                  preload="auto"
                                  className="w-full h-full absolute inset-0 object-cover"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom Information and Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-display font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">
                                {item.name}
                              </h4>
                              {item.status === "new" && (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest shadow-[0_0_12px_rgba(16,185,129,0.15)] select-none animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>YENİ</span>
                                </span>
                              )}
                              {item.status === "updated" && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.15)] select-none animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  <span>GÜNCELLENDİ</span>
                                </span>
                              )}
                              <span className="font-mono text-[9px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-2.5 py-0.5 rounded-lg">
                                {item.size}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Mini Player Picture-in-Picture Button */}
                            {hasVideo && onPlayVideo && (
                              <button
                                onClick={() => onPlayVideo({ id: item.id, name: item.name, url: item.previewVideo! })}
                                className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-500/35 text-red-500 hover:text-red-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-black tracking-wider"
                                title="Mini Pencerede Oynat (Sitede Gezinirken İzle)"
                              >
                                <Play size={11} fill="currentColor" />
                                <span>MİNİ İZLE</span>
                              </button>
                            )}

                            {/* Fullscreen Lightbox Button */}
                            <button
                              onClick={() => setLightboxItem(item)}
                              className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Tam Ekran Karşılaştır / İzle"
                            >
                              <Maximize2 size={14} />
                            </button>
                            
                            {/* Download Button */}
                            <a
                              href={item.downloadUrl}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-red-600/10 group-hover:shadow-red-600/20"
                            >
                              <span>İNDİR</span>
                              <Download size={13} className="transition-transform group-hover:translate-y-0.5" />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Default compact style if no preview is set
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      className="group relative p-4 bg-zinc-900/30 border border-zinc-900 hover:border-red-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-2 bg-zinc-900 text-red-500 rounded-xl group-hover:bg-red-500/10 group-hover:text-red-400 border border-zinc-850 transition-all">
                            <FileArchive size={14} />
                          </span>
                          <h4 className="text-sm font-display font-bold text-white group-hover:text-red-400 transition-colors uppercase">
                            {item.name}
                          </h4>
                          {item.status === "new" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.12)] select-none">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                              <span>YENİ</span>
                            </span>
                          )}
                          {item.status === "updated" && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.12)] select-none">
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                              <span>GÜNCELLENDİ</span>
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                            {item.size}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-10 leading-relaxed max-w-xl">
                          {item.description || "Bu dosya için ek bir açıklama girilmemiştir."}
                        </p>
                      </div>

                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="self-end sm:self-auto px-4 py-2.5 bg-zinc-900 hover:bg-red-600 border border-zinc-800 hover:border-red-500 text-xs font-bold text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                      >
                        <span>İndir</span>
                        <Download size={13} className="transition-transform group-hover:translate-y-0.5" />
                      </a>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Status */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 select-none font-mono">
              <HelpCircle size={11} className="text-red-500 animate-pulse" /> 
              Tüm linkler reklamsız ve şifresiz olarak doğrudan indirme sağlar. Keyifli editlemeler dileriz!
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Modal (Full Screen comparison / video) */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/98 backdrop-blur-2xl">
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxItem(null)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-900 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10 max-h-[92vh]"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
              <div>
                <h4 className="text-base font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>{lightboxItem.name}</span> 
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                    {lightboxItem.size}
                  </span>
                </h4>
                {lightboxItem.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 max-w-xl font-mono">
                    {lightboxItem.description}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setLightboxItem(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-850 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 sm:p-8 flex items-center justify-center bg-black/50 overflow-hidden min-h-[45vh] max-h-[72vh] relative">
              {getActiveTab(lightboxItem) === "image" && lightboxItem.previewBefore && lightboxItem.previewAfter ? (
                <div className="w-full h-full max-h-[64vh] flex flex-col items-center justify-center gap-4">
                  <BeforeAfterSlider 
                    beforeImage={lightboxItem.previewBefore} 
                    afterImage={lightboxItem.previewAfter}
                    className="w-full max-h-[58vh] aspect-video object-contain"
                  />
                </div>
              ) : getActiveTab(lightboxItem) === "image" && (lightboxItem.previewBefore || lightboxItem.previewAfter) ? (
                <img 
                  src={lightboxItem.previewBefore || lightboxItem.previewAfter} 
                  alt={lightboxItem.name} 
                  className="max-w-full max-h-[64vh] object-contain rounded-2xl border border-zinc-900"
                  referrerPolicy="no-referrer"
                />
              ) : lightboxItem.previewVideo ? (
                <div className="w-full h-full max-h-[64vh] aspect-video rounded-2xl overflow-hidden border border-zinc-900 bg-black shadow-inner">
                  {lightboxItem.previewVideo.includes("youtube.com") || lightboxItem.previewVideo.includes("youtu.be") ? (
                    <iframe
                      src={getEmbedUrl(lightboxItem.previewVideo) || ""}
                      className="w-full h-full rounded-none border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video 
                      src={lightboxItem.previewVideo} 
                      controls 
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 font-mono text-xs">Önizleme yüklenemedi.</div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center gap-4">
              <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 select-none">
                <Sparkles size={12} className="text-red-500 animate-pulse" /> 
                {lightboxItem.previewBefore && lightboxItem.previewAfter 
                  ? "Sürgüyü parmağınız veya fareniz ile kaydırarak öncesi/sonrası değişimini detaylı inceleyebilirsiniz." 
                  : "Canlı Önizleme Görüntüsü."
                }
              </span>
              <a
                href={lightboxItem.downloadUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-red-600/15 tracking-wider font-mono shrink-0"
              >
                <span>DOSYAYI İNDİR ({lightboxItem.size})</span>
                <Download size={13} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
