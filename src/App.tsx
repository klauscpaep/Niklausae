import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Play, ExternalLink, ArrowUp, Mail, ShieldAlert,
  Youtube, Instagram, Disc, ChevronRight, Loader2, Sparkles, AlertTriangle
} from "lucide-react";
import { SiteContent, Category } from "./types";
import AdminPanel from "./components/AdminPanel";
import CategoryDetailModal from "./components/CategoryDetailModal";
import parsMaziProfile from "./assets/images/pars_mazi_profile_1784000260155.jpg";
import { fetchSiteContent, saveSiteContent, incrementVisitorCount } from "./firebase";

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor"
    className="inline-block"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.72 4.1 1.13 1.09 2.69 1.63 4.26 1.7v3.92c-1.74-.02-3.47-.48-4.94-1.42-.21-.13-.41-.28-.61-.43-.02 2.62-.01 5.24-.02 7.86-.06 2.37-1.12 4.67-2.98 6.13-2.14 1.69-5.11 2.21-7.72 1.34-2.5-1-4.32-3.37-4.57-6.04-.41-3.62 1.99-7.1 5.58-7.9 1.4-.35 2.89-.13 4.16.59.02 1.48.01 2.96.01 4.44-1.01-.58-2.22-.72-3.32-.36-.93.28-1.7 1.02-1.95 1.96-.39 1.43.34 3.03 1.71 3.59 1.15.5 2.53.25 3.44-.6.54-.53.81-1.27.8-2.02 0-3.32-.01-6.64-.01-9.97.01 0 .01-.01.01-.01z"/>
  </svg>
);

export default function App() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(() => {
    return localStorage.getItem("pars_mazi_loading_text") || "PARS MAZI EDIT PACK yükleniyor...";
  });
  
  // Modals state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch site content & increment visitor count
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);
        
        // Track unique visit first (run transaction)
        const hasVisited = sessionStorage.getItem("has_visited_pars_mazi");
        if (!hasVisited) {
          await incrementVisitorCount();
          sessionStorage.setItem("has_visited_pars_mazi", "true");
        }
        
        // Fetch content directly from Firestore
        const data = await fetchSiteContent() as SiteContent;
        setContent(data);
        if (data?.settings?.loadingText) {
          localStorage.setItem("pars_mazi_loading_text", data.settings.loadingText);
          setLoadingText(data.settings.loadingText);
        }
      } catch (err) {
        console.error(err);
        setError("Veritabanı bağlantısı kurulamadı. Lütfen internetinizi kontrol edin.");
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  // Monitor scroll for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save changes from Admin Panel
  const handleSaveContent = async (updatedContent: SiteContent, passwordToVerify: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (passwordToVerify !== content?.settings.adminPassword) {
        return { success: false, error: "Hatalı yönetici şifresi!" };
      }

      // Preserve visitorCount if not explicitly provided
      const finalContent = {
        ...updatedContent,
        visitorCount: updatedContent.visitorCount !== undefined ? updatedContent.visitorCount : content.visitorCount
      };

      await saveSiteContent(finalContent);
      setContent(finalContent);
      
      if (finalContent.settings?.loadingText) {
        localStorage.setItem("pars_mazi_loading_text", finalContent.settings.loadingText);
        setLoadingText(finalContent.settings.loadingText);
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Veritabanına kaydedilirken hata oluştu." };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-sans gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 size={40} className="text-red-500 animate-spin" />
          <div className="absolute w-12 h-12 rounded-full border border-red-500/20 animate-ping" />
        </div>
        <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">{loadingText}</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl border border-red-500/20 mb-4 animate-bounce">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Sistem Hatası</h3>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl border border-red-500 font-semibold transition-all cursor-pointer"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-300 font-sans selection:bg-red-600 selection:text-white pb-24 relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-red-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-900/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-8 pb-12 space-y-6 relative z-10">
        
        {/* Visitor Counter Header Block */}
        <div className="flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-2 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-black/40 min-w-[160px] text-center"
          >
            <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">TOPLAM ZİYARET</span>
            <span className="text-2xl font-mono font-bold text-white tracking-tight mt-0.5 glow-text-red">
              {content.visitorCount}
            </span>
          </motion.div>
        </div>

        {/* Brand Block */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onDoubleClick={() => setIsAdminOpen(true)}
          className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex items-center justify-center text-center shadow-md relative group cursor-pointer"
          title="Yönetici paneli için çift tıklayın!"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h1 className="text-sm font-mono font-bold text-zinc-400 tracking-[0.25em] uppercase">
            {(() => {
              const text = content.settings.topBarText || "PARS MAZI PACK";
              const words = text.split(" ");
              if (words.length > 1) {
                const lastWord = words.pop();
                return (
                  <>
                    {words.join(" ")}{" "}
                    <span className="text-red-500">{lastWord}</span>
                  </>
                );
              }
              return text;
            })()}
          </h1>
          <Sparkles size={12} className="absolute right-4 text-zinc-700 group-hover:text-red-500 transition-colors" />
        </motion.div>

        {/* Hero Edit Pack Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative p-8 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 border border-zinc-850 rounded-3xl shadow-xl shadow-black/50 overflow-hidden"
        >
          {/* Internal Glow Effects */}
          <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 text-[10px] font-mono text-zinc-400 font-bold rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {content.settings.heroBadge || "AFTER EFFECTS PACKS"}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-display font-extrabold text-white text-center tracking-tight uppercase leading-tight">
            {content.settings.heroTitle || "PARS MAZI EDIT PACK"}
          </h2>

          {/* Premium Accent Line and Nodes */}
          <div className="flex items-center justify-center mt-8 px-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-500/60" />
            <div className="flex items-center gap-2 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 border border-red-500 rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-500/60" />
          </div>
        </motion.div>

        {/* Required Plugins Button (Interactive Module) */}
        <motion.a 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          href={content.settings.pluginUrl}
          target="_blank"
          referrerPolicy="no-referrer"
          className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-red-950/25 to-zinc-950 border-l-[3px] border-l-red-600 border-y border-r border-zinc-900 hover:border-zinc-800 hover:border-l-red-500 rounded-2xl shadow-lg transition-all duration-300 active:scale-99 cursor-pointer overflow-hidden"
        >
          {/* Background overlay on hover */}
          <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="flex items-center gap-4">
            {/* Play Button Icon */}
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
              <Play size={18} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-white group-hover:text-red-400 transition-colors">
                {content.settings.pluginTitle || "Gerekli Pluginler"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {content.settings.pluginDesc || "Kurulum videosunu izle"}
              </p>
            </div>
          </div>
          
          <ExternalLink size={14} className="text-zinc-600 group-hover:text-red-500 transition-colors mr-1" />
        </motion.a>

        {/* Categories (Paket Kütüphanesi) Title Header */}
        <div className="pt-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-wider uppercase">CANLI EFEKT ARŞİVİ</span>
          </div>
          <div className="inline-block px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-full">
            <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">PAKET KÜTÜPHANESİ</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Kategoriler</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            {content.settings.heroSub || "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır."}
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent mx-auto mt-3" />
        </div>

        {/* Categories Grid (Main List) */}
        <div className="space-y-3 pt-2">
          {content.categories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
              onClick={() => setSelectedCategory(category)}
              className={`group relative p-5 bg-gradient-to-r ${category.gradient} border border-zinc-900 hover:scale-[1.01] rounded-2xl shadow-lg transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Corner Ambient Glow */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Number Index */}
                  <span className="font-mono text-zinc-600 font-bold text-sm bg-zinc-950/60 border border-zinc-900 px-2.5 py-1 rounded-xl">
                    {category.index}
                  </span>
                  
                  <div className="space-y-1">
                    {/* Badge Pill */}
                    <span className="inline-block font-mono text-[9px] text-zinc-400 font-bold tracking-wider bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
                      {category.badge}
                    </span>
                    {/* Title */}
                    <h3 className="text-base font-display font-bold text-white group-hover:text-red-400 transition-colors">
                      {category.title}
                    </h3>
                  </div>
                </div>

                {/* Arrow Action Button */}
                <div className="p-2 bg-zinc-950/80 group-hover:bg-red-600/10 border border-zinc-900 group-hover:border-red-500/20 text-zinc-500 group-hover:text-red-400 rounded-xl transition-all">
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Biography Block (Creative Profile) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative mt-8 p-6 bg-zinc-950 border border-zinc-900 rounded-3xl shadow-xl shadow-black/80 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase">
              {content.settings.bioSub || "PARSMAZI / CREATIVE PROFILE"}
            </span>
          </div>

          {/* Profile Picture */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-900 shadow-inner group">
            <img 
              src={content.settings.bioImage || parsMaziProfile} 
              alt="Pars Mazi Portrait" 
              className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 transition-all duration-700"
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest block">
                {content.settings.bioRole || "VIDEO EDITOR • MOTION DESIGNER"}
              </span>
              <span className="text-xl font-display font-black text-white uppercase tracking-tight mt-0.5">
                {content.settings.bioName || "PARS MAZI"}
              </span>
            </div>
          </div>

          {/* Bio Description / Title */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-600 block">01 / CREATOR</span>
            <h3 className="text-2xl font-display font-black text-white tracking-tight uppercase leading-none">
              {content.settings.bioTitle || "BEN KİMİM?"}
            </h3>
            <div className="w-12 h-1 bg-red-600 rounded-full" />
            {content.settings.bioDescription && (
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed whitespace-pre-line">
                {content.settings.bioDescription}
              </p>
            )}
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {content.settings.stats.map((stat, idx) => (
              <div key={idx} className="p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-center space-y-1">
                <span className="text-xl font-mono font-bold text-white block glow-text-red">
                  {stat.value}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 tracking-widest block uppercase font-bold leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Portfolio Main Action Button */}
          <a
            href={content.settings.portfolioUrl}
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-display font-extrabold text-xs tracking-widest text-center uppercase rounded-xl border border-red-500 transition-all active:scale-98 shadow-lg shadow-red-600/10 block cursor-pointer"
          >
            PORTFÖYÜ İNCELE
          </a>

          {/* Social Icons Footer - High Fidelity Design */}
          <div className="pt-4 border-t border-zinc-900">
            <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase block text-center mb-4">SOSYAL MEDYA KANALLARI</span>
            <div className="grid grid-cols-2 gap-3">
              {/* YouTube Card */}
              <a 
                href={content.settings.socialLinks.youtube} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="group relative flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-850 hover:border-red-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-2 bg-red-600/10 group-hover:bg-red-600 text-red-500 group-hover:text-white rounded-xl transition-all duration-300 shadow-md shadow-red-600/0 group-hover:shadow-red-600/20">
                  <Youtube size={16} fill="currentColor" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-red-400 transition-colors">YouTube</span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider">PARS MAZI</span>
                </div>
                <ChevronRight size={12} className="absolute right-3 text-zinc-700 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* Instagram Card */}
              <a 
                href={content.settings.socialLinks.instagram} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="group relative flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-850 hover:border-pink-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-2 bg-pink-600/10 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-pink-600 text-pink-500 group-hover:text-white rounded-xl transition-all duration-300 shadow-md shadow-pink-600/0 group-hover:shadow-pink-600/20">
                  <Instagram size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-pink-400 transition-colors">Instagram</span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider">@parsmazi</span>
                </div>
                <ChevronRight size={12} className="absolute right-3 text-zinc-700 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* Discord Card */}
              <a 
                href={content.settings.socialLinks.discord} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="group relative flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-850 hover:border-blue-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-2 bg-blue-600/10 group-hover:bg-[#5865F2] text-blue-400 group-hover:text-white rounded-xl transition-all duration-300 shadow-md shadow-blue-600/0 group-hover:shadow-blue-600/20">
                  <Disc size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-blue-400 transition-colors">Discord</span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider">SUNUCUYA KATIL</span>
                </div>
                <ChevronRight size={12} className="absolute right-3 text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* TikTok Card */}
              <a 
                href={content.settings.socialLinks.tiktok} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="group relative flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-850 hover:border-cyan-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-2 bg-cyan-600/10 group-hover:bg-zinc-900 text-cyan-400 group-hover:text-pink-500 rounded-xl transition-all duration-300 shadow-md shadow-cyan-600/0 group-hover:shadow-cyan-600/20 flex items-center justify-center">
                  <TikTokIcon size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-cyan-400 transition-colors">TikTok</span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider font-mono">@parsmazi</span>
                </div>
                <ChevronRight size={12} className="absolute right-3 text-zinc-700 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer info & Admin Hidden Portal Trigger */}
        <div className="pt-8 flex flex-col items-center gap-2">
          <p className="text-[10px] text-zinc-600 font-mono text-center">
            © 2026 NIKLAUSAE EDIT PACK. Tüm Hakları Saklıdır.
          </p>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="text-[9px] text-zinc-700 hover:text-red-500 transition-colors font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-zinc-950/40 border border-zinc-900/60 px-2 py-1 rounded"
          >
            <ShieldAlert size={10} />
            Yönetici Girişi
          </button>
        </div>

      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 p-3 bg-zinc-950/90 hover:bg-red-600 hover:text-white border border-zinc-800 hover:border-red-500 text-zinc-400 rounded-xl shadow-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 active:scale-95"
        >
          <ArrowUp size={14} />
          <span className="text-[7px] font-mono font-bold tracking-widest uppercase">YUKARI</span>
        </motion.button>
      )}

      {/* Detailed Pack Category Modal */}
      <CategoryDetailModal 
        category={selectedCategory} 
        onClose={() => setSelectedCategory(null)} 
      />

      {/* Secret Admin Panel Control Overlay */}
      <AdminPanel 
        content={content} 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onSave={handleSaveContent}
      />

    </div>
  );
}
