import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, ExternalLink, ArrowUp, Mail,
  Youtube, Instagram, Disc, ChevronRight, Loader2, Sparkles, AlertTriangle,
  FolderOpen, FileCheck, X, Lock, Unlock, ArrowRight, MessageSquare,
  Sun, Moon, MoreHorizontal, Palette, Sliders, Scissors, Volume2, Type, Film, Zap
} from "lucide-react";
import { SiteContent, Category } from "./types";
import AdminPanel from "./components/AdminPanel";
import CategoryDetailModal from "./components/CategoryDetailModal";
import AnnouncementsList from "./components/AnnouncementsList";
import FeedbackModal from "./components/FeedbackModal";
import RecentlyAddedModal from "./components/RecentlyAddedModal";
import NewsletterForm from "./components/NewsletterForm";
import LoadingScreen from "./components/LoadingScreen";
import MiniPlayer from "./components/MiniPlayer";
import defaultProfileImg from "./assets/images/pars_mazi_profile_1784000260155.jpg";
import goldenPolyBg from "./assets/images/golden_poly_bg_1784006785795.jpg";
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

// High-Fidelity Web Audio Synthesizer for Theme Transitions
const playThemeSound = (isToDark: boolean) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (isToDark) {
      // Night mode: Resonant sub-bass warm drop & star twinkles
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.65);
      
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.65);
      filter.Q.setValueAtTime(3, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.7);

      // Star chime echo (D6 -> A6)
      const playBell = (freq: number, delay: number) => {
        const oscB = ctx.createOscillator();
        const gainB = ctx.createGain();
        oscB.type = "sine";
        oscB.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gainB.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gainB.gain.linearRampToValueAtTime(0.04, ctx.currentTime + delay + 0.05);
        gainB.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);
        oscB.connect(gainB);
        gainB.connect(ctx.destination);
        oscB.start(ctx.currentTime + delay);
        oscB.stop(ctx.currentTime + delay + 0.5);
      };
      
      playBell(1174.66, 0.05); // D6
      playBell(1760.00, 0.18); // A6
    } else {
      // Day mode: Sparkling positive sunrise chime (C major 7 arpeggio ascending)
      const playPluck = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000, ctx.currentTime + delay);
        filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + delay + 0.1);
        
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.05);
      };

      playPluck(523.25, 0, 0.4);       // C5
      playPluck(659.25, 0.06, 0.4);    // E5
      playPluck(783.99, 0.12, 0.4);    // G5
      playPluck(1046.50, 0.18, 0.5);   // C6
    }
  } catch (e) {
    console.warn("Audio context failed to start:", e);
  }
};

// Dynamic helper to map category titles to highly intuitive, custom visual SVG icons
const getCategoryIcon = (title: string, customIcon?: string, size = 24, className = "") => {
  if (customIcon) {
    const c = customIcon.toLowerCase();
    if (c === "palette") return <Palette size={size} className={className} />;
    if (c === "zap") return <Zap size={size} className={className} />;
    if (c === "sliders") return <Sliders size={size} className={className} />;
    if (c === "scissors") return <Scissors size={size} className={className} />;
    if (c === "volume2") return <Volume2 size={size} className={className} />;
    if (c === "type") return <Type size={size} className={className} />;
    if (c === "film") return <Film size={size} className={className} />;
    if (c === "folder" || c === "folderopen") return <FolderOpen size={size} className={className} />;
    if (c === "sparkles") return <Sparkles size={size} className={className} />;
  }

  const t = title.toLowerCase();
  if (t.includes("renk") || t.includes("cc") || t.includes("color")) {
    return <Palette size={size} className={className} />;
  }
  if (t.includes("shake") || t.includes("sarsıntı")) {
    return <Zap size={size} className={className} />;
  }
  if (t.includes("twixtor") || t.includes("slow") || t.includes("yavaş") || t.includes("hız")) {
    return <Sliders size={size} className={className} />;
  }
  if (t.includes("geçiş") || t.includes("transition")) {
    return <Scissors size={size} className={className} />;
  }
  if (t.includes("ses") || t.includes("sfx") || t.includes("sound")) {
    return <Volume2 size={size} className={className} />;
  }
  if (t.includes("font") || t.includes("yazı")) {
    return <Type size={size} className={className} />;
  }
  if (t.includes("overlay") || t.includes("kaplama") || t.includes("film")) {
    return <Film size={size} className={className} />;
  }
  if (t.includes("proje") || t.includes("project") || t.includes("aep")) {
    return <FolderOpen size={size} className={className} />;
  }
  return <Sparkles size={size} className={className} />;
};

export default function App() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaderFinished, setIsLoaderFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(() => {
    return localStorage.getItem("kreatif_loading_text") || "KREATİF EDİT PACK yükleniyor...";
  });

  // Appearance Theme state (Gece / Gündüz)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("kreatif_theme");
    return saved !== "false"; // Default to dark mode (Gece)
  });

  useEffect(() => {
    localStorage.setItem("kreatif_theme", isDarkMode ? "true" : "false");
  }, [isDarkMode]);

  // Design-system theme styles
  const t = {
    bg: isDarkMode ? "bg-[#0e0e12]" : "bg-[#f4f5f8]",
    text: isDarkMode ? "text-zinc-200" : "text-zinc-800",
    textMuted: isDarkMode ? "text-zinc-400" : "text-zinc-600",
    textMutedMore: isDarkMode ? "text-zinc-500" : "text-zinc-400",
    cardBg: isDarkMode ? "bg-zinc-950/90 border-zinc-900" : "bg-white border-zinc-200 shadow-sm",
    cardBgTransparent: isDarkMode ? "bg-zinc-950/55 border-zinc-900/80" : "bg-white/80 border-zinc-200/80 shadow-lg",
    innerCardBg: isDarkMode ? "bg-zinc-900/40 border-zinc-900" : "bg-zinc-50 border-zinc-200/40",
    border: isDarkMode ? "border-zinc-900/80" : "border-zinc-200/80",
    titleText: isDarkMode ? "text-white" : "text-zinc-900",
    modalBg: isDarkMode ? "bg-[#0c0d12]" : "bg-white",
    btnBorder: isDarkMode ? "border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white" : "border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900",
  };
  
  // Modals state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ id: string; name: string; url: string } | null>(null);

  // Floating Suggestion Button auto-reveal sequence states
  const [showFeedbackText, setShowFeedbackText] = useState(false);
  const [isFeedbackHovered, setIsFeedbackHovered] = useState(false);

  // Trigger floating suggestion button text expansion after 5.5s, then collapse after 4.5s
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowFeedbackText(true);
      const hideTimer = setTimeout(() => {
        setShowFeedbackText(false);
      }, 4500); // show text for 4.5 seconds
      return () => clearTimeout(hideTimer);
    }, 5500); // wait 5.5 seconds before showing

    return () => clearTimeout(showTimer);
  }, []);

  // Maintenance Bypass States
  const [isBypassed, setIsBypassed] = useState(() => sessionStorage.getItem("admin_maintenance_bypass") === "true");
  const [maintenancePassword, setMaintenancePassword] = useState("");
  const [maintenanceError, setMaintenanceError] = useState("");
  const [showMaintenanceAuth, setShowMaintenanceAuth] = useState(false);

  // Toast notifications state
  interface ToastMessage {
    id: string;
    title: string;
    message: string;
    type: "success" | "info" | "new_package";
  }
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: "success" | "info" | "new_package") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const prevContentRef = useRef<SiteContent | null>(null);

  // Compare database updates in real-time to alert user about new files/packages
  useEffect(() => {
    if (!content) return;

    if (!prevContentRef.current) {
      // First load: initialize reference to current categories/items and do not trigger toast
      prevContentRef.current = content;
      return;
    }

    const prevContent = prevContentRef.current;
    prevContentRef.current = content;

    // Check for newly added categories (packages)
    const prevCategoryIds = new Set(prevContent.categories.map(c => c.id));
    const currentCategories = content.categories;

    currentCategories.forEach(category => {
      if (!prevCategoryIds.has(category.id)) {
        // A brand new category (package) was added!
        showToast(
          "Yeni Paket Eklendi! 🎉",
          `"${category.title}" isimli yeni paket yayında. Hemen göz atın!`,
          "new_package"
        );
      } else {
        // Check if any new item was added to this existing category
        const prevCategory = prevContent.categories.find(c => c.id === category.id);
        if (prevCategory && prevCategory.items && category.items) {
          const prevItemIds = new Set((prevCategory.items || []).map(item => item.id));
          category.items.forEach(item => {
            if (!prevItemIds.has(item.id)) {
              // A brand new item was added inside this category!
              showToast(
                "Yeni Dosya Eklendi! 📂",
                `"${category.title}" paketine "${item.name}" dosyası eklendi.`,
                "success"
              );
            }
          });
        }
      }
    });
  }, [content]);

  // Fetch site content & increment visitor count with real-time sync
  useEffect(() => {
    let isMounted = true;
    
    // Track unique visit first (run transaction once)
    const hasVisited = sessionStorage.getItem("has_visited_kreatif");
    if (!hasVisited) {
      incrementVisitorCount();
      sessionStorage.setItem("has_visited_kreatif", "true");
    }
    
    setIsLoading(true);
    
    const unsubscribe = subscribeToSiteContent(
      (data) => {
        if (!isMounted) return;
        setContent(data as SiteContent);
        if (data?.settings?.loadingText) {
          localStorage.setItem("kreatif_loading_text", data.settings.loadingText);
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

  // Secret shortcut key combinations (Ctrl + Alt + A) to open admin console silently
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        localStorage.setItem("kreatif_loading_text", finalContent.settings.loadingText);
        setLoadingText(finalContent.settings.loadingText);
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Veritabanına kaydedilirken hata oluştu." };
    }
  };

  // Save changes from normal users (no password verification required)
  const handleSaveUserContent = async (updatedContent: SiteContent): Promise<void> => {
    try {
      await saveSiteContent(updatedContent);
      setContent(updatedContent);
    } catch (err) {
      console.error("User save failed:", err);
      throw err;
    }
  };

  if (error) {
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

  if (!isLoaderFinished) {
    return (
      <LoadingScreen 
        loadingText={loadingText} 
        isDataReady={!isLoading && !!content} 
        onFinished={() => setIsLoaderFinished(true)} 
      />
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-3xl border border-red-500/20 mb-4">
          <AlertTriangle size={32} className="text-red-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Sistem Hatası</h3>
        <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">İçerik yüklenemedi.</p>
      </div>
    );
  }

  // Maintenance Mode Guard
  if (content.settings.maintenanceMode && !isBypassed) {
    const handleBypassSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const adminPass = content.settings.adminPassword || "admin";
      if (maintenancePassword === adminPass) {
        setIsBypassed(true);
        sessionStorage.setItem("admin_maintenance_bypass", "true");
        setMaintenanceError("");
      } else {
        setMaintenanceError("Hatalı yönetici şifresi girdiniz.");
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-sans p-6 text-center relative overflow-hidden">
        {/* Futuristic background lighting */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/[0.05] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-600/[0.05] blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Animated Header Logo / Icon */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="flex flex-col items-center"
          >
            <div className="p-5 bg-gradient-to-br from-red-600/10 to-amber-600/5 text-red-500 rounded-3xl border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.06)] relative group">
              <AlertTriangle size={48} className="animate-pulse" />
              <div className="absolute -inset-1 rounded-3xl bg-red-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            <div className="mt-6 space-y-1.5">
              <span className="text-[10px] font-mono tracking-[0.25em] text-red-500 font-extrabold uppercase bg-red-500/5 px-3 py-1 rounded-full border border-red-500/10">
                SİTEMİZ GEÇİCİ OLARAK KAPALIDIR
              </span>
              <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase pt-2">
                SİTEMİZ BAKIMDADIR
              </h2>
            </div>
          </motion.div>

          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900/40 border border-zinc-900/80 p-6 rounded-2xl space-y-4 backdrop-blur-md"
          >
            <p className="text-xs text-zinc-400 font-medium leading-relaxed font-mono">
              Sizlere daha profesyonel ve daha hızlı bir deneyim sunabilmek için şu anda web sitemizi güncelliyoruz. Muhteşem yenilikler ve yeni edit paketleriyle çok yakında hizmetinizde olacağız!
            </p>
            <div className="w-12 h-[1px] bg-red-600/50 mx-auto" />
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
              DESTEK VE SOSYAL MEDYA HESAPLARIMIZI TAKİP EDEBİLİRSİNİZ.
            </p>
          </motion.div>

          {/* Social Icons inside Maintenance screen */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-4"
          >
            {content.settings.socialLinks.youtube && (
              <a 
                href={content.settings.socialLinks.youtube}
                target="_blank"
                referrerPolicy="no-referrer"
                className="p-3 bg-zinc-900/60 border border-zinc-850 hover:border-red-600/30 text-zinc-400 hover:text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                title="YouTube"
              >
                <Youtube size={18} fill="currentColor" />
              </a>
            )}
            {content.settings.socialLinks.instagram && (
              <a 
                href={content.settings.socialLinks.instagram}
                target="_blank"
                referrerPolicy="no-referrer"
                className="p-3 bg-zinc-900/60 border border-zinc-850 hover:border-pink-600/30 text-zinc-400 hover:text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
            {content.settings.socialLinks.discord && (
              <a 
                href={content.settings.socialLinks.discord}
                target="_blank"
                referrerPolicy="no-referrer"
                className="p-3 bg-zinc-900/60 border border-zinc-850 hover:border-blue-600/30 text-zinc-400 hover:text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                title="Discord"
              >
                <Disc size={18} />
              </a>
            )}
            {content.settings.socialLinks.tiktok && (
              <a 
                href={content.settings.socialLinks.tiktok}
                target="_blank"
                referrerPolicy="no-referrer"
                className="p-3 bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                title="TikTok"
              >
                <TikTokIcon size={18} />
              </a>
            )}
          </motion.div>

          {/* Admin Bypass Module */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="pt-4 border-t border-zinc-900/40"
          >
            {!showMaintenanceAuth ? (
              <button
                onClick={() => setShowMaintenanceAuth(true)}
                className="px-4 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-500 hover:text-zinc-300 rounded-xl font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
              >
                <Lock size={12} /> Yönetici Girişi
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleBypassSubmit}
                className="max-w-xs mx-auto space-y-3 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900/80 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Lock size={10} /> ADMİN PANEL ŞİFRESİ
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowMaintenanceAuth(false);
                      setMaintenancePassword("");
                      setMaintenanceError("");
                    }}
                    className="text-[9px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    KAPAT
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Şifreyi yazın..."
                    value={maintenancePassword}
                    onChange={(e) => setMaintenancePassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#08090d] border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl border border-red-500 transition-all cursor-pointer shadow-md shadow-red-600/10"
                  >
                    GİRİŞ
                  </button>
                </div>
                
                {maintenanceError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-mono text-red-500 text-left"
                  >
                    {maintenanceError}
                  </motion.p>
                )}
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans selection:bg-red-600 selection:text-white pb-24 relative overflow-hidden transition-colors duration-500`}>
      
      {/* Cinematic Golden Geometric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={goldenPolyBg}
          alt="Golden Poly Background"
          className={`w-full h-full object-cover ${isDarkMode ? "opacity-[0.38]" : "opacity-[0.10] grayscale"} filter blur-[0.5px] transition-all duration-1000`}
          referrerPolicy="no-referrer"
        />
        {/* Subtle dark vignette overlay to keep text ultra-readable */}
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? "from-[#0e0e12]/50 via-transparent to-[#0e0e12]/75" : "from-[#f4f5f8]/50 via-transparent to-[#f4f5f8]/75"}`} />
      </div>

      {/* Cyberpunk Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />

      {/* Ambient Decorative Lighting Gradients - Brighter and warmer */}
      <div className={`absolute top-[-10%] left-[5%] w-[600px] h-[600px] rounded-full ${isDarkMode ? "bg-red-500/[0.04]" : "bg-red-500/[0.02]"} blur-[150px] pointer-events-none`} />
      <div className={`absolute bottom-[15%] right-[-5%] w-[500px] h-[500px] rounded-full ${isDarkMode ? "bg-amber-500/[0.12]" : "bg-amber-500/[0.04]"} blur-[130px] pointer-events-none`} />
      <div className={`absolute top-[25%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full ${isDarkMode ? "bg-amber-500/[0.09]" : "bg-amber-500/[0.03]"} blur-[160px] pointer-events-none`} />
      <div className={`absolute top-[50%] left-[10%] w-[500px] h-[500px] rounded-full ${isDarkMode ? "bg-yellow-500/[0.06]" : "bg-yellow-500/[0.02]"} blur-[140px] pointer-events-none`} />

      {/* Main Container */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8 relative z-10">
        
        {/* Top Brand & Visitor Counter Header Bar */}
        <header className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 ${t.cardBgTransparent} backdrop-blur-md border rounded-3xl shadow-xl transition-all duration-300`}>
          {/* Brand Logo Trigger (Double-click opens admin panel secretly) */}
          <div 
            onDoubleClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-display font-black text-lg shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              {content.settings.logoImage ? (
                <img 
                  src={content.settings.logoImage} 
                  alt="Logo" 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                "P"
              )}
            </div>
            <div>
              <h1 className={`text-sm font-mono font-bold ${isDarkMode ? "text-zinc-300" : "text-zinc-800"} tracking-[0.2em] uppercase flex items-center gap-1.5`}>
                {(() => {
                  const text = content.settings.topBarText || "KREATİF EDİT PACK";
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
              <span className={`text-[9px] font-mono font-medium ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} tracking-wider`}>CREATIVE RESOURCE ARCHIVE</span>
            </div>
          </div>

          {/* Side-by-side Appearance Toggle & Visitor Counter */}
          <div className="flex flex-row items-center gap-3.5 w-full md:w-auto justify-center md:justify-end">
            
            {/* Appearance Mode Toggle Widget */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                const targetDark = !isDarkMode;
                setIsDarkMode(targetDark);
                playThemeSound(targetDark);
              }}
              className="relative py-2.5 px-4.5 bg-[#0a0a0f] border border-zinc-900 rounded-[22px] shadow-2xl flex items-center gap-3.5 select-none cursor-pointer group hover:border-zinc-800 transition-all duration-300 min-w-[170px]"
            >
              {/* Glowing top line */}
              <div className="absolute top-0 left-3.5 right-3.5 h-[1.5px] bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-400 rounded-full opacity-80" />
              
              {/* Custom High-Fidelity Slider Switch */}
              <div className="relative w-12 h-7 rounded-full bg-[#121319] border border-zinc-850 p-0.5 flex items-center transition-colors">
                {/* Sun & Moon hidden icons inside track */}
                <div className="absolute left-1.5 flex items-center justify-center text-amber-500/80">
                  <Sun size={11} className="animate-pulse" />
                </div>
                <div className="absolute right-2 flex items-center justify-center text-zinc-600">
                  <Moon size={11} />
                </div>
                
                {/* Sliding Thumb */}
                <motion.div 
                  animate={{ x: isDarkMode ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md shadow-orange-500/20 z-10 flex items-center justify-center"
                />
              </div>

              {/* Text Labels Stack */}
              <div className="flex flex-col text-left leading-none">
                <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-[0.18em] uppercase">
                  GÖRÜNÜM
                </span>
                <span className="text-sm font-sans font-black text-white uppercase tracking-wider mt-1 block select-none">
                  {isDarkMode ? "GECE" : "GÜNDÜZ"}
                </span>
              </div>
            </motion.div>

            {/* Total Visit Counter Widget */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative py-2.5 px-6 bg-[#0a0a0f] border border-zinc-900 rounded-[22px] shadow-2xl flex flex-col items-center justify-center min-w-[160px] group transition-all duration-300 hover:border-zinc-800"
            >
              {/* Glowing top line */}
              <div className="absolute top-0 left-3.5 right-3.5 h-[1.5px] bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 rounded-full opacity-80" />
              
              <div className="text-center leading-none mt-0.5">
                <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-[0.18em] uppercase block">
                  TOPLAM ZİYARET
                </span>
                <span className="text-2xl font-bold font-sans text-white mt-1 block tracking-wide select-none leading-none pt-0.5">
                  {content ? content.visitorCount : "..."}
                </span>
              </div>
            </motion.div>

          </div>
        </header>

        {/* Active Announcements */}
        <AnnouncementsList content={content} onSaveContent={handleSaveUserContent} />

        {/* Dashboard Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Hero Card) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`relative p-8 ${isDarkMode ? "bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border-zinc-850/80" : "bg-white border-zinc-200/85 shadow-md"} border rounded-3xl overflow-hidden group sweep-effect`}
            >
              {/* Internal Glow Effects */}
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span className={`px-3.5 py-1.5 ${isDarkMode ? "bg-zinc-950/80 border-zinc-850 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-600"} border text-[10px] font-mono font-bold rounded-full flex items-center gap-2`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {content.settings.heroBadge || "AFTER EFFECTS PACKS"}
                </span>
              </div>

              {/* Title */}
              <h2 className={`text-3xl font-display font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} text-center tracking-tight uppercase leading-tight`}>
                {content.settings.heroTitle || "KREATİF EDİT PACK"}
              </h2>

              {/* Premium Accent Line and Nodes */}
              <div className="flex items-center justify-center mt-8 px-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-500/60" />
                <div className="flex items-center gap-2 px-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-zinc-700" : "bg-zinc-300"}`} />
                  <div className="w-2.5 h-2.5 border border-red-500 rotate-45 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-zinc-700" : "bg-zinc-300"}`} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-500/60" />
              </div>
            </motion.div>

          </div>

          {/* Right Column (Plugins, Categories Library) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Actions Bento Stack (Matches User Video exactly) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-450"} tracking-widest uppercase`}>HIZLI MENÜ / ARAÇLAR</span>
              </div>

              {/* Card 1: En Son Eklenenler */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                onClick={() => setIsRecentOpen(true)}
                className={`group relative flex items-center justify-between p-5 ${isDarkMode ? "bg-gradient-to-r from-zinc-950 to-[#0e1017] border-zinc-900" : "bg-gradient-to-r from-white to-zinc-50 border-zinc-200/80 shadow-sm"} border hover:border-red-500/30 rounded-2xl shadow-xl transition-all duration-300 active:scale-99 cursor-pointer overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Glowing Sparkles badge */}
                  <div className="p-3.5 bg-gradient-to-tr from-red-600 to-orange-500 text-white rounded-2xl shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-red-400 tracking-widest font-bold block uppercase mb-0.5">YENİ GÜNCELLEMELER</span>
                    <h3 className={`text-sm font-display font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} group-hover:text-red-400 transition-colors uppercase`}>
                      En Son Eklenenler
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mt-0.5 font-sans`}>
                      Son 7 günde eklenen veya güncellenen efektler
                    </p>
                  </div>
                </div>
                
                <div className={`p-2.5 ${isDarkMode ? "bg-zinc-900 border-zinc-850" : "bg-zinc-100 border-zinc-200"} border rounded-xl group-hover:border-red-500/20 text-zinc-500 group-hover:text-red-400 transition-all duration-300`}>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.div>

              {/* Card 2: Gerekli Pluginler */}
              <motion.a
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                href={content.settings.pluginUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className={`group relative flex items-center justify-between p-5 ${isDarkMode ? "bg-gradient-to-r from-zinc-950 to-[#0e1017] border-zinc-900" : "bg-gradient-to-r from-white to-zinc-50 border-zinc-200/80 shadow-sm"} border hover:border-red-500/30 rounded-2xl shadow-xl transition-all duration-300 active:scale-99 cursor-pointer overflow-hidden block`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* Glowing YouTube Play badge */}
                  <div className="p-3.5 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/25 group-hover:scale-105 transition-transform duration-300">
                    <Play size={18} fill="currentColor" />
                  </div>
                  <div>
                    <span className={`text-[9px] font-mono ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} tracking-widest font-bold block uppercase mb-0.5`}>SİSTEM REHBERLERİ</span>
                    <h3 className={`text-sm font-display font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} group-hover:text-red-400 transition-colors uppercase`}>
                      {content.settings.pluginTitle || "Gerekli Pluginler"}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} mt-0.5 font-sans`}>
                      {content.settings.pluginDesc || "Kurulum videosunu izle"}
                    </p>
                  </div>
                </div>
                
                <div className={`p-2.5 ${isDarkMode ? "bg-zinc-900 border-zinc-850" : "bg-zinc-100 border-zinc-200"} border rounded-xl group-hover:border-red-500/20 text-zinc-500 group-hover:text-red-400 transition-all duration-300`}>
                  <ExternalLink size={13} />
                </div>
              </motion.a>
            </div>

            {/* Categories Section Header */}
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-wider uppercase">CANLI ARŞİV KÜTÜPHANESİ</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className={`text-2xl font-display font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} tracking-tight uppercase`}>Kategoriler / Odalar</h2>
                  <p className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-zinc-600"} leading-relaxed mt-1`}>
                    {content.settings.heroSub || "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır."}
                  </p>
                </div>
              </div>
            </div>

            {/* Categories List (Redesigned matching Screenshot 1) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              {content.categories.map((category, idx) => {
                const itemCount = category.items?.length || 0;
                
                // Theme configurations based on category index
                const getCategoryTheme = (index: number) => {
                  const themes = [
                    {
                      border: "border-purple-500/10 group-hover:border-purple-500/30",
                      badgeBg: "bg-purple-600",
                      textColor: "text-purple-400",
                      pillBg: "bg-purple-950/15 border-purple-900/30",
                      btnBorder: "border-purple-500/15 text-purple-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500",
                      glowBg: "from-purple-600/10 via-transparent to-transparent",
                      laserLine: "from-transparent via-purple-400 to-transparent",
                      laserGlow: "from-transparent via-purple-500/20 to-transparent"
                    },
                    {
                      border: "border-amber-500/10 group-hover:border-amber-500/30",
                      badgeBg: "bg-amber-600",
                      textColor: "text-amber-400",
                      pillBg: "bg-amber-950/15 border-amber-900/30",
                      btnBorder: "border-amber-500/15 text-amber-400 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-500",
                      glowBg: "from-amber-600/10 via-transparent to-transparent",
                      laserLine: "from-transparent via-amber-400 to-transparent",
                      laserGlow: "from-transparent via-amber-500/20 to-transparent"
                    },
                    {
                      border: "border-cyan-500/10 group-hover:border-cyan-500/30",
                      badgeBg: "bg-cyan-600",
                      textColor: "text-cyan-400",
                      pillBg: "bg-cyan-950/15 border-cyan-900/30",
                      btnBorder: "border-cyan-500/15 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500",
                      glowBg: "from-cyan-600/10 via-transparent to-transparent",
                      laserLine: "from-transparent via-cyan-400 to-transparent",
                      laserGlow: "from-transparent via-cyan-500/20 to-transparent"
                    },
                    {
                      border: "border-emerald-500/10 group-hover:border-emerald-500/30",
                      badgeBg: "bg-emerald-600",
                      textColor: "text-emerald-400",
                      pillBg: "bg-emerald-950/15 border-emerald-900/30",
                      btnBorder: "border-emerald-500/15 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500",
                      glowBg: "from-emerald-600/10 via-transparent to-transparent",
                      laserLine: "from-transparent via-emerald-400 to-transparent",
                      laserGlow: "from-transparent via-emerald-500/20 to-transparent"
                    },
                    {
                      border: "border-rose-500/10 group-hover:border-rose-500/30",
                      badgeBg: "bg-rose-600",
                      textColor: "text-rose-400",
                      pillBg: "bg-rose-950/15 border-rose-900/30",
                      btnBorder: "border-rose-500/15 text-rose-400 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-500",
                      glowBg: "from-rose-600/10 via-transparent to-transparent",
                      laserLine: "from-transparent via-rose-400 to-transparent",
                      laserGlow: "from-transparent via-rose-500/20 to-transparent"
                    }
                  ];
                  return themes[index % themes.length];
                };

                const getBadgeText = (title: string) => {
                  const upper = title.toUpperCase();
                  if (upper.includes("RENK")) return "RENK EFEKTİ";
                  if (upper.includes("SHAKE")) return "SHAKE EFEKTİ";
                  if (upper.includes("TWİXTOR")) return "TWİXTOR EFEKTİ";
                  if (upper.includes("GEÇİŞ")) return "GEÇİŞ EFEKTİ";
                  return "EDİT EFEKTİ";
                };

                const theme = getCategoryTheme(idx);
                const badgeLabel = getBadgeText(category.title);

                return (
                  <motion.div
                    key={category.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.98 },
                      show: { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 90,
                          damping: 14
                        }
                      }
                    }}
                    whileHover={{ 
                      scale: 1.015,
                      y: -2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`group relative p-6 sm:p-7 ${isDarkMode ? "bg-[#0b0c10] hover:bg-[#0e1017] border-zinc-900/80 hover:border-zinc-800 shadow-black/40" : "bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 shadow-zinc-200/50"} border rounded-[28px] shadow-2xl transition-colors duration-300 cursor-pointer overflow-hidden flex items-center justify-between gap-6`}
                  >
                    {/* Glowing radial spot inside the card */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.glowBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                    {/* Holographic digital grid & micro scanline stripe overlay */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.015)_50%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* High-Fidelity Animated Holographic Laser Scanline */}
                    <motion.div
                      className={`absolute left-0 right-0 h-[1.5px] bg-gradient-to-r ${theme.laserLine} z-20 pointer-events-none opacity-0 group-hover:opacity-20`}
                      initial={{ top: "0%" }}
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "linear"
                      }}
                    >
                      <div className={`absolute inset-x-0 -top-1 h-2 bg-gradient-to-r ${theme.laserGlow} blur-md opacity-30`} />
                    </motion.div>

                    {/* Left Section: Responsive Icon & Text Wrapper */}
                    <div className="flex items-center gap-4 sm:gap-6 relative z-10 flex-1 min-w-0">
                      {/* Unique Category SVG Icon Container */}
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] flex items-center justify-center shrink-0 relative transition-all duration-500 border ${
                        isDarkMode 
                          ? "bg-zinc-950/50 border-zinc-900/60 group-hover:border-zinc-800" 
                          : "bg-zinc-50 border-zinc-200/60 group-hover:border-zinc-300"
                      } group-hover:scale-105 overflow-hidden shadow-inner`}>
                        {/* Inner ambient colored soft glow behind the icon on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-tr ${theme.glowBg} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                        
                        {/* The animated icon itself */}
                        <motion.div
                          variants={{
                            rest: { rotate: 0, scale: 1 },
                            hover: { 
                              rotate: [0, -10, 10, -5, 5, 0],
                              scale: 1.1,
                              transition: { duration: 0.5, ease: "easeInOut" }
                            }
                          }}
                          className={`${theme.textColor} transition-colors duration-300 relative z-10`}
                        >
                          {getCategoryIcon(category.title, category.icon, 26)}
                        </motion.div>
                      </div>

                      {/* Info stack */}
                      <div className="space-y-2 min-w-0 flex-1">
                        {/* Monogram/Index */}
                        <span className={`text-[11px] font-mono font-bold ${isDarkMode ? "text-zinc-600" : "text-zinc-400"} tracking-widest block uppercase`}>
                          {category.index || `0${idx + 1}`}
                        </span>

                        {/* Redesigned custom pill/badge */}
                        <div className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 ${isDarkMode ? "bg-zinc-950/80 border-zinc-900" : "bg-zinc-100 border-zinc-200"} border rounded-full text-[10px] font-mono font-bold tracking-wider`}>
                          <span className={`px-2 py-0.5 rounded-full ${theme.badgeBg} text-white text-[9px] font-black`}>
                            {itemCount}
                          </span>
                          <span className={`${theme.textColor} uppercase font-extrabold tracking-widest text-[9px]`}>
                            {badgeLabel}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-2xl sm:text-3xl font-display font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} uppercase tracking-tight group-hover:text-red-400 transition-colors duration-300 leading-none truncate`}>
                          {category.title}
                        </h3>
                      </div>
                    </div>

                    {/* Right Section: Action circle */}
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border ${theme.btnBorder} flex items-center justify-center shrink-0 relative z-10 transition-all duration-300 transform group-hover:scale-105 shadow-md`}>
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>

        </div>

        {/* Creator Biography & Social Channels Bottom Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 pt-12 border-t ${isDarkMode ? "border-zinc-900/60" : "border-zinc-200"}`}>
          {/* Left Side: Biography & Creator Profile */}
          <div className="lg:col-span-7">
            {/* Biography & Creator Profile */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`relative p-7 ${isDarkMode ? "bg-zinc-950/90 border-zinc-900 shadow-black/40" : "bg-white border-zinc-200/80 shadow-zinc-200/40"} border rounded-3xl shadow-2xl space-y-6 overflow-hidden h-full flex flex-col justify-between`}
            >
              {/* Subtle Decorative Light Leak */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />

              {/* Top Section */}
              <div className="space-y-6">
                {/* Header */}
                <div className={`flex items-center gap-2 border-b ${isDarkMode ? "border-zinc-900" : "border-zinc-100"} pb-3 justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className={`text-[9px] font-mono font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-450"} tracking-wider uppercase`}>
                      {content.settings.bioSub || "EDİTÖR / KREATİF PROFİL"}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono ${isDarkMode ? "text-zinc-600" : "text-zinc-400"}`}>ID: #01</span>
                </div>

                {/* Main responsive grid for side-by-side on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Profile Picture with high-fidelity effects */}
                  <div className="md:col-span-5">
                    <div 
                      onDoubleClick={() => setIsAdminOpen(true)}
                      className={`relative aspect-[4/3] w-full rounded-2xl overflow-hidden border ${isDarkMode ? "border-zinc-900" : "border-zinc-150"} shadow-2xl group cursor-pointer`}
                    >
                      <img 
                        src={content.settings.bioImage || defaultProfileImg} 
                        alt="Editör Profil" 
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 ease-out"
                      />
                      {/* Sleek shadow overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-zinc-950 via-zinc-950/20" : "from-zinc-900/80 via-zinc-900/10"} to-transparent`} />
                      
                      {/* Floating text badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="text-[9px] font-mono font-black text-red-500 tracking-widest block uppercase">
                          {content.settings.bioRole || "VIDEO EDITOR • MOTION DESIGNER"}
                        </span>
                        <span className="text-xl font-display font-black text-white uppercase tracking-tight mt-0.5 block glow-text-red">
                          {content.settings.bioName || "KREATİF EDİTÖR"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio Description & Details */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-2">
                      <h3 className={`text-sm font-display font-black ${isDarkMode ? "text-white" : "text-zinc-900"} tracking-wider uppercase leading-none flex items-center gap-2`}>
                        <Sparkles size={14} className="text-red-500" />
                        {content.settings.bioTitle || "BEN KİMİM?"}
                      </h3>
                      <div className="w-10 h-[1.5px] bg-red-600 rounded-full" />
                      {content.settings.bioDescription && (
                        <p className={`text-xs ${isDarkMode ? "text-zinc-400 bg-zinc-900/10 border-zinc-900/40" : "text-zinc-650 bg-zinc-50 border-zinc-200/50"} leading-relaxed whitespace-pre-line p-4 rounded-xl border`}>
                          {content.settings.bioDescription}
                        </p>
                      )}
                    </div>

                    {/* Bento Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {content.settings.stats.map((stat, idx) => (
                        <div key={idx} className={`p-3 ${isDarkMode ? "bg-zinc-900/40 border-zinc-900 hover:border-red-950/50" : "bg-zinc-50 border-zinc-150 hover:border-red-200"} border rounded-xl text-center space-y-1 transition-colors`}>
                          <span className={`text-lg font-mono font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"} block glow-text-red`}>
                            {stat.value}
                          </span>
                          <span className={`text-[8px] font-mono ${isDarkMode ? "text-zinc-500" : "text-zinc-450"} tracking-widest block uppercase font-bold leading-tight`}>
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Main Action Button placed at the very bottom of the card */}
              <div className={`pt-4 border-t ${isDarkMode ? "border-zinc-900/40" : "border-zinc-150"} mt-4`}>
                <a
                  href={content.settings.portfolioUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-display font-extrabold text-xs tracking-widest text-center uppercase rounded-xl border border-red-500 transition-all active:scale-98 shadow-lg shadow-red-600/10 block cursor-pointer"
                >
                  PORTFÖYÜ İNCELE
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Social Channels Panel */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`relative p-7 ${isDarkMode ? "bg-zinc-950/90 border-zinc-900 shadow-xl" : "bg-white border-zinc-200/80 shadow-zinc-200/40"} border rounded-3xl shadow-xl space-y-4 h-full flex flex-col justify-between`}
            >
              <div>
                <div className={`flex items-center gap-2 border-b ${isDarkMode ? "border-zinc-900" : "border-zinc-100"} pb-3 mb-5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className={`text-[9px] font-mono font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-450"} tracking-widest uppercase block`}>SOSYAL MEDYA KANALLARI</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* YouTube Card */}
                  <a 
                    href={content.settings.socialLinks.youtube} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className={`group relative flex items-center gap-3 p-3.5 ${isDarkMode ? "bg-zinc-900/20 border-zinc-900" : "bg-zinc-50 border-zinc-150 hover:border-red-500/20 shadow-sm"} border hover:border-red-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="p-2 bg-red-600/10 group-hover:bg-red-600 text-red-500 group-hover:text-white rounded-xl transition-all duration-300">
                      <Youtube size={15} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-zinc-900"} block group-hover:text-red-400 transition-colors`}>YouTube</span>
                      <span className="text-[8px] text-zinc-500 font-mono truncate block">
                        {content.settings.socialHandles?.youtube || "KREATİF EDİTÖR"}
                      </span>
                    </div>
                  </a>

                  {/* Instagram Card */}
                  <a 
                    href={content.settings.socialLinks.instagram} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className={`group relative flex items-center gap-3 p-3.5 ${isDarkMode ? "bg-zinc-900/20 border-zinc-900" : "bg-zinc-50 border-zinc-150 hover:border-pink-500/20 shadow-sm"} border hover:border-pink-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="p-2 bg-pink-600/10 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-pink-600 text-pink-500 group-hover:text-white rounded-xl transition-all duration-300">
                      <Instagram size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-zinc-900"} block group-hover:text-pink-400 transition-colors`}>Instagram</span>
                      <span className="text-[8px] text-zinc-500 font-mono truncate block">
                        {content.settings.socialHandles?.instagram || "@kreatifeditor"}
                      </span>
                    </div>
                  </a>

                  {/* Discord Card */}
                  <a 
                    href={content.settings.socialLinks.discord} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className={`group relative flex items-center gap-3 p-3.5 ${isDarkMode ? "bg-zinc-900/20 border-zinc-900" : "bg-zinc-50 border-zinc-150 hover:border-blue-500/20 shadow-sm"} border hover:border-blue-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="p-2 bg-blue-600/10 group-hover:bg-[#5865F2] text-blue-400 group-hover:text-white rounded-xl transition-all duration-300">
                      <Disc size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-zinc-900"} block group-hover:text-blue-400 transition-colors`}>Discord</span>
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
                    className={`group relative flex items-center gap-3 p-3.5 ${isDarkMode ? "bg-zinc-900/20 border-zinc-900" : "bg-zinc-50 border-zinc-150 hover:border-cyan-500/20 shadow-sm"} border hover:border-cyan-600/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-pink-600/0 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="p-2 bg-cyan-600/10 group-hover:bg-zinc-900 text-cyan-400 group-hover:text-pink-500 rounded-lg transition-all duration-300 flex items-center justify-center">
                      <TikTokIcon size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-zinc-900"} block group-hover:text-cyan-400 transition-colors`}>TikTok</span>
                      <span className="text-[8px] text-zinc-500 font-mono truncate block">
                        {content.settings.socialHandles?.tiktok || "@kreatifeditor"}
                      </span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Aesthetic footer signature */}
              <div className={`text-center pt-5 border-t ${isDarkMode ? "border-zinc-900/60" : "border-zinc-150"} font-mono text-[8px] text-zinc-600 tracking-widest uppercase`}>
                NIKLAUSAE CREATIVE HUBS // CONNECT ONLINE
              </div>
            </motion.div>
          </div>
        </div>

        {/* Newsletter Subscription Form */}
        {content.settings.showNewsletter !== false && (
          <NewsletterForm 
            content={content} 
            onSaveContent={handleSaveUserContent} 
            onShowToast={showToast} 
          />
        )}

        {/* Footer */}
        <footer className="pt-8 flex flex-col items-center gap-2 border-t border-zinc-900/60 mt-12">
          <p className="text-[10px] text-zinc-600 font-mono text-center">
            © 2026 NIKLAUSAE EDIT PACK. Tüm Hakları Saklıdır.
          </p>
        </footer>

      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-30 p-3 bg-zinc-950/90 hover:bg-red-600 hover:text-white border border-zinc-800 hover:border-red-500 text-zinc-400 rounded-xl shadow-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 active:scale-95"
        >
          <ArrowUp size={14} />
          <span className="text-[7px] font-mono font-bold tracking-widest uppercase">YUKARI</span>
        </motion.button>
      )}

      {/* Floating Support & Suggestion Button - Ultra-Premium Sequenced Version */}
      <motion.div
        layout
        initial="rest"
        animate={(showFeedbackText || isFeedbackHovered) ? "hover" : "rest"}
        whileTap="tap"
        onMouseEnter={() => setIsFeedbackHovered(true)}
        onMouseLeave={() => setIsFeedbackHovered(false)}
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-[1.5px] rounded-full bg-gradient-to-r from-[#f97316]/80 via-[#ec4899]/80 to-[#8b5cf6]/80 shadow-[0_4px_20px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_30px_rgba(236,72,153,0.25)] cursor-pointer transition-shadow duration-300"
        style={{ borderRadius: "9999px" }}
      >
        {/* Dynamic Rotating/Pulsing Glow Aura behind the button */}
        <motion.div 
          variants={{
            rest: { scale: 1.0, opacity: 0.15, rotate: 0 },
            hover: { scale: 1.15, opacity: 0.3, rotate: 180 }
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#8b5cf6] blur-md pointer-events-none"
        />

        <motion.div 
          layout
          className={`relative bg-[#0d0e12] rounded-full flex items-center overflow-hidden transition-all duration-500 ${
            (showFeedbackText || isFeedbackHovered) ? "px-5 py-3 gap-3.5" : "p-3 gap-0"
          }`}
        >
          {/* Continuous Metallic Sheen Sweep */}
          <motion.div
            variants={{
              rest: { x: "-150%" },
              hover: { 
                x: ["-150%", "200%"],
                transition: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 2.2,
                  ease: "easeInOut"
                }
              }
            }}
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
          />

          {/* Interactive Sparkle Particles */}
          <motion.div
            variants={{
              rest: { opacity: 0.2, y: 0 },
              hover: { 
                opacity: [0.2, 0.6, 0.2],
                y: [-0.5, -2, -0.5],
                transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
              }
            }}
            className="absolute top-1.5 left-10 w-1 h-1 bg-white rounded-full pointer-events-none"
          />
          <motion.div
            variants={{
              rest: { opacity: 0.15, scale: 0.8 },
              hover: { 
                opacity: [0.15, 0.5, 0.15],
                scale: [0.8, 1.1, 0.8],
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.3 }
              }
            }}
            className="absolute bottom-2 right-14 w-1.5 h-1.5 bg-pink-400 rounded-full pointer-events-none"
          />
          <motion.div
            variants={{
              rest: { opacity: 0.1 },
              hover: { 
                opacity: [0.1, 0.4, 0.1],
                transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.6 }
              }
            }}
            className="absolute top-3 right-6 w-0.5 h-0.5 bg-purple-300 rounded-full pointer-events-none"
          />

          {/* Glowing gradient thumb with Ellipsis - Custom Rotates and Scales */}
          <motion.div 
            layout
            variants={{
              rest: { 
                scale: 1.0, 
                rotate: 0,
                boxShadow: "0 0 0px rgba(236,72,153,0)"
              },
              hover: { 
                scale: 1.08, 
                rotate: 360,
                boxShadow: "0 0 8px rgba(236,72,153,0.3)",
                transition: { type: "spring", stiffness: 200, damping: 15 }
              }
            }}
            className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex items-center justify-center text-white font-extrabold shadow-md shadow-pink-500/10 relative shrink-0"
          >
            <motion.div
              variants={{
                rest: { scale: 1 },
                hover: { 
                  scale: [1, 1.1, 1],
                  transition: { repeat: Infinity, duration: 1.5 }
                }
              }}
            >
              <MoreHorizontal size={16} className="text-white font-black" />
            </motion.div>
          </motion.div>

          {/* Sliding and fading dynamic text label with AnimatePresence */}
          <AnimatePresence initial={false}>
            {(showFeedbackText || isFeedbackHovered) && (
              <motion.span 
                initial={{ width: 0, opacity: 0, x: -10 }}
                animate={{ 
                  width: "auto", 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    width: { type: "spring", stiffness: 150, damping: 20 },
                    opacity: { duration: 0.2, delay: 0.1 },
                    x: { duration: 0.2, delay: 0.1 }
                  }
                }}
                exit={{ 
                  width: 0, 
                  opacity: 0, 
                  x: -10,
                  transition: {
                    width: { type: "spring", stiffness: 150, damping: 20 },
                    opacity: { duration: 0.15 },
                    x: { duration: 0.15 }
                  }
                }}
                variants={{
                  rest: { letterSpacing: "0.025em", color: "#ffffff" },
                  hover: { 
                    letterSpacing: "0.035em", 
                    color: "#ffeff8",
                    textShadow: "0 0 3px rgba(236,72,153,0.2)",
                    transition: { duration: 0.3 }
                  }
                }}
                className="text-xs font-sans font-black tracking-wide whitespace-nowrap pr-1.5 transition-colors overflow-hidden"
              >
                Öneri veya Şikâyet Bildir
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Detailed Pack Category Modal */}
      <CategoryDetailModal 
        category={selectedCategory} 
        onClose={() => setSelectedCategory(null)} 
        onPlayVideo={setActiveVideo}
      />

      {/* Suggestion & Complaint Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        content={content}
        onSaveContent={handleSaveUserContent}
        onShowToast={showToast}
      />

      {/* Recently Added Items Modal */}
      <RecentlyAddedModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
        content={content}
        onPlayVideo={setActiveVideo}
      />

      {/* Mini Preview Player (Picture-in-picture floating overlay) */}
      <MiniPlayer 
        video={activeVideo} 
        onClose={() => setActiveVideo(null)} 
      />

      {/* Secret Admin Panel Control Overlay */}
      <AdminPanel 
        content={content} 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onSave={handleSaveContent}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3.5 max-w-sm w-[calc(100vw-3rem)] sm:w-[360px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.18 } }}
              className="pointer-events-auto w-full p-4 bg-zinc-950/95 backdrop-blur-md border border-zinc-900/90 hover:border-red-500/30 rounded-2xl shadow-2xl flex items-start gap-3.5 overflow-hidden relative group transition-all duration-300"
            >
              {/* Left Accent Neon Strip */}
              <div className="absolute left-0 inset-y-0 w-[4px] bg-gradient-to-b from-red-600 to-amber-500 rounded-l-2xl" />

              {/* Glowing Background Glow (Subtle) */}
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent blur-xl pointer-events-none" />

              <div className="p-2 bg-zinc-900 border border-zinc-800 text-red-500 rounded-xl relative shrink-0">
                <Sparkles size={16} className="animate-pulse" />
              </div>

              <div className="flex-1 space-y-1 pr-1">
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                  {toast.title}
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
