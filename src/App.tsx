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
import { fetchSiteContent, saveSiteContent, incrementVisitorCount, subscribeToSiteContent } from "./firebase";

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

  // Fetch site content & increment visitor count with real-time sync
  useEffect(() => {
    let isMounted = true;
    
    // Track unique visit first (run transaction once)
    const hasVisited = sessionStorage.getItem("has_visited_pars_mazi");
    if (!hasVisited) {
      incrementVisitorCount();
      sessionStorage.setItem("has_visited_pars_mazi", "true");
    }
    
    setIsLoading(true);
    
    const unsubscribe = subscribeToSiteContent(
      (data) => {
        if (!isMounted) return;
        setContent(data as SiteContent);
        if (data?.settings?.loadingText) {
          localStorage.setItem("pars_mazi_loading_text", data.settings.loadingText);
          setLoadingText(data.settings.loadingText);
        }
        setIsLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        console.error("Real-time content subscription error:", err);
        setError("Veritabanı bağlantısı kurulamadı. Lütfen internetinizi kontrol edin.");
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
    <div className="min-h-screen bg-[#060608] text-zinc-300 font-sans selection:bg-red-600 selection:text-white pb-24 relative overflow-hidden">
      
      {/* Cyberpunk Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />

      {/* Ambient Decorative Lighting Gradients */}
      <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] rounded-full bg-red-950/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-purple-950/5 blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8 relative z-10">
        
        {/* Top Brand & Visitor Counter Header Bar */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-950/55 backdrop-blur-md border border-zinc-900/80 rounded-3xl shadow-xl shadow-black/40">
          {/* Brand Logo Trigger */}
          <div 
            onDoubleClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-3 group cursor-pointer"
            title="Yönetici paneli için çift tıklayın!"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-display font-black text-lg shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform duration-300">
              P
            </div>
            <div>
              <h1 className="text-sm font-mono font-bold text-zinc-300 tracking-[0.2em] uppercase flex items-center gap-1.5">
                {(() => {
                  const text = content.settings.topBarText || "PARS MAZI PACK";
                  const words = text.split(" ");
                  if (words.length > 1) {
                    const lastWord = words.pop();
                    return (
                      <>
                        {words.join(" ")}{" "}
                        <span className="text-red-500 font-extrabold glow-text-red">{lastWord}</span>
                      </>
                    );
                  }
                  return text;
                })()}
              </h1>
              <span className="text-[9px] font-mono font-medium text-zinc-500 tracking-wider">CREATIVE RESOURCE ARCHIVE</span>
            </div>
          </div>

          {/* Visitor Counter */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 px-5 py-2 bg-zinc-900/40 border border-zinc-850/60 rounded-2xl shadow-inner"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="text-left leading-none">
              <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-widest uppercase block">ZİYARETÇİ</span>
              <span className="text-base font-mono font-black text-white mt-0.5 block tracking-tight">
                {content.visitorCount}
              </span>
            </div>
          </motion.div>
        </header>

        {/* Dashboard Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Hero Card, Creator Profile, Stats, Social Channels) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative p-8 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-zinc-850/80 rounded-3xl shadow-2xl overflow-hidden group sweep-effect"
            >
              {/* Internal Glow Effects */}
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span className="px-3.5 py-1.5 bg-zinc-950/80 border border-zinc-850 text-[10px] font-mono text-zinc-400 font-bold rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
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
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-500/60" />
              </div>
            </motion.div>

            {/* Biography & Creator Profile */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative p-6 bg-zinc-950/90 border border-zinc-900 rounded-3xl shadow-2xl space-y-6 overflow-hidden"
            >
              {/* Subtle Decorative Light Leak */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase">
                    {content.settings.bioSub || "PARSMAZI / CREATIVE PROFILE"}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-600">ID: #01</span>
              </div>

              {/* Profile Picture with high-fidelity effects */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-zinc-900 shadow-2xl group cursor-pointer">
                <img 
                  src={content.settings.bioImage || parsMaziProfile} 
                  alt="Pars Mazi Portrait" 
                  className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 ease-out"
                />
                {/* Sleek shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                
                {/* Floating text badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-[9px] font-mono font-black text-red-500 tracking-widest block uppercase">
                    {content.settings.bioRole || "VIDEO EDITOR • MOTION DESIGNER"}
                  </span>
                  <span className="text-xl font-display font-black text-white uppercase tracking-tight mt-0.5 block glow-text-red">
                    {content.settings.bioName || "PARS MAZI"}
                  </span>
                </div>
              </div>

              {/* Bio Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-display font-black text-white tracking-wider uppercase leading-none flex items-center gap-2">
                  <Sparkles size={14} className="text-red-500" />
                  {content.settings.bioTitle || "BEN KİMİM?"}
                </h3>
                <div className="w-10 h-[1.5px] bg-red-600 rounded-full" />
                {content.settings.bioDescription && (
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed whitespace-pre-line bg-zinc-900/20 p-3.5 rounded-xl border border-zinc-900/50">
                    {content.settings.bioDescription}
                  </p>
                )}
              </div>

              {/* Bento Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {content.settings.stats.map((stat, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl text-center space-y-1 hover:border-red-950/50 transition-colors">
                    <span className="text-lg font-mono font-extrabold text-white block glow-text-red">
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
            </motion.div>

            {/* Social Channels Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative p-5 bg-zinc-950/90 border border-zinc-900 rounded-3xl shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase block">SOSYAL MEDYA KANALLARI</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                {/* YouTube Card */}
                <a 
                  href={content.settings.socialLinks.youtube} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="group relative flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-red-600/30 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-1.5 bg-red-600/10 group-hover:bg-red-600 text-red-500 group-hover:text-white rounded-lg transition-all duration-300">
                    <Youtube size={14} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-white block group-hover:text-red-400 transition-colors">YouTube</span>
                    <span className="text-[8px] text-zinc-500 font-mono truncate block">
                      {content.settings.socialHandles?.youtube || "PARS MAZI"}
                    </span>
                  </div>
                </a>

                {/* Instagram Card */}
                <a 
                  href={content.settings.socialLinks.instagram} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="group relative flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-pink-600/30 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-1.5 bg-pink-600/10 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-pink-600 text-pink-500 group-hover:text-white rounded-lg transition-all duration-300">
                    <Instagram size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-white block group-hover:text-pink-400 transition-colors">Instagram</span>
                    <span className="text-[8px] text-zinc-500 font-mono truncate block">
                      {content.settings.socialHandles?.instagram || "@parsmazi"}
                    </span>
                  </div>
                </a>

                {/* Discord Card */}
                <a 
                  href={content.settings.socialLinks.discord} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="group relative flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-blue-600/30 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-1.5 bg-blue-600/10 group-hover:bg-[#5865F2] text-blue-400 group-hover:text-white rounded-lg transition-all duration-300">
                    <Disc size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-white block group-hover:text-blue-400 transition-colors">Discord</span>
                    <span className="text-[8px] text-zinc-500 font-mono truncate block">
                      {content.settings.socialHandles?.discord || "KATIL"}
                    </span>
                  </div>
                </a>

                {/* TikTok Card */}
                <a 
                  href={content.settings.socialLinks.tiktok} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="group relative flex items-center gap-2.5 p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-cyan-600/30 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-1.5 bg-cyan-600/10 group-hover:bg-zinc-900 text-cyan-400 group-hover:text-pink-500 rounded-lg transition-all duration-300 flex items-center justify-center">
                    <TikTokIcon size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-white block group-hover:text-cyan-400 transition-colors">TikTok</span>
                    <span className="text-[8px] text-zinc-500 font-mono truncate block">
                      {content.settings.socialHandles?.tiktok || "@parsmazi"}
                    </span>
                  </div>
                </a>
              </div>
            </motion.div>

          </div>

          {/* Right Column (Plugins, Categories Library) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Required Plugins Button */}
            <motion.a 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              href={content.settings.pluginUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-red-950/20 to-zinc-950 border-l-[3px] border-l-red-600 border-y border-r border-zinc-900/80 hover:border-zinc-800 hover:border-l-red-500 rounded-2xl shadow-lg transition-all duration-300 active:scale-99 cursor-pointer overflow-hidden"
            >
              {/* Background overlay on hover */}
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="flex items-center gap-4">
                {/* Play Button Icon */}
                <div className="p-3.5 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform duration-300">
                  <Play size={18} fill="currentColor" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-red-500 tracking-widest font-bold block uppercase mb-0.5">SİSTEM GEREKSİNİMLERİ</span>
                  <h3 className="text-sm font-display font-bold text-white group-hover:text-red-400 transition-colors">
                    {content.settings.pluginTitle || "Gerekli Pluginler"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {content.settings.pluginDesc || "Kurulum videosunu izle"}
                  </p>
                </div>
              </div>
              
              <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl group-hover:border-red-500/20 text-zinc-500 group-hover:text-red-400 transition-colors">
                <ExternalLink size={13} />
              </div>
            </motion.a>

            {/* Categories Section Header */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-wider uppercase">CANLI ARŞİV KÜTÜPHANESİ</span>
              </div>
              <h2 className="text-2xl font-display font-extrabold text-white tracking-tight uppercase">Kategoriler / Odalar</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {content.settings.heroSub || "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır."}
              </p>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 gap-3.5">
              {content.categories.map((category, idx) => {
                const itemCount = category.items?.length || 0;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + idx * 0.05 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`group relative p-5 bg-gradient-to-r ${category.gradient} border border-zinc-900/80 hover:border-zinc-800 hover:scale-[1.01] rounded-2xl shadow-xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    {/* Decorative Corner Glow */}
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        {/* Number Index */}
                        <span className="font-mono text-zinc-400 font-bold text-xs bg-zinc-950/85 border border-zinc-900 px-3 py-1.5 rounded-xl group-hover:border-red-500/25 group-hover:text-red-400 transition-colors">
                          {category.index}
                        </span>
                        
                        <div className="space-y-1">
                          {/* Badge Pill Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-block font-mono text-[9px] text-zinc-400 font-bold tracking-wider bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
                              {category.badge}
                            </span>
                            
                            {/* Dynamic Item/File count Badge */}
                            <span className="inline-block font-mono text-[9px] text-red-400 font-extrabold tracking-wider bg-red-950/20 px-2 py-0.5 rounded border border-red-950/30">
                              {itemCount} PAKET
                            </span>
                          </div>
                          {/* Title */}
                          <h3 className="text-base font-display font-extrabold text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">
                            {category.title}
                          </h3>
                        </div>
                      </div>

                      {/* Arrow Action Button */}
                      <div className="p-2.5 bg-zinc-950/80 group-hover:bg-red-600 text-zinc-500 group-hover:text-white border border-zinc-900 group-hover:border-red-500/30 rounded-xl transition-all duration-300">
                        <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="pt-8 flex flex-col items-center gap-2 border-t border-zinc-900/60 mt-12">
          <p className="text-[10px] text-zinc-600 font-mono text-center">
            © 2026 NIKLAUSAE EDIT PACK. Tüm Hakları Saklıdır.
          </p>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="text-[9px] text-zinc-700 hover:text-red-500 transition-colors font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-zinc-950/40 border border-zinc-900/60 px-2.5 py-1.5 rounded-lg"
          >
            <ShieldAlert size={10} />
            Yönetici Girişi
          </button>
        </footer>

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
