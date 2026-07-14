import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileArchive, ArrowUpRight, HelpCircle } from "lucide-react";
import { Category } from "../types";

interface CategoryDetailModalProps {
  category: Category | null;
  onClose: () => void;
}

export default function CategoryDetailModal({ category, onClose }: CategoryDetailModalProps) {
  return (
    <AnimatePresence>
      {category && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
          >
            {/* Ambient Background Glow matching category gradient color */}
            <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${category.gradient.split(" ")[0]} opacity-30 blur-2xl pointer-events-none`} />

            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                  {category.index} • {category.badge}
                </span>
                <h3 className="text-xl font-display font-bold text-white tracking-tight">
                  {category.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {category.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 bg-zinc-900 rounded-2xl text-zinc-600 mb-3">
                    <FileArchive size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">Henüz Dosya Yüklenmemiş</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">Yönetici panelinden bu odaya paket dosyaları ve indirme linkleri ekleyebilirsiniz.</p>
                </div>
              ) : (
                category.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative p-4 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    {/* Item Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-zinc-900 text-red-500 rounded-lg group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
                          <FileArchive size={14} />
                        </span>
                        <h4 className="text-sm font-display font-bold text-white group-hover:text-red-400 transition-colors">
                          {item.name}
                        </h4>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                          {item.size}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-8 leading-relaxed max-w-md">
                        {item.description || "Herhangi bir açıklama girilmemiş."}
                      </p>
                    </div>

                    {/* Download Button */}
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
                ))
              )}
            </div>

            {/* Footer Status */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
              <HelpCircle size={10} /> Linkler güvenli indirme sunucularında barındırılmaktadır. Şifresiz ve reklamsızdır.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
