import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Save, Shield, Settings, FolderOpen, User, Lock, Plus, Trash2, 
  Link2, FileText, CheckCircle, AlertTriangle, Eye, EyeOff, UploadCloud, 
  TrendingUp, Award, ExternalLink, Globe, Hash, Sparkles, ChevronRight, Check,
  Edit, FileEdit, Loader2
} from "lucide-react";
import { SiteContent, Category, EditPackItem } from "../types";

// Reusable Media Upload Button supporting image and video uploads directly from PC or Phone
interface MediaUploadButtonProps {
  label: string;
  onUploadSuccess: (url: string) => void;
  accept?: string;
}

function MediaUploadButton({ label, onUploadSuccess, accept = "image/*,video/*" }: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct client-side size warning
    if (file.size > 100 * 1024 * 1024) {
      setError("Dosya boyutu çok büyük! En fazla 100MB yükleyebilirsiniz.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      let errorMessage = "Yükleme başarısız.";
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.success && data.url) {
            onUploadSuccess(data.url);
            return;
          } else {
            errorMessage = data.error || errorMessage;
          }
        } catch (jsonErr) {
          errorMessage = "Sunucudan geçersiz yanıt alındı.";
        }
      } else {
        try {
          const data = await res.json();
          errorMessage = data.error || `Sunucu hatası: ${res.status}`;
        } catch (jsonErr) {
          const text = await res.text().catch(() => "");
          errorMessage = text ? `Hata (${res.status}): ${text.substring(0, 100)}` : `Sunucu hatası (${res.status})`;
        }
      }
      setError(errorMessage);
    } catch (err: any) {
      setError(`Bağlantı hatası: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-1 w-full">
      <label className="relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 active:scale-95 text-[10px] font-mono font-bold text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-750 cursor-pointer transition-all">
        {uploading ? (
          <>
            <Loader2 size={11} className="animate-spin text-red-500" />
            <span>Yükleniyor...</span>
          </>
        ) : (
          <>
            <UploadCloud size={11} className="text-red-500" />
            <span>{label}</span>
          </>
        )}
        <input 
          type="file" 
          accept={accept} 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={uploading}
        />
      </label>
      {error && <span className="text-[9px] text-red-500 font-mono mt-0.5">{error}</span>}
    </div>
  );
}

interface AdminPanelProps {
  content: SiteContent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContent: SiteContent, passwordToVerify: string) => Promise<{ success: boolean; error?: string }>;
}

type TabType = "general" | "categories" | "bio" | "system";

export default function AdminPanel({ content, isOpen, onClose, onSave }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states copied from content
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [editedContent, setEditedContent] = useState<SiteContent>(JSON.parse(JSON.stringify(content)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });

  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Temp states for adding category/item
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [newItem, setNewItem] = useState<Partial<EditPackItem>>({ name: "", size: "15 KB", downloadUrl: "", description: "" });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ 
    title: "", 
    badge: "", 
    description: "", 
    gradient: "from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40" 
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === (content.settings.adminPassword || "admin")) {
      setIsAuthenticated(true);
      setAuthError("");
      setEditedContent(JSON.parse(JSON.stringify(content))); // Reset editing state with fresh content
    } else {
      setAuthError("Hatalı yönetici şifresi!");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Görsel boyutu çok büyük! Lütfen 2MB'tan daha küçük bir görsel yükleyin.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedContent({
          ...editedContent,
          settings: {
            ...editedContent.settings,
            bioImage: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, msg: "" });
    try {
      const res = await onSave(editedContent, passwordInput);
      if (res.success) {
        setSaveStatus({ type: "success", msg: "Değişiklikleriniz başarıyla kaydedildi ve tüm kullanıcılara yansıtıldı!" });
        setTimeout(() => {
          setSaveStatus({ type: null, msg: "" });
        }, 3500);
      } else {
        setSaveStatus({ type: "error", msg: res.error || "Kaydedilirken bir hata oluştu." });
      }
    } catch (err) {
      setSaveStatus({ type: "error", msg: "Sunucu bağlantı hatası oluştu." });
    } finally {
      setIsSaving(false);
    }
  };

  // Category CRUD
  const handleAddCategory = () => {
    if (!newCategory.title) return;
    const count = editedContent.categories.length + 1;
    const indexStr = count < 10 ? `0${count}` : `${count}`;
    const newCatObj: Category = {
      id: `cat_${Date.now()}`,
      index: indexStr,
      title: newCategory.title,
      badge: newCategory.badge || "EFEKT",
      description: newCategory.description || "",
      gradient: newCategory.gradient || "from-amber-500/20 to-red-600/10 hover:border-amber-500/40",
      items: []
    };
    setEditedContent({
      ...editedContent,
      categories: [...editedContent.categories, newCatObj]
    });
    setNewCategory({ title: "", badge: "", description: "", gradient: "from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40" });
  };

  const handleRemoveCategory = (catId: string) => {
    if (!confirm("Bu odayı/kategoriyi ve içindeki tüm dosyaları silmek istediğinizden emin misiniz?")) return;
    const updated = editedContent.categories.filter(c => c.id !== catId).map((c, i) => {
      const idx = i + 1;
      return { ...c, index: idx < 10 ? `0${idx}` : `${idx}` };
    });
    setEditedContent({
      ...editedContent,
      categories: updated
    });
    if (selectedCatId === catId) setSelectedCatId("");
  };

  const handleUpdateCategoryField = (catId: string, field: keyof Category, value: string) => {
    const updated = editedContent.categories.map(c => {
      if (c.id === catId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setEditedContent({ ...editedContent, categories: updated });
  };

  // Item CRUD
  const handleAddItem = (catId: string) => {
    if (!newItem.name || !newItem.downloadUrl) return;
    const cat = editedContent.categories.find(c => c.id === catId);
    if (!cat) return;

    const newItemObj: EditPackItem = {
      id: `item_${Date.now()}`,
      name: newItem.name,
      size: newItem.size || "10 KB",
      downloadUrl: newItem.downloadUrl,
      description: newItem.description || "",
      previewBefore: newItem.previewBefore || "",
      previewAfter: newItem.previewAfter || "",
      previewVideo: newItem.previewVideo || "",
      status: newItem.status || "none"
    };

    const updatedCategories = editedContent.categories.map(c => {
      if (c.id === catId) {
        const updatedItems = [...c.items, newItemObj];
        // Automatically update category badge count
        const badgeWord = c.badge.split(" ").slice(1).join(" ") || "EFEKT";
        const newBadge = `${updatedItems.length} ${badgeWord.toUpperCase()}`;
        return { ...c, items: updatedItems, badge: newBadge };
      }
      return c;
    });

    setEditedContent({ ...editedContent, categories: updatedCategories });
    setNewItem({ name: "", size: "15 KB", downloadUrl: "", description: "", previewBefore: "", previewAfter: "", previewVideo: "", status: "none" });
  };

  const handleRemoveItem = (catId: string, itemId: string) => {
    const updatedCategories = editedContent.categories.map(c => {
      if (c.id === catId) {
        const updatedItems = c.items.filter(i => i.id !== itemId);
        const badgeWord = c.badge.split(" ").slice(1).join(" ") || "EFEKT";
        const newBadge = `${updatedItems.length} ${badgeWord.toUpperCase()}`;
        return { ...c, items: updatedItems, badge: newBadge };
      }
      return c;
    });
    setEditedContent({ ...editedContent, categories: updatedCategories });
  };

  const handleUpdateItemField = (catId: string, itemId: string, field: keyof EditPackItem, value: string) => {
    const updatedCategories = editedContent.categories.map(c => {
      if (c.id === catId) {
        const updatedItems = c.items.map(item => {
          if (item.id === itemId) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...c, items: updatedItems };
      }
      return c;
    });
    setEditedContent({ ...editedContent, categories: updatedCategories });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-5xl bg-zinc-950/95 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full filter blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full filter blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-5 sm:p-6 bg-zinc-900/30 border-b border-zinc-900 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20 shadow-inner">
                  <Shield size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-display font-black text-white tracking-tight uppercase">
                      Niklausae Yönetici Paneli
                    </h2>
                    <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded">
                      YAYINDA
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Sitenin tüm içeriklerini, odalarını ve indirme linklerini anında yönetin.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800/80 rounded-xl border border-zinc-800/60 transition-all cursor-pointer active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Login screen if not authenticated */}
            {!isAuthenticated ? (
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-md mx-auto text-center w-full">
                <motion.div 
                  initial={{ transform: "translateY(10px) scale(0.95)" }}
                  animate={{ transform: "translateY(0) scale(1)" }}
                  className="w-full p-8 bg-zinc-900/40 border border-zinc-900 rounded-3xl backdrop-blur-md"
                >
                  <div className="w-16 h-16 mx-auto flex items-center justify-center bg-zinc-950 border border-zinc-850 rounded-2xl mb-6 text-red-500 shadow-xl shadow-red-500/5">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-xl font-display font-black text-white mb-2 uppercase tracking-tight">KİMLİK DOĞRULAMA</h3>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Yönetim paneline erişmek ve verileri güncellemek için güvenlik şifresini girmelisiniz.
                  </p>
                  
                  <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Yönetici Şifresi"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-white text-center font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 transition-all shadow-inner"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {authError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 flex items-center justify-center gap-1.5 font-medium bg-red-950/25 py-2 px-3 rounded-lg border border-red-900/30"
                      >
                        <AlertTriangle size={13} /> {authError}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold rounded-xl border border-red-500 transition-all cursor-pointer shadow-lg shadow-red-600/15"
                    >
                      Panele Giriş Yap
                    </button>
                  </form>
                  <p className="text-[10px] text-zinc-600 mt-6 font-mono">Varsayılan şifre: <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-850/60">admin</code></p>
                </motion.div>
              </div>
            ) : (
              // Authenticated Admin Dashboard Layout
              <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-72 bg-zinc-900/10 border-b md:border-b-0 md:border-r border-zinc-900 p-4 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
                  <div className="hidden md:block px-3 pb-3">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-widest uppercase">MENÜLER</span>
                  </div>

                  <button
                    onClick={() => setActiveTab("general")}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer group ${
                      activeTab === "general" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/2" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "general" ? "bg-red-500/10 text-red-400" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"}`}>
                      <Settings size={15} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold tracking-wide">Genel Ayarlar</span>
                      <span className="hidden md:inline text-[10px] text-zinc-500 font-mono mt-0.5">Logo, başlıklar & pluginler</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("categories")}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer group ${
                      activeTab === "categories" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/2" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "categories" ? "bg-red-500/10 text-red-400" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"}`}>
                      <FolderOpen size={15} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold tracking-wide">Odalar & Paketler</span>
                      <span className="hidden md:inline text-[10px] text-zinc-500 font-mono mt-0.5">Kategori ve preset linkleri</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("bio")}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer group ${
                      activeTab === "bio" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/2" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "bio" ? "bg-red-500/10 text-red-400" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"}`}>
                      <User size={15} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold tracking-wide">Profil & Sosyal Medya</span>
                      <span className="hidden md:inline text-[10px] text-zinc-500 font-mono mt-0.5">Hakkımda kartı, görsel & stats</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer group ${
                      activeTab === "system" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-md shadow-red-500/2" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "system" ? "bg-red-500/10 text-red-400" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"}`}>
                      <Lock size={15} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold tracking-wide">Sistem & Şifre</span>
                      <span className="hidden md:inline text-[10px] text-zinc-500 font-mono mt-0.5">Sayac, güvenlik & koruma</span>
                    </div>
                  </button>
                </div>

                {/* Main Tab Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[50vh] md:max-h-[70vh] bg-zinc-950/20 scrollbar-thin">
                  
                  {/* TAB 1: GENERAL SETTINGS */}
                  {activeTab === "general" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Globe size={18} className="text-red-500" />
                        <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Ana Sayfa Başlıkları & Kimlik</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold flex items-center gap-1.5">
                            <span>ÜST LOGO YAZISI</span>
                            <span className="text-[9px] text-zinc-600">(Sol Üst Köşe)</span>
                          </label>
                          <input
                            type="text"
                            value={editedContent.settings.topBarText || ""}
                            placeholder="PARS MAZI PACK"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, topBarText: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] text-red-400 font-mono tracking-wide uppercase font-bold flex items-center gap-1.5">
                            <span>SAYFA YÜKLENİYOR YAZISI</span>
                            <span className="text-[9px] text-red-500/50">(Loader)</span>
                          </label>
                          <input
                            type="text"
                            value={editedContent.settings.loadingText || ""}
                            placeholder="PARS MAZI EDIT PACK yükleniyor..."
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, loadingText: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-red-950/50 focus:border-red-500 rounded-xl text-sm text-red-200 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-zinc-900/40 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold flex items-center gap-1.5">
                            <span>ÜST BRAND LOGO GÖRSELİ (OPSİYONEL)</span>
                          </label>
                          <input
                            type="text"
                            value={editedContent.settings.logoImage || ""}
                            placeholder="Görsel URL veya dosya yükleyin..."
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, logoImage: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <label className="text-[11px] text-zinc-500 font-mono tracking-wide uppercase font-bold">TELEFONDAN VEYA PC'DEN YÜKLE</label>
                          <MediaUploadButton 
                            label="Logo Resmi Seç / Kameradan Çek" 
                            accept="image/*"
                            onUploadSuccess={(url) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, logoImage: url }
                            })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">HERO ÜST ROZET</label>
                          <input
                            type="text"
                            value={editedContent.settings.heroBadge}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, heroBadge: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">ANA BAŞLIK (BÜYÜK YAZI)</label>
                          <input
                            type="text"
                            value={editedContent.settings.heroTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, heroTitle: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">KATEGORİ AÇIKLAMA YAZISI</label>
                        <textarea
                          rows={2}
                          value={editedContent.settings.heroSub}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            settings: { ...editedContent.settings, heroSub: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center gap-2 border-b border-zinc-900 pt-5 pb-3">
                        <Sparkles size={18} className="text-red-500" />
                        <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Kurulum & Pluginler Modülü</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">PLUGİN KART BAŞLIĞI</label>
                          <input
                            type="text"
                            value={editedContent.settings.pluginTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginTitle: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">PLUGİN KART AÇIKLAMASI</label>
                          <input
                            type="text"
                            value={editedContent.settings.pluginDesc}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginDesc: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">KURULUM VİDEOSU URL (YOUTUBE)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-zinc-500"><Link2 size={16} /></span>
                          <input
                            type="text"
                            value={editedContent.settings.pluginUrl}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginUrl: e.target.value }
                            })}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: CATEGORIES & DOWNLOADABLE ITEMS */}
                  {activeTab === "categories" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={18} className="text-red-500" />
                          <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Odalar (Kategoriler) ve Dosyalar</h3>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono px-2 py-0.5 bg-zinc-900 rounded-full border border-zinc-850">
                          {editedContent.categories.length} ODA MEVCUT
                        </span>
                      </div>

                      {/* Add New Category Card */}
                      <div className="relative p-5 sm:p-6 bg-gradient-to-br from-zinc-900/40 to-zinc-950 border border-zinc-900 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-red-600/10 text-red-500 rounded-lg">
                            <Plus size={14} />
                          </div>
                          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                            YENİ KATEGORİ (ODA) OLUŞTUR
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ODA ADI</label>
                            <input
                              type="text"
                              placeholder="örn: Shake Effects, Luts"
                              value={newCategory.title}
                              onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ROZET METNİ</label>
                            <input
                              type="text"
                              placeholder="örn: 5 ADET DETAY"
                              value={newCategory.badge}
                              onChange={(e) => setNewCategory({ ...newCategory, badge: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">RENGİ VE IŞIMASI</label>
                            <select
                              value={newCategory.gradient}
                              onChange={(e) => setNewCategory({ ...newCategory, gradient: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-zinc-300 focus:outline-none"
                            >
                              <option value="from-amber-500/20 to-red-600/10 hover:border-amber-500/40">Kırmızı - Turuncu Enerji</option>
                              <option value="from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40">Mavi - Çivit Derinlik</option>
                              <option value="from-teal-500/20 to-emerald-600/10 hover:border-teal-500/40">Zümrüt - Su Yeşili</option>
                              <option value="from-purple-500/20 to-fuchsia-600/10 hover:border-purple-500/40">Mor - Fuşya Kreatif</option>
                              <option value="from-pink-500/20 to-rose-600/10 hover:border-pink-500/40">Pembe - Gül Rüyası</option>
                              <option value="from-cyan-500/20 to-sky-600/10 hover:border-cyan-500/40">Turkuaz - Gökyüzü Esintisi</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">AÇIKLAMA METNİ</label>
                          <input
                            type="text"
                            placeholder="Kategori altında listelenecek açıklama yazısı..."
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={handleAddCategory}
                            disabled={!newCategory.title}
                            className="px-5 py-2.5 bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <Plus size={14} className="text-red-500" />
                            <span>Kategoriyi Ekle</span>
                          </button>
                        </div>
                      </div>

                      {/* Manage Existing Categories list */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider block">KATEGORİ LİSTESİ & DOSYALAR</span>
                        
                        {editedContent.categories.map((cat) => {
                          const isOpenDrawer = selectedCatId === cat.id;
                          const isEditingCat = editingCatId === cat.id;
                          return (
                            <div 
                              key={cat.id} 
                              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                                isOpenDrawer 
                                  ? "border-red-500/30 bg-zinc-950 shadow-lg shadow-red-500/2" 
                                  : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800"
                              }`}
                            >
                              {/* Category Card Header */}
                              <div className="p-4 sm:px-5 flex flex-col justify-between items-stretch gap-4">
                                {isEditingCat ? (
                                  <div className="space-y-4 bg-zinc-950/60 p-4 rounded-2xl border border-red-500/20">
                                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                      <div className="flex items-center gap-2">
                                        <FileEdit size={14} className="text-red-500" />
                                        <span className="text-xs font-mono font-bold text-red-400 tracking-wider">KATEGORİ DETAYLARINI DÜZENLE</span>
                                      </div>
                                      <span className="text-[9px] text-zinc-500 font-mono">ID: {cat.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">SIRA NO</label>
                                        <input
                                          type="text"
                                          value={cat.index}
                                          onChange={(e) => handleUpdateCategoryField(cat.id, "index", e.target.value)}
                                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                                          placeholder="örn: 01"
                                        />
                                      </div>
                                      <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">KATEGORİ (ODA) ADI</label>
                                        <input
                                          type="text"
                                          value={cat.title}
                                          onChange={(e) => handleUpdateCategoryField(cat.id, "title", e.target.value)}
                                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none font-bold"
                                          placeholder="Kategori Adı"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">ROZET METNİ</label>
                                        <input
                                          type="text"
                                          value={cat.badge}
                                          onChange={(e) => handleUpdateCategoryField(cat.id, "badge", e.target.value)}
                                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                                          placeholder="örn: VISUALS"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">RENK VE IŞIMA TEMASI</label>
                                        <select
                                          value={cat.gradient}
                                          onChange={(e) => handleUpdateCategoryField(cat.id, "gradient", e.target.value)}
                                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none"
                                        >
                                          <option value="from-amber-500/20 to-red-600/10 hover:border-amber-500/40">Kırmızı - Turuncu Enerji</option>
                                          <option value="from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40">Mavi - Çivit Derinlik</option>
                                          <option value="from-teal-500/20 to-emerald-600/10 hover:border-teal-500/40">Zümrüt - Su Yeşili</option>
                                          <option value="from-purple-500/20 to-fuchsia-600/10 hover:border-purple-500/40">Mor - Fuşya Kreatif</option>
                                          <option value="from-pink-500/20 to-rose-600/10 hover:border-pink-500/40">Pembe - Gül Rüyası</option>
                                          <option value="from-cyan-500/20 to-sky-600/10 hover:border-cyan-500/40">Turkuaz - Gökyüzü Esintisi</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">AÇIKLAMA YAZISI</label>
                                      <textarea
                                        value={cat.description || ""}
                                        onChange={(e) => handleUpdateCategoryField(cat.id, "description", e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-500/50 rounded-xl text-xs text-white focus:outline-none resize-none h-16"
                                        placeholder="Kategori altında listelenecek açıklama yazısı..."
                                      />
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                                      <span className="text-[9px] text-yellow-500/80 font-mono flex items-center gap-1">
                                        <Sparkles size={10} /> Değişiklikler anlık olarak taslağa işlenir.
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => setEditingCatId(null)}
                                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-red-600/10"
                                        >
                                          <Check size={12} />
                                          <span>Tamamla</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <div className="font-mono text-[11px] text-zinc-400 font-black bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-lg">
                                        {cat.index}
                                      </div>
                                      <div className="flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-display font-black text-white text-sm uppercase tracking-wide">
                                            {cat.title}
                                          </span>
                                          <span className="px-1.5 py-0.5 text-[8px] bg-zinc-900 text-zinc-400 font-mono border border-zinc-850 rounded">
                                            {cat.badge}
                                          </span>
                                        </div>
                                        {cat.description && (
                                          <p className="text-[11px] text-zinc-500 leading-normal max-w-md line-clamp-1">
                                            {cat.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
                                      <button
                                        onClick={() => setEditingCatId(cat.id)}
                                        className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                                        title="Kategori Bilgilerini Satır İçi Düzenle"
                                      >
                                        <Edit size={13} className="text-red-500" />
                                        <span className="hidden sm:inline">Hızlı Düzenle</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedCatId(isOpenDrawer ? "" : cat.id);
                                          // Close editing mode if managing items
                                          if (!isOpenDrawer) setEditingCatId(null);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                                          isOpenDrawer 
                                            ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                            : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                                        }`}
                                      >
                                        <FileText size={13} />
                                        <span>Dosyaları Yönet ({cat.items.length})</span>
                                        <ChevronRight size={12} className={`transform transition-transform ${isOpenDrawer ? "rotate-90 text-red-400" : "text-zinc-600"}`} />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveCategory(cat.id)}
                                        className="p-2 hover:bg-red-950/40 text-zinc-500 hover:text-red-500 rounded-xl border border-transparent hover:border-red-950 transition-all cursor-pointer"
                                        title="Kategoriyi ve Dosyaları Komple Sil"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Category Item Management (Slide out Drawer style) */}
                              {isOpenDrawer && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="border-t border-zinc-900 p-4 sm:p-5 bg-zinc-950 space-y-4"
                                >
                                  {/* SubHeader */}
                                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold font-mono tracking-wider">
                                    <FolderOpen size={13} className="text-red-500" />
                                    <span>"{cat.title.toUpperCase()}" DOSYALARI</span>
                                  </div>

                                  {/* Inner form to add a file */}
                                  <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3">
                                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest block">BU ODAYA DOSYA/PRESET EKLE</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">DOSYA/EFEKT ADI</label>
                                        <input
                                          type="text"
                                          placeholder="örn: Pars Cinematic CC"
                                          value={newItem.name}
                                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">DOSYA BOYUTU</label>
                                        <input
                                          type="text"
                                          placeholder="örn: 12 KB, 3.2 MB"
                                          value={newItem.size}
                                          onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">ETİKET/DURUM</label>
                                        <select
                                          value={newItem.status || "none"}
                                          onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50"
                                        >
                                          <option value="none">Normal (Etiketsiz)</option>
                                          <option value="new">YENİ</option>
                                          <option value="updated">GÜNCELLENDİ</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">İNDİRME BAĞLANTISI (URL)</label>
                                        <input
                                          type="text"
                                          placeholder="https://drive.google.com/..."
                                          value={newItem.downloadUrl}
                                          onChange={(e) => setNewItem({ ...newItem, downloadUrl: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-zinc-500 font-mono">KISACIK AÇIKLAMA (OPSİYONEL)</label>
                                      <input
                                        type="text"
                                        placeholder="Dosya hakkında kısa bir not..."
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-900 pt-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">ÖNCESİ RESİM (OPSİYONEL)</label>
                                        <input
                                          type="text"
                                          placeholder="https://gorsel-linki.com/oncesi.jpg veya dosya yükleyin"
                                          value={newItem.previewBefore || ""}
                                          onChange={(e) => setNewItem({ ...newItem, previewBefore: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 font-mono"
                                        />
                                        <MediaUploadButton 
                                          label="Görsel Seç / Kameradan Çek" 
                                          accept="image/*"
                                          onUploadSuccess={(url) => setNewItem({ ...newItem, previewBefore: url })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">SONRASI RESİM (OPSİYONEL)</label>
                                        <input
                                          type="text"
                                          placeholder="https://gorsel-linki.com/sonrasi.jpg veya dosya yükleyin"
                                          value={newItem.previewAfter || ""}
                                          onChange={(e) => setNewItem({ ...newItem, previewAfter: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 font-mono"
                                        />
                                        <MediaUploadButton 
                                          label="Görsel Seç / Kameradan Çek" 
                                          accept="image/*"
                                          onUploadSuccess={(url) => setNewItem({ ...newItem, previewAfter: url })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 font-mono">VİDEO ÖNİZLEME (OPSİYONEL)</label>
                                        <input
                                          type="text"
                                          placeholder="Video linki veya dosya yükleyin"
                                          value={newItem.previewVideo || ""}
                                          onChange={(e) => setNewItem({ ...newItem, previewVideo: e.target.value })}
                                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 font-mono"
                                        />
                                        <MediaUploadButton 
                                          label="Video Seç / Kaydet" 
                                          accept="video/*"
                                          onUploadSuccess={(url) => setNewItem({ ...newItem, previewVideo: url })}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                      <button
                                        onClick={() => handleAddItem(cat.id)}
                                        disabled={!newItem.name || !newItem.downloadUrl}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                      >
                                        <Plus size={13} />
                                        <span>Dosyayı Ekle</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* List items inside this category */}
                                  {cat.items.length === 0 ? (
                                    <div className="text-center py-6 px-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl">
                                      <p className="text-xs text-zinc-500">Bu odada henüz yüklü dosya bulunmuyor. Üstteki formdan anında ekleyin!</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2.5">
                                      <span className="text-[9px] font-mono text-zinc-500 tracking-wider block">YÜKLENMİŞ {cat.items.length} DOSYA</span>
                                      {cat.items.map((item) => (
                                        <div key={item.id} className="p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3 hover:border-zinc-850/60 transition-all">
                                          <div className="flex justify-between items-center gap-3">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                              <div className="space-y-1">
                                                <span className="text-[8px] text-zinc-500 font-mono">DOSYA ADI</span>
                                                <input
                                                  type="text"
                                                  value={item.name}
                                                  placeholder="Dosya Adı"
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "name", e.target.value)}
                                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-lg text-xs text-white outline-none"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-[8px] text-zinc-500 font-mono">BOYUTU</span>
                                                <input
                                                  type="text"
                                                  value={item.size}
                                                  placeholder="Boyut"
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "size", e.target.value)}
                                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-lg text-xs text-white outline-none"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-[8px] text-zinc-500 font-mono">ETİKET/DURUM</span>
                                                <select
                                                  value={item.status || "none"}
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "status", e.target.value)}
                                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-lg text-xs text-white outline-none"
                                                >
                                                  <option value="none">Normal (Etiketsiz)</option>
                                                  <option value="new">YENİ</option>
                                                  <option value="updated">GÜNCELLENDİ</option>
                                                </select>
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-[8px] text-zinc-500 font-mono">İNDİRME LİNKİ</span>
                                                <input
                                                  type="text"
                                                  value={item.downloadUrl}
                                                  placeholder="Bağlantı URL"
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "downloadUrl", e.target.value)}
                                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-lg text-xs text-zinc-300 font-mono outline-none"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => handleRemoveItem(cat.id, item.id)}
                                              className="p-2 hover:bg-red-950/50 text-zinc-600 hover:text-red-500 rounded-lg transition-colors cursor-pointer self-end mb-0.5"
                                              title="Dosyayı Kaldır"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                          <div className="space-y-1">
                                            <span className="text-[8px] text-zinc-500 font-mono">DOSYA AÇIKLAMASI</span>
                                            <input
                                              type="text"
                                              value={item.description}
                                              placeholder="Ek açıklama..."
                                              onChange={(e) => handleUpdateItemField(cat.id, item.id, "description", e.target.value)}
                                              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-lg text-xs text-white outline-none"
                                            />
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-900/60 pt-2 bg-zinc-950/20 p-2 rounded-xl mt-1">
                                            <div className="space-y-1">
                                              <span className="text-[8px] text-zinc-500 font-mono">ÖNCESİ RESİM URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewBefore || ""}
                                                placeholder="Öncesi görsel URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewBefore", e.target.value)}
                                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-md text-[11px] text-white outline-none font-mono"
                                              />
                                              <MediaUploadButton 
                                                label="Görsel Seç / Kameradan Çek" 
                                                accept="image/*"
                                                onUploadSuccess={(url) => handleUpdateItemField(cat.id, item.id, "previewBefore", url)}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <span className="text-[8px] text-zinc-500 font-mono">SONRASI RESİM URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewAfter || ""}
                                                placeholder="Sonrası görsel URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewAfter", e.target.value)}
                                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-md text-[11px] text-white outline-none font-mono"
                                              />
                                              <MediaUploadButton 
                                                label="Görsel Seç / Kameradan Çek" 
                                                accept="image/*"
                                                onUploadSuccess={(url) => handleUpdateItemField(cat.id, item.id, "previewAfter", url)}
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <span className="text-[8px] text-zinc-500 font-mono">VİDEO ÖNİZLEME URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewVideo || ""}
                                                placeholder="Video önizleme URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewVideo", e.target.value)}
                                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-md text-[11px] text-white outline-none font-mono"
                                              />
                                              <MediaUploadButton 
                                                label="Video Seç / Kaydet" 
                                                accept="video/*"
                                                onUploadSuccess={(url) => handleUpdateItemField(cat.id, item.id, "previewVideo", url)}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: PROFILE & SOCIAL */}
                  {activeTab === "bio" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <User size={18} className="text-red-500" />
                        <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Hakkımda & Kreatif Profil Kartı</h3>
                      </div>
                      
                      {/* Interactive Image Upload Section */}
                      <div className="p-5 sm:p-6 bg-gradient-to-br from-zinc-900/20 to-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <UploadCloud size={14} className="text-red-500" />
                          <label className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">TELEFONDAN / BİLGİSAYARDAN RESİM YÜKLE</label>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* Image Preview Card */}
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex-shrink-0 group shadow-lg">
                            {editedContent.settings.bioImage ? (
                              <>
                                <img src={editedContent.settings.bioImage} alt="Profile Preview" className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-300" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[9px] font-mono text-white">YÜKLENDİ</span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-[10px] text-center p-3">
                                <span className="font-bold">VARSAYILAN</span>
                                <span className="text-[8px] text-zinc-700 mt-1">Yükleme yapılmadı</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Upload Controls */}
                          <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-red-500/20 file:text-xs file:font-bold file:bg-red-600/10 file:text-red-500 hover:file:bg-red-600/20 cursor-pointer"
                            />
                            <p className="text-[10px] text-zinc-500 leading-relaxed max-w-md">Önerilen boyut kare (1:1), maksimum 2MB. Telefon galerinizden, kamerasından veya bilgisayarınızdan doğrudan bir fotoğraf seçip yükleyebilirsiniz.</p>
                            
                            {editedContent.settings.bioImage && (
                              <button
                                type="button"
                                onClick={() => setEditedContent({
                                  ...editedContent,
                                  settings: { ...editedContent.settings, bioImage: "" }
                                })}
                                className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                              >
                                Varsayılan Resme Geri Dön
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio Core Texts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">KREATİF PROFİL AD SOYAD</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioName || ""}
                            placeholder="PARS MAZI"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioName: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">KREATİF PROFİL ÜNVAN/ROL</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioRole || ""}
                            placeholder="VIDEO EDITOR • MOTION DESIGNER"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioRole: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">BİYOGRAFİ KART BAŞLIĞI</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioTitle: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">BİYOGRAFİ KART ALTBASLIGI (ROZET)</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioSub}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioSub: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">BİYOGRAFİ AÇIKLAMA METNİ (HAKKIMDA PARAGRAFI)</label>
                        <textarea
                          rows={3}
                          value={editedContent.settings.bioDescription || ""}
                          placeholder="Kendinizi tanıtın ve bu paketin amacını anlatın..."
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            settings: { ...editedContent.settings, bioDescription: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">PORTFÖY İNCELE BUTONU URL</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-zinc-500"><Link2 size={16} /></span>
                          <input
                            type="text"
                            value={editedContent.settings.portfolioUrl}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, portfolioUrl: e.target.value }
                            })}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Bento Stat widgets */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-red-500" />
                          <span className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase font-bold">Bento İstatistik Sayaç Kutuları</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {editedContent.settings.stats.map((st, idx) => (
                            <div key={idx} className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-2">
                              <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase block tracking-wider">KUTU {idx + 1}</span>
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={st.value}
                                  onChange={(e) => {
                                    const newStats = [...editedContent.settings.stats];
                                    newStats[idx].value = e.target.value;
                                    setEditedContent({
                                      ...editedContent,
                                      settings: { ...editedContent.settings, stats: newStats }
                                    });
                                  }}
                                  placeholder="Değer (örn: 10K+)"
                                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-bold text-red-400 text-center focus:outline-none focus:border-red-500/50"
                                />
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => {
                                    const newStats = [...editedContent.settings.stats];
                                    newStats[idx].label = e.target.value;
                                    setEditedContent({
                                      ...editedContent,
                                      settings: { ...editedContent.settings, stats: newStats }
                                    });
                                  }}
                                  placeholder="Etiket (örn: ABONE)"
                                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-[10px] text-zinc-400 text-center focus:outline-none focus:border-red-500/50 uppercase"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Social Channels view */}
                      <div className="space-y-3 pt-3">
                        <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                          <Globe size={14} className="text-red-500" />
                          <span className="text-xs font-mono font-bold text-zinc-400 tracking-wider uppercase">SOSYAL MEDYA LİNKLERİ</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(Object.keys(editedContent.settings.socialLinks) as Array<keyof typeof editedContent.settings.socialLinks>).map((platform) => {
                            const platformStr = String(platform);
                            let colorClass = "focus:border-red-500";
                            if (platformStr === "youtube") colorClass = "focus:border-red-500";
                            else if (platformStr === "instagram") colorClass = "focus:border-pink-500";
                            else if (platformStr === "discord") colorClass = "focus:border-blue-500";
                            else if (platformStr === "tiktok") colorClass = "focus:border-cyan-500";

                            const handleValue = editedContent.settings.socialHandles?.[platform] ?? "";
                            let handlePlaceholder = "";
                            if (platformStr === "youtube") handlePlaceholder = "PARS MAZI";
                            else if (platformStr === "instagram") handlePlaceholder = "@parsmazi";
                            else if (platformStr === "discord") handlePlaceholder = "SUNUCUYA KATIL";
                            else if (platformStr === "tiktok") handlePlaceholder = "@parsmazi";

                            return (
                              <div key={platformStr} className="space-y-2 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-900">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">{platformStr.toUpperCase()} KANALI URL</label>
                                  <input
                                    type="text"
                                    value={editedContent.settings.socialLinks[platform]}
                                    onChange={(e) => setEditedContent({
                                      ...editedContent,
                                      settings: {
                                        ...editedContent.settings,
                                        socialLinks: {
                                          ...editedContent.settings.socialLinks,
                                          [platform]: e.target.value
                                        }
                                      }
                                    })}
                                    className={`w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none ${colorClass} transition-colors font-mono`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">{platformStr.toUpperCase()} GÖRÜNEN AD / ETİKET</label>
                                  <input
                                    type="text"
                                    value={handleValue}
                                    placeholder={handlePlaceholder}
                                    onChange={(e) => {
                                      const currentHandles = editedContent.settings.socialHandles || {};
                                      setEditedContent({
                                        ...editedContent,
                                        settings: {
                                          ...editedContent.settings,
                                          socialHandles: {
                                            ...currentHandles,
                                            [platform]: e.target.value
                                          }
                                        }
                                      });
                                    }}
                                    className={`w-full px-3 py-2 bg-zinc-900/60 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none ${colorClass} transition-colors`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: SYSTEM & SECURITY */}
                  {activeTab === "system" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Hash size={18} className="text-red-500" />
                        <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Ziyaretçi Sayacı ve Sayaç Kontrolü</h3>
                      </div>
                      
                      <div className="space-y-2 p-5 bg-zinc-900/30 border border-zinc-900 rounded-3xl max-w-md">
                        <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block">TOPLAM SİTE ZİYARETÇİSİ</label>
                        <input
                          type="number"
                          value={editedContent.visitorCount}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            visitorCount: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-base text-red-500 font-mono font-bold focus:outline-none focus:border-red-500 transition-all"
                        />
                        <p className="text-[10px] text-zinc-500 leading-relaxed">Ana sayfa her ziyaret edildiğinde bu sayaç otomatik olarak artış gösterir. Buradan istediğiniz bir sayı ile sıfırlayabilir veya değiştirebilirsiniz.</p>
                      </div>

                      <div className="flex items-center gap-2 border-b border-zinc-900 pt-4 pb-3">
                        <Lock size={18} className="text-red-500" />
                        <h3 className="text-base font-display font-black text-white uppercase tracking-wider">Panel Güvenliği & Şifre Değiştir</h3>
                      </div>
                      
                      <div className="space-y-2.5 p-5 bg-zinc-900/30 border border-zinc-900 rounded-3xl max-w-md">
                        <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block">GÜVENLİK GEÇİŞ ŞİFRESİ</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Yeni Panel Şifresi"
                            value={editedContent.settings.adminPassword || ""}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, adminPassword: e.target.value }
                            })}
                            className="w-full pl-4 pr-11 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-red-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">Yönetici paneline giriş yaparken koruma sağlayan şifre. Değiştirdikten sonra kaydet butonuna tıklayarak güncelleyebilirsiniz.</p>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            )}

            {/* Bottom Footer Actions (Active if Authenticated) */}
            {isAuthenticated && (
              <div className="relative z-10 p-4 sm:p-5 bg-zinc-900 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  {saveStatus.type === "success" && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1.5"
                    >
                      <CheckCircle size={15} /> <span>{saveStatus.msg}</span>
                    </motion.span>
                  )}
                  {saveStatus.type === "error" && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-bold flex items-center justify-center sm:justify-start gap-1.5"
                    >
                      <AlertTriangle size={15} /> <span>{saveStatus.msg}</span>
                    </motion.span>
                  )}
                  {!saveStatus.type && (
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">KAYDEDİLMEMİŞ DEĞİŞİKLİKLER BULUNABİLİR</span>
                  )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthenticated(false);
                      setPasswordInput("");
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer border border-zinc-850/60 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer border border-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/15 active:scale-98"
                  >
                    <Save size={14} />
                    <span>{isSaving ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
