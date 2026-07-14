import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileArchive, ArrowUpRight, HelpCircle, Maximize2, Video, Image as ImageIcon, Play, Sparkles } from "lucide-react";
import { Category, EditPackItem } from "../types";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface CategoryDetailModalProps {
  category: Category | null;
  onClose: () => void;
  onPlayVideo?: (video: { id: string; name: string; url: string }) => void;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube match
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}`;
  }
  
  return url;
}

export default function CategoryDetailModal({ category, onClose, onPlayVideo }: CategoryDetailModalProps) {
  // Store tab selection (image comparison vs. video preview) for each item
  const [activeTabs, setActiveTabs] = useState<Record<string, "image" | "video">>({});
  // Lightbox view for full-screen comparison/video
  const [lightboxItem, setLightboxItem] = useState<EditPackItem | null>(null);

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

  return (
    <AnimatePresence>
      {category && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Ambient Background Glow matching category gradient color */}
            <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${category.gradient.split(" ")[0]} opacity-30 blur-3xl pointer-events-none`} />

            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                  {category.index} • {category.badge}
                </span>
                <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">
                  {category.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-850 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Description Panel */}
            <div className="relative px-6 py-4 bg-zinc-900/10 border-b border-zinc-900/50">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {category.description || "Bu paket altındaki tüm dosyaları aşağıdan hızlıca indirebilirsiniz."}
              </p>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {category.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-3 bg-zinc-900 rounded-2xl text-zinc-600 mb-3">
                    <FileArchive size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">Henüz Dosya Yüklenmemiş</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">Yönetici panelinden bu odaya paket dosyaları, öncesi/sonrası resimleri ve indirme linkleri ekleyebilirsiniz.</p>
                </div>
              ) : (
                category.items.map((item, idx) => {
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
                        transition={{ delay: idx * 0.05 }}
                        className="group relative bg-zinc-900/10 border border-zinc-900 hover:border-zinc-850 rounded-3xl p-5 flex flex-col gap-4 transition-all"
                      >
                        {/* Interactive Tab Switcher & Preview Container */}
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-850/50 bg-zinc-950">
                          {/* Tabs (If both media types exist) */}
                          {(hasBeforeAfter || hasSingleImage) && hasVideo && (
                            <div className="absolute top-3 right-3 z-30 flex bg-zinc-950/80 backdrop-blur border border-zinc-800/80 p-1 rounded-xl">
                              <button
                                onClick={() => handleToggleTab(item.id, "image")}
                                className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                  activeTab === "image" 
                                    ? "bg-red-500 text-white" 
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                <ImageIcon size={10} />
                                <span>GÖRSEL</span>
                              </button>
                              <button
                                onClick={() => handleToggleTab(item.id, "video")}
                                className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                  activeTab === "video" 
                                    ? "bg-red-500 text-white" 
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
                                  className="w-full h-full absolute inset-0 object-cover"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Fallback if somehow tab is image but no image is set, but has video */}
                          {activeTab === "image" && !hasBeforeAfter && !hasSingleImage && hasVideo && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-500">
                              <Play size={32} className="text-zinc-700 animate-pulse" />
                            </div>
                          )}
                        </div>

                        {/* Bottom Information and Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-display font-black text-white group-hover:text-red-400 transition-colors uppercase">
                                {item.name}
                              </h4>
                              {item.status === "new" && (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest shadow-[0_0_12px_rgba(16,185,129,0.15)] select-none animate-pulse">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                                  <span>YENİ</span>
                                </span>
                              )}
                              {item.status === "updated" && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.15)] select-none animate-pulse">
                                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                                  <span>GÜNCELLENDİ</span>
                                </span>
                              )}
                              <span className="font-mono text-[9px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-lg">
                                {item.size}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Mini Player Picture-in-Picture Button */}
                            {hasVideo && onPlayVideo && (
                              <button
                                onClick={() => onPlayVideo({ id: item.id, name: item.name, url: item.previewVideo! })}
                                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider"
                                title="Mini Pencerede Oynat (Sitede Gezinirken İzle)"
                              >
                                <Play size={11} fill="currentColor" />
                                <span>MİNİ İZLE</span>
                              </button>
                            )}

                            {/* Fullscreen Button */}
                            <button
                              onClick={() => setLightboxItem(item)}
                              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Tam Ekran Karşılaştır / İzle"
                            >
                              <Maximize2 size={14} />
                            </button>
                            
                            {/* Download Button */}
                            <a
                              href={item.downloadUrl}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-red-600/10 group-hover:shadow-red-600/20"
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
                      transition={{ delay: idx * 0.05 }}
                      className="group relative p-4 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1.5 bg-zinc-900 text-red-500 rounded-lg group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
                            <FileArchive size={14} />
                          </span>
                          <h4 className="text-sm font-display font-bold text-white group-hover:text-red-400 transition-colors uppercase">
                            {item.name}
                          </h4>
                          {item.status === "new" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-extrabold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.12)] select-none animate-pulse">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                              <span>YENİ</span>
                            </span>
                          )}
                          {item.status === "updated" && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-extrabold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.12)] select-none animate-pulse">
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                              <span>GÜNCELLENDİ</span>
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                            {item.size}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-8 leading-relaxed max-w-md">
                          {item.description || "Herhangi bir açıklama girilmemiş."}
                        </p>
                      </div>

                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="self-end sm:self-auto px-4 py-2 bg-zinc-900 hover:bg-red-600 border border-zinc-800 hover:border-red-500 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md group-hover:shadow-red-600/5 cursor-pointer"
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
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1 select-none">
              <HelpCircle size={10} /> Linkler güvenli indirme sunucularında barındırılmaktadır. Şifresiz ve reklamsızdır.
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Modal (Full Screen comparison / video) */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl">
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxItem(null)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
              <div>
                <h4 className="text-base font-display font-black text-white uppercase tracking-wide">
                  {lightboxItem.name} <span className="text-xs font-normal text-zinc-400 font-mono">({lightboxItem.size})</span>
                </h4>
                {lightboxItem.description && (
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 max-w-xl">
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
            <div className="flex-1 p-4 sm:p-6 flex items-center justify-center bg-black/40 overflow-hidden min-h-[40vh] max-h-[70vh]">
              {getActiveTab(lightboxItem) === "image" && lightboxItem.previewBefore && lightboxItem.previewAfter ? (
                <BeforeAfterSlider 
                  beforeImage={lightboxItem.previewBefore} 
                  afterImage={lightboxItem.previewAfter}
                  className="w-full max-h-[60vh] aspect-video object-contain"
                />
              ) : getActiveTab(lightboxItem) === "image" && (lightboxItem.previewBefore || lightboxItem.previewAfter) ? (
                <img 
                  src={lightboxItem.previewBefore || lightboxItem.previewAfter} 
                  alt={lightboxItem.name} 
                  className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-zinc-900"
                  referrerPolicy="no-referrer"
                />
              ) : lightboxItem.previewVideo ? (
                <div className="w-full h-full max-h-[60vh] aspect-video rounded-2xl overflow-hidden border border-zinc-900">
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
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 font-mono text-xs">Önizleme bulunamadı.</div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 select-none">
                <Sparkles size={11} className="text-red-500" /> {lightboxItem.previewBefore && lightboxItem.previewAfter ? "Sürgüyü kaydırarak etki farkını inceleyebilirsiniz." : "Görsel önizlemesi."}
              </span>
              <a
                href={lightboxItem.downloadUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-red-600/10"
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
