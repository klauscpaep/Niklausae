import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Save, Shield, Settings, FolderOpen, User, Lock, Plus, Trash2, 
  Link2, FileText, CheckCircle, AlertTriangle, Eye, EyeOff, UploadCloud, 
  TrendingUp, Award, ExternalLink, Globe, Hash, Sparkles, ChevronRight, Check,
  Edit, FileEdit, Loader2, LayoutDashboard, Calendar, Clock, Database, Activity, 
  FileArchive, Users, Flame, CornerDownRight, Laptop, HelpCircle, Megaphone, Bell, ThumbsUp
} from "lucide-react";
import { SiteContent, Category, EditPackItem } from "../types";
import defaultProfileImg from "../assets/images/pars_mazi_profile_1784000260155.jpg";

// Reusable Media Upload Button supporting image and video uploads directly from PC or Phone
interface MediaUploadButtonProps {
  label: string;
  onUploadSuccess: (url: string) => void;
  accept?: string;
}

function MediaUploadButton({ label, onUploadSuccess, accept = "image/*,video/*" }: MediaUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = (file: File): Promise<{ base64: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            // Fill dark background matching layout for transparent PNGs before converting to JPEG
            ctx.fillStyle = "#0c0d12";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }

          const base64Url = canvas.toDataURL("image/jpeg", 0.75);
          const base64Data = base64Url.split(",")[1];
          resolve({ base64: base64Data, contentType: "image/jpeg" });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

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

    // If file is an image, perform client-side compression and save permanently in Firestore
    if (file.type.startsWith("image/")) {
      try {
        const compressed = await compressImage(file);
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(compressed),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            onUploadSuccess(data.url);
            setUploading(false);
            return;
          }
        }
      } catch (imgErr) {
        console.warn("Client-side image compression or permanent upload failed, falling back to standard upload...", imgErr);
      }
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Try local server upload first
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          onUploadSuccess(data.url);
          setUploading(false);
          return;
        }
      }

      // 2. Local upload failed or was rejected, fall back to high-speed tmpfiles.org
      console.log("Local media upload failed. Falling back to tmpfiles.org...");
      const extRes = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (extRes.ok) {
        const extData = await extRes.json();
        if (extData.status === "success" && extData.data?.url) {
          const directUrl = extData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
          onUploadSuccess(directUrl);
          setUploading(false);
          return;
        }
      }
      
      setError("Dosya yüklenemedi. Sunucu limiti aşılmış olabilir. Lütfen daha küçük bir dosya seçin.");
    } catch (err: any) {
      // Try direct external upload if there is a network issue with local server
      try {
        const extRes = await fetch("https://tmpfiles.org/api/v1/upload", {
          method: "POST",
          body: formData,
        });
        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData.status === "success" && extData.data?.url) {
            const directUrl = extData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            onUploadSuccess(directUrl);
            setUploading(false);
            return;
          }
        }
      } catch (extErr) {
        console.error("External upload error:", extErr);
      }
      setError(`Bağlantı hatası: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-1 w-full">
      <label className="relative flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900/60 hover:bg-zinc-850 active:scale-95 text-[10px] font-mono font-extrabold text-zinc-400 hover:text-white rounded-xl border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all shadow-inner">
        {uploading ? (
          <>
            <Loader2 size={11} className="animate-spin text-amber-400" />
            <span>YÜKLENİYOR...</span>
          </>
        ) : (
          <>
            <UploadCloud size={11} className="text-amber-400" />
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

type TabType = "dashboard" | "general" | "categories" | "announcements" | "bio" | "system" | "requests";

export default function AdminPanel({ content, isOpen, onClose, onSave }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states copied from content
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [editedContent, setEditedContent] = useState<SiteContent>(JSON.parse(JSON.stringify(content)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // FAQ Admin state
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", active: true });
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // Temp states for adding category/item
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [newItem, setNewItem] = useState<Partial<EditPackItem>>({ name: "", size: "15 KB", downloadUrl: "", description: "", status: "none" });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ 
    title: "", 
    badge: "", 
    description: "", 
    gradient: "from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40" 
  });

  // Clock state for the Turkish Time Display (Dashboard feeling)
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync requests & visitorCount in real-time from parent content
  useEffect(() => {
    if (content) {
      setEditedContent(prev => {
        if (!prev) return JSON.parse(JSON.stringify(content));
        return {
          ...prev,
          requests: content.requests || [],
          visitorCount: content.visitorCount || 0,
          faqs: content.faqs || prev.faqs,
          categories: prev.categories // Preserve active category edits in progress
        };
      });
    }
  }, [content]);

  // Pre-made premium announcement templates for video editing / resource pack site
  const DUYURU_TEMPLATES = [
    {
      title: "🔥 YENİ EFEKT PAKETİ YAYINDA!",
      message: "Harika bir After Effects kurgu paketi arşive eklendi! Hemen aşağı kaydırarak 'Odalar & Dosyalar' kısmından indir.",
      type: "success" as const,
      linkText: "Paketleri İncele",
      linkUrl: ""
    },
    {
      title: "⚡ KISA SÜRELİ %50 İNDİRİM KAMPANYASI!",
      message: "Tüm özel After Effects şablonları ve premium paketlerde geçerli indirim kodu: 'KREATIF50'. Fırsatı kaçırma!",
      type: "warning" as const,
      linkText: "Instagram Detay",
      linkUrl: "https://instagram.com"
    },
    {
      title: "💬 RESMİ DISCORD SUNUCUMUZA KATILIN!",
      message: "Diğer video editörleri ve kurgucularla tanışmak, tasarımlarını paylaşmak ve anında destek almak için Discord'a gel.",
      type: "info" as const,
      linkText: "Sunucuya Katıl",
      linkUrl: "https://discord.gg"
    },
    {
      title: "📺 AFTER EFFECTS KURULUM REHBERİ YAYINDA!",
      message: "Sitedeki paketlerin ve pluginlerin bilgisayarınıza nasıl kurulacağını adım adım anlattığım yeni YouTube videomu izleyin!",
      type: "announcement" as const,
      linkText: "Eğitimi İzle",
      linkUrl: "https://youtube.com"
    },
    {
      title: "🛠️ KISA SÜRELİ SİSTEM GÜNCELLEMESİ",
      message: "Arşiv altyapımızı güçlendiriyoruz. Bazı indirme linkleri kısa süreliğine güncellenebilir. Sabrınız için teşekkürler!",
      type: "danger" as const,
      linkText: "Sorun Bildir",
      linkUrl: "https://instagram.com"
    }
  ];

  // Announcement Form State
  const [annForm, setAnnForm] = useState({
    title: "",
    message: "",
    type: "announcement" as "info" | "warning" | "success" | "danger" | "announcement",
    linkText: "",
    linkUrl: "",
    active: true
  });
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // 1-Click publish template directly
  const handlePublishTemplate = (tpl: typeof DUYURU_TEMPLATES[0]) => {
    const newAnn = {
      id: "ann-" + Math.random().toString(36).substring(2, 9),
      title: tpl.title,
      message: tpl.message,
      type: tpl.type,
      linkText: tpl.linkText,
      linkUrl: tpl.linkUrl,
      active: true,
      createdAt: new Date().toISOString()
    };
    const current = editedContent.announcements || [];
    setEditedContent({
      ...editedContent,
      announcements: [newAnn, ...current]
    });
    setSaveStatus({ type: "success", msg: "Şablon yayına eklendi! Kaydet butonuna tıklayarak kalıcı hale getirin." });
    setTimeout(() => setSaveStatus({ type: null, msg: "" }), 5000);
  };

  // Load template details into editor for editing
  const handleLoadTemplate = (tpl: typeof DUYURU_TEMPLATES[0]) => {
    setAnnForm({
      title: tpl.title,
      message: tpl.message,
      type: tpl.type,
      linkText: tpl.linkText,
      linkUrl: tpl.linkUrl,
      active: true
    });
    setEditingAnnId(null);
  };

  // Save the custom composed announcement form
  const handleSaveAnnForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.message.trim()) {
      alert("Lütfen başlık ve mesaj alanlarını doldurun!");
      return;
    }

    const currentAnns = [...(editedContent.announcements || [])];

    if (editingAnnId) {
      // Edit Mode
      const idx = currentAnns.findIndex(a => a.id === editingAnnId);
      if (idx !== -1) {
        currentAnns[idx] = {
          ...currentAnns[idx],
          title: annForm.title,
          message: annForm.message,
          type: annForm.type,
          linkText: annForm.linkText,
          linkUrl: annForm.linkUrl,
          active: annForm.active
        };
      }
      setEditingAnnId(null);
    } else {
      // Create Mode
      const newAnn = {
        id: "ann-" + Math.random().toString(36).substring(2, 9),
        title: annForm.title,
        message: annForm.message,
        type: annForm.type,
        linkText: annForm.linkText,
        linkUrl: annForm.linkUrl,
        active: annForm.active,
        createdAt: new Date().toISOString()
      };
      currentAnns.unshift(newAnn);
    }

    setEditedContent({
      ...editedContent,
      announcements: currentAnns
    });

    // Reset Form
    setAnnForm({
      title: "",
      message: "",
      type: "announcement",
      linkText: "",
      linkUrl: "",
      active: true
    });

    setSaveStatus({ type: "success", msg: "Duyuru listeye eklendi! Değişiklikleri kaydetmeyi unutmayın." });
    setTimeout(() => setSaveStatus({ type: null, msg: "" }), 5000);
  };

  // Delete announcement from list
  const handleDeleteAnn = (id: string) => {
    const currentAnns = (editedContent.announcements || []).filter(a => a.id !== id);
    setEditedContent({
      ...editedContent,
      announcements: currentAnns
    });
    if (editingAnnId === id) {
      setEditingAnnId(null);
    }
  };

  // Toggle active status in list
  const handleToggleAnnActive = (id: string) => {
    const currentAnns = (editedContent.announcements || []).map(a => {
      if (a.id === id) {
        return { ...a, active: !a.active };
      }
      return a;
    });
    setEditedContent({
      ...editedContent,
      announcements: currentAnns
    });
  };

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
        setSaveStatus({ type: "success", msg: "Tüm değişiklikler başarıyla kaydedildi ve yayınlandı!" });
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

  // Calculations for dashboard
  const totalCategoriesCount = editedContent.categories.length;
  const totalItemsCount = editedContent.categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  const totalVisitorCount = editedContent.visitorCount || 0;

  // Retrieve all files flat list for "Recent Uploads" view on dashboard
  const allUploadedFilesFlat: { catTitle: string; catId: string; item: EditPackItem }[] = [];
  editedContent.categories.forEach(cat => {
    (cat.items || []).forEach(item => {
      allUploadedFilesFlat.push({ catTitle: cat.title, catId: cat.id, item });
    });
  });
  // Slices up to last 4 files
  const recentFiles = allUploadedFilesFlat.slice(-4).reverse();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-[1360px] h-[95vh] bg-[#0c0d12] border border-zinc-850 rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans"
          >
            {/* Cinematic Cyber Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.04] rounded-full filter blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full filter blur-[180px] pointer-events-none" />
            <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-red-600/[0.02] rounded-full filter blur-[130px] pointer-events-none" />

            {/* Login screen if not authenticated */}
            {!isAuthenticated ? (
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-lg mx-auto w-full">
                <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2.5 text-zinc-500 hover:text-white bg-zinc-900/60 hover:bg-zinc-850 rounded-2xl border border-zinc-850 transition-all cursor-pointer active:scale-95"
                >
                  <X size={18} />
                </button>

                <motion.div 
                  initial={{ transform: "translateY(15px) scale(0.96)", opacity: 0 }}
                  animate={{ transform: "translateY(0) scale(1)", opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="w-full p-8 sm:p-10 bg-zinc-950/50 border border-zinc-900/80 rounded-[28px] backdrop-blur-md shadow-2xl relative overflow-hidden"
                >
                  {/* Subtle border shine */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                  
                  <div className="w-16 h-16 mx-auto flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 text-red-500 shadow-xl shadow-red-500/5">
                    <Shield size={28} className="animate-pulse" />
                  </div>
                  
                  <h3 className="text-xl font-display font-black text-white text-center mb-2 uppercase tracking-wide">
                    ADMINATOR KONSOLU
                  </h3>
                  <p className="text-xs text-zinc-400 text-center mb-8 leading-relaxed max-w-sm mx-auto">
                    Kreatif Edit Arşivi sitesinin tüm odalarını, presetlerini ve biyografi detaylarını yönetmek için kimlik doğrulaması gerekiyor.
                  </p>
                  
                  <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">YÖNETİCİ ŞİFRESİ</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Şifreyi giriniz"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-5 pr-12 py-3.5 bg-[#090a0f] border border-zinc-850 hover:border-zinc-800 focus:border-red-500 rounded-xl text-white text-center font-mono text-sm placeholder:text-zinc-600 focus:outline-none transition-all"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    {authError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 flex items-center justify-center gap-1.5 font-bold font-mono bg-red-950/20 py-2.5 px-3 rounded-xl border border-red-900/30 text-center"
                      >
                        <AlertTriangle size={13} /> {authError}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest rounded-xl border border-red-500 transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center justify-center gap-2"
                    >
                      <span>PANELI BAŞLAT</span>
                      <ChevronRight size={14} />
                    </button>
                  </form>
                  <p className="text-[10px] text-zinc-600 mt-6 font-mono text-center">Varsayılan şifre: <code className="bg-[#050608] px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-850/60">admin</code></p>
                </motion.div>
              </div>
            ) : (
              // Authenticated Admin Dashboard Layout (Premium Inspired by Adminator)
              <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                
                {/* 1. FUTURISTIC SIDEBAR NAVIGATION */}
                <div className="w-full md:w-64 bg-[#0a0b0f] border-b md:border-b-0 md:border-r border-zinc-900 p-3 md:p-5 flex flex-col md:justify-between shrink-0 gap-3 md:gap-6">
                  {/* Brand & Mobile Layout Combined */}
                  <div className="flex flex-col gap-3 md:gap-6">
                    {/* Header Brand */}
                    <div className="flex items-center justify-between md:justify-start gap-3 pb-2 md:pb-4 border-b border-zinc-900/80">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 shrink-0">
                          <Activity size={16} className="animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-display font-black text-white uppercase tracking-wider">KONSOL</span>
                          <span className="text-[8px] md:text-[9px] text-zinc-500 font-mono font-bold tracking-widest uppercase">OWNER ADMIN</span>
                        </div>
                      </div>
                      
                      {/* Compact avatar for mobile only */}
                      <img 
                        src={editedContent.settings.bioImage || defaultProfileImg} 
                        alt="Profil Resmi" 
                        className="md:hidden w-7 h-7 rounded-lg object-cover grayscale border border-zinc-800"
                      />
                    </div>

                    {/* Premium Profile Widget - Hidden on mobile to save vertical space */}
                    <div className="hidden md:flex p-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl items-center gap-3.5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/[0.02] rounded-full filter blur-md" />
                      <div className="relative shrink-0">
                        <img 
                          src={editedContent.settings.bioImage || defaultProfileImg} 
                          alt="Profil Resmi" 
                          className="w-11 h-11 rounded-xl object-cover grayscale brightness-95 border border-zinc-800"
                        />
                        <span className="absolute bottom-[-2px] right-[-2px] w-3 h-3 bg-indigo-500 rounded-full border-2 border-[#0a0b0f] flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-white" />
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-white truncate uppercase tracking-wide">
                          {editedContent.settings.bioName || "Kreatif Editör"}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold truncate tracking-wider uppercase">
                          {editedContent.settings.bioRole || "Video Editor"}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items: Vertical list on desktop, scrollable horizontal pills on mobile */}
                    <div className="space-y-1">
                      <span className="hidden md:block text-[9px] font-mono font-extrabold text-zinc-600 tracking-widest uppercase px-2.5 pb-2">MENÜLER</span>
                      
                      <div className="flex flex-row md:flex-col gap-1.5 md:gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
                        <button
                          onClick={() => setActiveTab("dashboard")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "dashboard" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <LayoutDashboard size={13} className={activeTab === "dashboard" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Dashboard</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("general")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "general" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <Settings size={13} className={activeTab === "general" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Genel Ayarlar</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("categories")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "categories" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <FolderOpen size={13} className={activeTab === "categories" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Odalar & Dosyalar</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("announcements")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "announcements" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <Megaphone size={13} className={activeTab === "announcements" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Duyuru Yönetimi</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("bio")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "bio" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <User size={13} className={activeTab === "bio" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Profil & Sosyal</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("system")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "system" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <Lock size={13} className={activeTab === "system" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">Sayaç & Güvenlik</span>
                        </button>

                        <button
                          onClick={() => setActiveTab("requests")}
                          className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-3 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold transition-all shrink-0 cursor-pointer group ${
                            activeTab === "requests" 
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent"
                          }`}
                        >
                          <HelpCircle size={13} className={activeTab === "requests" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <span className="tracking-wide">İstek & SSS</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar bottom info */}
                  <div className="space-y-3 pt-4 border-t border-zinc-900/60 hidden md:block">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <Database size={11} className="text-indigo-500" />
                      <span>Firestore: Bağlı</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <Laptop size={11} className="text-amber-500" />
                      <span>Sürüm: v1.4.0 Live</span>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0e14]">
                  
                  {/* 2. PREMIUM TOP NAVIGATION HEADER BAR */}
                  <div className="h-16 px-6 border-b border-zinc-900/60 flex items-center justify-between shrink-0 bg-[#090a0f]">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-black text-zinc-500 tracking-widest uppercase">
                        KONSOL
                      </span>
                      <span className="text-zinc-700 text-xs">/</span>
                      <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                        {activeTab === "dashboard" && "Genel İstatistikler & Özet"}
                        {activeTab === "general" && "Site Genel Ayarları"}
                        {activeTab === "categories" && "Oda & Dosya Konfigürasyonu"}
                        {activeTab === "announcements" && "Duyurular & Tek Tıkla Hazır Taslaklar"}
                        {activeTab === "bio" && "Kişisel Biyografi & Linkler"}
                        {activeTab === "system" && "Sayaçlar & Güvenlik Şifresi"}
                        {activeTab === "requests" && "Kullanıcı İstekleri & SSS Yönetimi"}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Live Server Digital Clock */}
                      <div className="hidden lg:flex items-center gap-4 border-r border-zinc-900 pr-6">
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] font-semibold">
                          <Calendar size={13} className="text-indigo-500" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-mono text-xs font-bold bg-[#141620] px-3 py-1 rounded-lg border border-zinc-800 shadow-inner">
                          <Clock size={13} className="text-indigo-400" />
                          <span>{timeStr}</span>
                        </div>
                      </div>

                      {/* Exit Control */}
                      <button 
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white bg-[#11131a] hover:bg-zinc-800 rounded-xl border border-zinc-800/80 transition-all cursor-pointer active:scale-95"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 3. SCROLLABLE TAB CONTAINER */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-8 scrollbar-thin">
                    
                    {/* TAB: DASHBOARD (Overview with Premium Curved Wave Chart and Statistics) */}
                    {activeTab === "dashboard" && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Interactive Dynamic Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          
                          {/* Total Visitors card */}
                          <div className="p-5 bg-gradient-to-br from-zinc-900/30 via-[#0d0e14] to-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/[0.02] rounded-full filter blur-md" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-wider block">TOPLAM ZİYARET</span>
                                <h3 className="text-2xl font-display font-black text-white tracking-tight font-mono">
                                  {totalVisitorCount.toLocaleString("tr-TR")}
                                </h3>
                              </div>
                              <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                                <Users size={16} />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-rose-400 bg-rose-950/10 border border-rose-950/20 px-2 py-0.5 rounded-lg w-max">
                              <TrendingUp size={11} />
                              <span>+12% BU HAFTA</span>
                            </div>
                          </div>

                          {/* Total categories card */}
                          <div className="p-5 bg-gradient-to-br from-zinc-900/30 via-[#0d0e14] to-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/[0.02] rounded-full filter blur-md" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-wider block">AKTİF ODALAR</span>
                                <h3 className="text-2xl font-display font-black text-white tracking-tight font-mono">
                                  {totalCategoriesCount}
                                </h3>
                              </div>
                              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                                <FolderOpen size={16} />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 bg-indigo-950/10 border border-indigo-950/20 px-2 py-0.5 rounded-lg w-max">
                              <Check size={11} />
                              <span>TÜMÜ YAYINDA</span>
                            </div>
                          </div>

                          {/* Total downloadable files card */}
                          <div className="p-5 bg-gradient-to-br from-zinc-900/30 via-[#0d0e14] to-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/[0.02] rounded-full filter blur-md" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-wider block">TOPLAM PRESET / DOSYA</span>
                                <h3 className="text-2xl font-display font-black text-white tracking-tight font-mono">
                                  {totalItemsCount}
                                </h3>
                              </div>
                              <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                                <FileArchive size={16} />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-950/10 border border-amber-950/20 px-2 py-0.5 rounded-lg w-max">
                              <Flame size={11} className="animate-pulse" />
                              <span>POPÜLER DOSYALAR</span>
                            </div>
                          </div>

                          {/* Security console lock card */}
                          <div className="p-5 bg-gradient-to-br from-zinc-900/30 via-[#0d0e14] to-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/[0.02] rounded-full filter blur-md" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-wider block">GÜVENLİK DUVARI</span>
                                <h3 className="text-lg font-display font-black text-emerald-400 tracking-tight font-mono uppercase mt-1">
                                  AKTİF SECURE
                                </h3>
                              </div>
                              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                                <Shield size={16} />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/10 border border-emerald-950/20 px-2 py-0.5 rounded-lg w-max">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                              <span>LOGLAR KORUMALI</span>
                            </div>
                          </div>

                        </div>

                        {/* PREMIUM CHART CARD (Curving area wave chart mimicking the admin reference image perfectly) */}
                        <div className="p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/[0.01] rounded-full filter blur-2xl" />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                              <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">
                                PERFORMANS RAPORU & VERİ ANALİZİ
                              </span>
                              <h3 className="text-base font-display font-black text-white uppercase tracking-tight mt-1">
                                Ziyaretçi Etkileşim Grafiği (Aylık Trend)
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-xl text-[10px] font-mono font-extrabold">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-zinc-300">AYLIK TRAFİK HIZI</span>
                            </div>
                          </div>

                          {/* handcraft premium SVG Wave line chart */}
                          <div className="w-full h-64 md:h-72 relative">
                            <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                {/* Linear Gradients matching reference dashboard */}
                                <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="gradientPink" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="50%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                              </defs>

                              {/* Grid lines */}
                              <line x1="0" y1="50" x2="1000" y2="50" stroke="#181824" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="0" y1="125" x2="1000" y2="125" stroke="#181824" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="0" y1="200" x2="1000" y2="200" stroke="#181824" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="0" y1="275" x2="1000" y2="275" stroke="#181824" strokeWidth="1" />

                              {/* Bottom Area Path (Pink Gradient back wave) */}
                              <path 
                                d="M 0 275 C 100 240, 200 220, 300 250 C 400 280, 500 190, 600 210 C 700 230, 800 140, 900 170 C 950 185, 1000 120, 1000 120 L 1000 275 Z" 
                                fill="url(#gradientPink)"
                              />

                              {/* Top Area Path (Blue Gradient front wave) */}
                              <path 
                                d="M 0 275 C 100 210, 200 150, 300 190 C 400 230, 500 110, 600 140 C 700 170, 800 80, 900 110 C 950 125, 1000 60, 1000 60 L 1000 275 Z" 
                                fill="url(#gradientBlue)"
                              />

                              {/* Back curving neon glowing line */}
                              <path 
                                d="M 0 275 C 100 240, 200 220, 300 250 C 400 280, 500 190, 600 210 C 700 230, 800 140, 900 170 C 950 185, 1000 120, 1000 120" 
                                fill="none" 
                                stroke="#f43f5e" 
                                strokeWidth="2" 
                                strokeLinecap="round"
                              />

                              {/* Main curving glowing stroke */}
                              <path 
                                d="M 0 275 C 100 210, 200 150, 300 190 C 400 230, 500 110, 600 140 C 700 170, 800 80, 900 110 C 950 125, 1000 60, 1000 60" 
                                fill="none" 
                                stroke="url(#strokeGradient)" 
                                strokeWidth="4.5" 
                                strokeLinecap="round"
                              />

                              {/* Plot points and values */}
                              <circle cx="300" cy="190" r="5" fill="#3b82f6" stroke="#0a0b0f" strokeWidth="2" />
                              <circle cx="600" cy="140" r="5" fill="#8b5cf6" stroke="#0a0b0f" strokeWidth="2" />
                              <circle cx="900" cy="110" r="5" fill="#ec4899" stroke="#0a0b0f" strokeWidth="2" />

                            </svg>

                            {/* Ticks & Labels */}
                            <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest">
                              <span>OCAK</span>
                              <span>ŞUBAT</span>
                              <span>MART</span>
                              <span>NİSAN</span>
                              <span>MAYIS</span>
                              <span>HAZİRAN</span>
                              <span>TEMMUZ</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Uploaded Files & Quick Actions Bento Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          
                          {/* Recent Uploaded Files Feed Card */}
                          <div className="p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] lg:col-span-7 space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                              <FileText size={15} className="text-indigo-400" />
                              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Son Eklenen Dosyalar</h4>
                            </div>

                            {recentFiles.length === 0 ? (
                              <div className="h-36 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">HENÜZ HİÇBİR DOSYA YÜKLENMEMİŞ</span>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {recentFiles.map(({ catTitle, catId, item }) => (
                                  <div 
                                    key={item.id}
                                    className="p-3 bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-3.5 group transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-white transition-colors">
                                        <FileArchive size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors truncate">
                                          {item.name}
                                        </h5>
                                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
                                          <span>{catTitle}</span>
                                          <span>•</span>
                                          <span>{item.size}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setSelectedCatId(catId);
                                        setActiveTab("categories");
                                      }}
                                      className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg transition-all active:scale-95 cursor-pointer"
                                    >
                                      <ChevronRight size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Help & Shortcuts Card */}
                          <div className="p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] lg:col-span-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                              <HelpCircle size={15} className="text-indigo-400" />
                              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Hızlı Kısayollar</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => {
                                  setActiveTab("categories");
                                  setSelectedCatId("");
                                }}
                                className="p-3 bg-zinc-950/50 hover:bg-indigo-500/10 border border-zinc-900 hover:border-indigo-500/20 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                              >
                                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block group-hover:translate-x-0.5 transition-transform">ODA OLUŞTUR</span>
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Kategori Ekle</span>
                              </button>

                              <button 
                                onClick={() => setActiveTab("general")}
                                className="p-3 bg-zinc-950/50 hover:bg-indigo-500/10 border border-zinc-900 hover:border-indigo-500/20 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                              >
                                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block group-hover:translate-x-0.5 transition-transform">HERO AYARI</span>
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Başlığı Düzenle</span>
                              </button>

                              <button 
                                onClick={() => setActiveTab("bio")}
                                className="p-3 bg-zinc-950/50 hover:bg-indigo-500/10 border border-zinc-900 hover:border-indigo-500/20 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                              >
                                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block group-hover:translate-x-0.5 transition-transform">SOSYAL MEDYA</span>
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Linkleri Değiştir</span>
                              </button>

                              <button 
                                onClick={() => setActiveTab("system")}
                                className="p-3 bg-zinc-950/50 hover:bg-indigo-500/10 border border-zinc-900 hover:border-indigo-500/20 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                              >
                                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block group-hover:translate-x-0.5 transition-transform">GÜVENLİK</span>
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Şifre & Sayaç</span>
                              </button>
                            </div>

                            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                              <Shield size={16} className="text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                              <p className="text-[10px] text-zinc-400 leading-normal font-mono">
                                Yapılan tüm işlemler, kaydet butonuna basıldığında anında güvenli Firestore veritabanına işlenerek yayına alınır.
                              </p>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}

                    {/* TAB: GENERAL SETTINGS */}
                    {activeTab === "general" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                          <Globe size={18} className="text-indigo-400" />
                          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Ana Sayfa Başlıkları & Kimlik</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold flex items-center gap-1.5">
                              <span>ÜST LOGO YAZISI</span>
                              <span className="text-[9px] text-zinc-600">(Sol Üst Köşe)</span>
                            </label>
                            <input
                              type="text"
                              value={editedContent.settings.topBarText || ""}
                              placeholder="KREATİF EDİT PACK"
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, topBarText: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold flex items-center gap-1.5">
                              <span>SAYFA YÜKLENİYOR YAZISI</span>
                              <span className="text-[9px] text-zinc-600">(Loader)</span>
                            </label>
                            <input
                              type="text"
                              value={editedContent.settings.loadingText || ""}
                              placeholder="KREATİF EDİT PACK yükleniyor..."
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, loadingText: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-zinc-900/60 pt-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">ÜST BRAND LOGO GÖRSELİ (OPSİYONEL)</label>
                            <input
                              type="text"
                              value={editedContent.settings.logoImage || ""}
                              placeholder="Görsel URL veya dosya yükleyin..."
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, logoImage: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase font-extrabold">DOĞRUDAN DOSYA YÜKLE</label>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">HERO ÜST ROZET</label>
                            <input
                              type="text"
                              value={editedContent.settings.heroBadge}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, heroBadge: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">ANA BAŞLIK (BÜYÜK YAZI)</label>
                            <input
                              type="text"
                              value={editedContent.settings.heroTitle}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, heroTitle: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">KATEGORİ AÇIKLAMA YAZISI</label>
                          <textarea
                            rows={2}
                            value={editedContent.settings.heroSub}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, heroSub: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all resize-none leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center gap-2 border-b border-zinc-900 pt-5 pb-3">
                          <Sparkles size={18} className="text-indigo-400" />
                          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Kurulum & Pluginler Modülü</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">PLUGİN KART BAŞLIĞI</label>
                            <input
                              type="text"
                              value={editedContent.settings.pluginTitle}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, pluginTitle: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">PLUGİN KART AÇIKLAMASI</label>
                            <input
                              type="text"
                              value={editedContent.settings.pluginDesc}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, pluginDesc: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">KURULUM VİDEOSU URL (YOUTUBE)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-zinc-500"><Link2 size={16} /></span>
                            <input
                              type="text"
                              value={editedContent.settings.pluginUrl}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, pluginUrl: e.target.value }
                              })}
                              className="w-full pl-11 pr-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB: CATEGORIES & DOWNLOADABLE ITEMS */}
                    {activeTab === "categories" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5">
                          <div className="flex items-center gap-2">
                            <FolderOpen size={18} className="text-indigo-400" />
                            <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Odalar (Kategoriler) ve Dosyalar</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setIsAddingCategory(!isAddingCategory)}
                              className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>{isAddingCategory ? "Formu Gizle" : "Yeni Oda Oluştur"}</span>
                            </button>
                            <span className="text-[10px] text-indigo-400 font-mono px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                              {editedContent.categories.length} AKTİF ODA
                            </span>
                          </div>
                        </div>

                        {/* Add New Category Card */}
                        {isAddingCategory && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="relative p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] space-y-4 shadow-xl overflow-hidden"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                <Plus size={14} />
                              </div>
                              <span className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-widest">
                                YENİ KATEGORİ (ODA) OLUŞTUR
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-mono font-bold text-zinc-400 block">ODA ADI</label>
                                <input
                                  type="text"
                                  placeholder="örn: Shake Effects, Luts"
                                  value={newCategory.title}
                                  onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-mono font-bold text-zinc-400 block">ROZET METNİ</label>
                                <input
                                  type="text"
                                  placeholder="örn: 5 ADET DETAY"
                                  value={newCategory.badge}
                                  onChange={(e) => setNewCategory({ ...newCategory, badge: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-mono font-bold text-zinc-400 block">RENGİ VE IŞIMASI</label>
                                <select
                                  value={newCategory.gradient}
                                  onChange={(e) => setNewCategory({ ...newCategory, gradient: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-zinc-300 focus:outline-none transition-all"
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

                            <div className="space-y-1.5">
                              <label className="text-xs font-mono font-bold text-zinc-400 block">AÇIKLAMA METNİ</label>
                              <input
                                type="text"
                                placeholder="Kategori altında listelenecek açıklama yazısı..."
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none transition-all"
                              />
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  handleAddCategory();
                                  setIsAddingCategory(false);
                                }}
                                disabled={!newCategory.title}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <Plus size={14} />
                                <span>Odayı Ekle</span>
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* Manage Existing Categories list */}
                        <div className="space-y-4">
                          <span className="text-[10px] font-mono font-black text-zinc-500 tracking-wider block">KATEGORİ LİSTESİ & DOSYALAR</span>
                          
                          {editedContent.categories.map((cat) => {
                            const isOpenDrawer = selectedCatId === cat.id;
                            const isEditingCat = editingCatId === cat.id;
                            return (
                              <div 
                                key={cat.id} 
                                className={`border rounded-[20px] overflow-hidden transition-all duration-300 ${
                                  isOpenDrawer 
                                    ? "border-indigo-500/30 bg-[#0a0b0f] shadow-lg shadow-indigo-500/2" 
                                    : "border-zinc-900 bg-zinc-950/20 hover:border-zinc-850"
                                  }`}
                              >
                                {/* Category Card Header */}
                                <div className="p-4 sm:px-5 flex flex-col justify-between items-stretch gap-4">
                                  {isEditingCat ? (
                                    <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-indigo-500/20">
                                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                        <div className="flex items-center gap-2">
                                          <FileEdit size={14} className="text-indigo-400" />
                                          <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider">KATEGORİ DETAYLARINI DÜZENLE</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-500 font-mono">ID: {cat.id}</span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-zinc-400 font-mono uppercase block">SIRA NO</label>
                                          <input
                                            type="text"
                                            value={cat.index}
                                            onChange={(e) => handleUpdateCategoryField(cat.id, "index", e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none"
                                            placeholder="örn: 01"
                                          />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                          <label className="text-[10px] text-zinc-400 font-mono uppercase block">KATEGORİ (ODA) ADI</label>
                                          <input
                                            type="text"
                                            value={cat.title}
                                            onChange={(e) => handleUpdateCategoryField(cat.id, "title", e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none font-bold"
                                            placeholder="Kategori Adı"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-zinc-400 font-mono uppercase block">ROZET METNİ</label>
                                          <input
                                            type="text"
                                            value={cat.badge}
                                            onChange={(e) => handleUpdateCategoryField(cat.id, "badge", e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none"
                                            placeholder="örn: VISUALS"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-zinc-400 font-mono uppercase block">RENK VE IŞIMA TEMASI</label>
                                          <select
                                            value={cat.gradient}
                                            onChange={(e) => handleUpdateCategoryField(cat.id, "gradient", e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none"
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
                                        <label className="text-[10px] text-zinc-400 font-mono uppercase block">AÇIKLAMA METNİ</label>
                                        <input
                                          type="text"
                                          value={cat.description || ""}
                                          onChange={(e) => handleUpdateCategoryField(cat.id, "description", e.target.value)}
                                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none"
                                          placeholder="Açıklama"
                                        />
                                      </div>

                                      <div className="flex justify-end gap-2 pt-1">
                                        <button
                                          onClick={() => setEditingCatId(null)}
                                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                                        >
                                          Tamamlandı
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 w-8 h-8 rounded-lg flex items-center justify-center">
                                          {cat.index}
                                        </span>
                                        <div>
                                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{cat.title}</h4>
                                          <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">{cat.badge} • {cat.items?.length || 0} Dosya</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                          onClick={() => setEditingCatId(cat.id)}
                                          className="p-2 text-zinc-400 hover:text-white bg-[#11131a] hover:bg-zinc-850 border border-zinc-850 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                        >
                                          <Edit size={13} />
                                          <span className="hidden sm:inline">Düzenle</span>
                                        </button>
                                        <button
                                          onClick={() => handleRemoveCategory(cat.id)}
                                          className="p-2 text-red-500/80 hover:text-red-400 bg-red-950/10 hover:bg-red-950/20 border border-red-900/20 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                        <button
                                          onClick={() => setSelectedCatId(isOpenDrawer ? "" : cat.id)}
                                          className={`p-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 border ${
                                            isOpenDrawer 
                                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                              : "bg-[#11131a] text-zinc-400 hover:text-white border-zinc-850"
                                          }`}
                                        >
                                          <span>{isOpenDrawer ? "Kapat" : "Dosyaları Gör"}</span>
                                          <ChevronRight size={13} className={`transform transition-transform ${isOpenDrawer ? "rotate-90" : ""}`} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Drawer content to manage files/presets inside category */}
                                {isOpenDrawer && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="border-t border-zinc-900/60 bg-zinc-950/40 p-4 sm:p-5 space-y-4"
                                  >
                                    {/* Inner form to add a file */}
                                    <div className="p-5 bg-[#0a0b10] border border-zinc-900 rounded-2xl space-y-4">
                                      <span className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-widest block">BU ODAYA YENİ DOSYA/PRESET EKLE</span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-mono text-zinc-400 block">DOSYA/EFEKT ADI</label>
                                          <input
                                            type="text"
                                            placeholder="örn: Kreatif Shake Efekti.ffx"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-mono text-zinc-400 block">DOSYA BOYUTU</label>
                                          <input
                                            type="text"
                                            placeholder="örn: 45 KB"
                                            value={newItem.size}
                                            onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-mono text-zinc-400 block">ETİKET/DURUM</label>
                                          <select
                                            value={newItem.status || "none"}
                                            onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                                            className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                          >
                                            <option value="none">Normal (Etiketsiz)</option>
                                            <option value="new">YENİ</option>
                                            <option value="updated">GÜNCELLENDİ</option>
                                          </select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-mono text-zinc-400 block">İNDİRME BAĞLANTISI (URL)</label>
                                          <input
                                            type="text"
                                            placeholder="https://drive.google.com/..."
                                            value={newItem.downloadUrl}
                                            onChange={(e) => setNewItem({ ...newItem, downloadUrl: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1.5">
                                        <label className="text-xs font-mono text-zinc-400 block">KISA AÇIKLAMA (ALT DETAY)</label>
                                        <input
                                          type="text"
                                          placeholder="Presetin nasıl kullanılacağına dair mini tüyo veya açıklama..."
                                          value={newItem.description}
                                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                          className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                      </div>

                                      {/* File Preview Assets (Before, After, Video Uploads) */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-900/60 pt-4">
                                        <div className="space-y-1.5">
                                          <span className="text-xs font-mono text-zinc-400 block">ÖNCESİ RESİM URL / DOSYA</span>
                                          <input
                                            type="text"
                                            value={newItem.previewBefore || ""}
                                            placeholder="Before görseli URL veya dosya..."
                                            onChange={(e) => setNewItem({ ...newItem, previewBefore: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white outline-none font-mono focus:border-indigo-500/50 transition-colors"
                                          />
                                          <MediaUploadButton 
                                            label="Görsel Seç / Fotoğraf Çek" 
                                            accept="image/*"
                                            onUploadSuccess={(url) => setNewItem({ ...newItem, previewBefore: url })}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <span className="text-xs font-mono text-zinc-400 block">SONRASI RESİM URL / DOSYA</span>
                                          <input
                                            type="text"
                                            value={newItem.previewAfter || ""}
                                            placeholder="After görseli URL veya dosya..."
                                            onChange={(e) => setNewItem({ ...newItem, previewAfter: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white outline-none font-mono focus:border-indigo-500/50 transition-colors"
                                          />
                                          <MediaUploadButton 
                                            label="Görsel Seç / Fotoğraf Çek" 
                                            accept="image/*"
                                            onUploadSuccess={(url) => setNewItem({ ...newItem, previewAfter: url })}
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <span className="text-xs font-mono text-zinc-400 block">ÖNİZLEME VİDEOSU URL / DOSYA</span>
                                          <input
                                            type="text"
                                            value={newItem.previewVideo || ""}
                                            placeholder="Önizleme videosu URL veya dosya..."
                                            onChange={(e) => setNewItem({ ...newItem, previewVideo: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white outline-none font-mono focus:border-indigo-500/50 transition-colors"
                                          />
                                          <MediaUploadButton 
                                            label="Video Seç / Kaydet" 
                                            accept="video/*"
                                            onUploadSuccess={(url) => setNewItem({ ...newItem, previewVideo: url })}
                                          />
                                        </div>
                                      </div>

                                      <div className="flex justify-end pt-2 border-t border-zinc-900/40">
                                        <button
                                          type="button"
                                          onClick={() => handleAddItem(cat.id)}
                                          disabled={!newItem.name || !newItem.downloadUrl}
                                          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                                        >
                                          <Plus size={13} />
                                          <span>DOSYAYI EKLE</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Existing items inside this category */}
                                    <div className="space-y-4">
                                      <span className="text-xs font-mono font-bold text-zinc-400 tracking-wider block">YAYINDAKİ DOSYALAR ({cat.items?.length || 0})</span>
                                      
                                      {cat.items?.map((item) => (
                                        <div key={item.id} className="p-6 bg-[#0a0b10] border border-zinc-900 rounded-2xl space-y-4 hover:border-zinc-800 transition-all shadow-xl">
                                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                              <div className="space-y-1.5">
                                                <span className="text-xs font-mono font-bold text-zinc-400 block">DOSYA ADI</span>
                                                <input
                                                  type="text"
                                                  value={item.name}
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "name", e.target.value)}
                                                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-bold transition-colors"
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <span className="text-xs font-mono font-bold text-zinc-400 block">DOSYA BOYUTU</span>
                                                <input
                                                  type="text"
                                                  value={item.size}
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "size", e.target.value)}
                                                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none transition-colors"
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <span className="text-xs font-mono font-bold text-zinc-400 block">ETİKET/DURUM</span>
                                                <select
                                                  value={item.status || "none"}
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "status", e.target.value)}
                                                  className="w-full px-4 py-2.5 bg-[#050608] border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none transition-colors"
                                                >
                                                  <option value="none">Normal (Etiketsiz)</option>
                                                  <option value="new">YENİ</option>
                                                  <option value="updated">GÜNCELLENDİ</option>
                                                </select>
                                              </div>
                                              <div className="space-y-1.5">
                                                <span className="text-xs font-mono font-bold text-zinc-400 block">İNDİRME LİNKİ</span>
                                                <input
                                                  type="text"
                                                  value={item.downloadUrl}
                                                  onChange={(e) => handleUpdateItemField(cat.id, item.id, "downloadUrl", e.target.value)}
                                                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-mono transition-colors"
                                                />
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => handleRemoveItem(cat.id, item.id)}
                                              className="p-3 text-red-500/70 hover:text-red-400 bg-red-950/10 hover:bg-red-950/20 rounded-xl border border-red-900/20 cursor-pointer self-end lg:self-center transition-colors shadow-sm"
                                              title="Dosyayı Sil"
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>

                                          <div className="space-y-1.5">
                                            <span className="text-xs font-mono font-bold text-zinc-400 block">AÇIKLAMA / DETAY YAZISI</span>
                                            <input
                                              type="text"
                                              value={item.description || ""}
                                              onChange={(e) => handleUpdateItemField(cat.id, item.id, "description", e.target.value)}
                                              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none transition-colors"
                                              placeholder="Dosya açıklaması giriniz..."
                                            />
                                          </div>

                                          {/* Previews under item block */}
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-900/40">
                                            <div className="space-y-1.5">
                                              <span className="text-xs font-mono font-bold text-zinc-400 block">ÖNCESİ RESİM URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewBefore || ""}
                                                placeholder="Öncesi görsel URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewBefore", e.target.value)}
                                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-mono transition-colors"
                                              />
                                              <MediaUploadButton 
                                                label="Görsel Seç / Fotoğraf Çek" 
                                                accept="image/*"
                                                onUploadSuccess={(url) => handleUpdateItemField(cat.id, item.id, "previewBefore", url)}
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <span className="text-xs font-mono font-bold text-zinc-400 block">SONRASI RESİM URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewAfter || ""}
                                                placeholder="Sonrası görsel URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewAfter", e.target.value)}
                                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-mono transition-colors"
                                              />
                                              <MediaUploadButton 
                                                label="Görsel Seç / Fotoğraf Çek" 
                                                accept="image/*"
                                                onUploadSuccess={(url) => handleUpdateItemField(cat.id, item.id, "previewAfter", url)}
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <span className="text-xs font-mono font-bold text-zinc-400 block">VİDEO ÖNİZLEME URL / DOSYA</span>
                                              <input
                                                type="text"
                                                value={item.previewVideo || ""}
                                                placeholder="Video önizleme URL veya dosya yükleyin..."
                                                onChange={(e) => handleUpdateItemField(cat.id, item.id, "previewVideo", e.target.value)}
                                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-mono transition-colors"
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
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB: ANNOUNCEMENTS & SINGLE CLICK TEMPLATES */}
                    {activeTab === "announcements" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Megaphone size={18} className="text-indigo-400" />
                            <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Duyuru Yönetimi & Taslaklar</h3>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-850">
                            Aktif Duyuru Sayısı: {(editedContent.announcements || []).filter(a => a.active).length}
                          </span>
                        </div>

                        {/* 1. PREMADE PREMIUM TEMPLATES (TEK TIKLA ATILAN DUYURULAR) */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                            <h4 className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-widest">Hızlı Yayın: Tek Tıkla Hazır Taslaklar</h4>
                          </div>
                          <p className="text-[11px] text-zinc-500">
                            Aşağıdaki hazır şablonları tek bir tıklama ile anında yayına alabilir veya düzenleyiciye yükleyip özelleştirebilirsiniz.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DUYURU_TEMPLATES.map((tpl, i) => {
                              const borderMap = {
                                success: "hover:border-emerald-500/30 border-zinc-900 bg-emerald-950/[0.03]",
                                warning: "hover:border-amber-500/30 border-zinc-900 bg-amber-950/[0.03]",
                                info: "hover:border-blue-500/30 border-zinc-900 bg-blue-950/[0.03]",
                                danger: "hover:border-red-500/30 border-zinc-900 bg-red-950/[0.03]",
                                announcement: "hover:border-rose-500/30 border-zinc-900 bg-rose-950/[0.03]"
                              };
                              const badgeMap = {
                                success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                danger: "bg-red-500/10 text-red-400 border-red-500/20",
                                announcement: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              };
                              return (
                                <div 
                                  key={i} 
                                  className={`p-4 bg-zinc-950/80 border rounded-2xl flex flex-col justify-between gap-3 transition-all ${borderMap[tpl.type] || borderMap.announcement}`}
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded ${badgeMap[tpl.type]}`}>
                                        {tpl.type.toUpperCase()}
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-display font-black text-white uppercase tracking-tight line-clamp-1">{tpl.title}</h5>
                                    <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{tpl.message}</p>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-900/60">
                                    <button
                                      type="button"
                                      onClick={() => handlePublishTemplate(tpl)}
                                      className="flex-1 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-lg text-[10px] font-bold transition-all text-center select-none cursor-pointer"
                                    >
                                      Hemen Yayınla
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleLoadTemplate(tpl)}
                                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-[10px] font-bold transition-all text-center select-none cursor-pointer"
                                      title="Düzenleyiciye Aktar"
                                    >
                                      Özelleştir
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. COMPOSE / EDIT ANNOUNCEMENT FORM */}
                        <form onSubmit={handleSaveAnnForm} className="p-5 md:p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                            <span className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-widest block">
                              {editingAnnId ? "📝 DUYURUYU DÜZENLE" : "✍️ ÖZEL DUYURU OLUŞTUR"}
                            </span>
                            {editingAnnId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAnnId(null);
                                  setAnnForm({
                                    title: "",
                                    message: "",
                                    type: "announcement",
                                    linkText: "",
                                    linkUrl: "",
                                    active: true
                                  });
                                }}
                                className="text-[10px] font-mono text-rose-400 hover:underline"
                              >
                                Düzenlemeyi İptal Et
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-zinc-400">DUYURU BAŞLIĞI</label>
                              <input
                                type="text"
                                value={annForm.title}
                                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                                placeholder="Örn: 🎬 YENİ AE EDİT PAKETİ V1 ÇIKTI!"
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-sans transition-colors"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-zinc-400">TEMA / TÜR</label>
                              <select
                                value={annForm.type}
                                onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as any })}
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none transition-colors"
                              >
                                <option value="announcement">Mega Duyuru (Kırmızı)</option>
                                <option value="success">Başarı / Yeni Paket (Yeşil)</option>
                                <option value="warning">Kampanya / Uyarı (Sarı)</option>
                                <option value="info">Bilgi / Sosyal Medya (Mavi)</option>
                                <option value="danger">Sistem / Kritik Durum (Kırmızı)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold text-zinc-400">DUYURU MESAJI / DETAYI</label>
                            <textarea
                              rows={3}
                              value={annForm.message}
                              onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                              placeholder="Kullanıcılarınıza göstermek istediğiniz duyuru detaylarını buraya yazın..."
                              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-sans transition-colors resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-zinc-400">BUTON METNİ (OPSİYONEL)</label>
                              <input
                                type="text"
                                value={annForm.linkText}
                                onChange={(e) => setAnnForm({ ...annForm, linkText: e.target.value })}
                                placeholder="Örn: YouTube Kanalıma Git"
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-sans transition-colors"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-zinc-400">YÖNLENDİRME URL'Sİ (OPSİYONEL)</label>
                              <input
                                type="text"
                                value={annForm.linkUrl}
                                onChange={(e) => setAnnForm({ ...annForm, linkUrl: e.target.value })}
                                placeholder="Örn: https://youtube.com/..."
                                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-indigo-500/50 rounded-xl text-sm text-white outline-none font-mono transition-colors"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={annForm.active}
                                onChange={(e) => setAnnForm({ ...annForm, active: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-xs font-mono font-bold text-zinc-400">ANINDA AKTİF ET</span>
                            </label>

                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-600/20 transition-all select-none cursor-pointer"
                            >
                              {editingAnnId ? "Duyuruyu Güncelle" : "Duyuruyu Listeye Ekle"}
                            </button>
                          </div>
                        </form>

                        {/* 3. CURRENT ANNOUNCEMENTS LIST */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Bell size={14} className="text-indigo-400" />
                            <h4 className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-widest">Yayındaki & Arşivlenmiş Duyurular</h4>
                          </div>

                          {(!editedContent.announcements || editedContent.announcements.length === 0) ? (
                            <div className="p-8 bg-zinc-950/40 border border-zinc-900 border-dashed rounded-2xl text-center text-zinc-500 text-xs">
                              Yayında veya taslakta herhangi bir duyuru bulunmuyor. Şablonlardan birini ekleyin veya üstteki formdan yeni bir tane yazın!
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {editedContent.announcements.map((ann) => {
                                const badgeMap = {
                                  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                  danger: "bg-red-500/10 text-red-400 border-red-500/20",
                                  announcement: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                };
                                return (
                                  <div 
                                    key={ann.id} 
                                    className={`p-3 bg-[#0a0b0f] border rounded-xl flex items-center justify-between gap-4 transition-all ${
                                      ann.active ? "border-zinc-800" : "border-zinc-900 opacity-60"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded shrink-0 ${badgeMap[ann.type] || badgeMap.announcement}`}>
                                        {ann.type.toUpperCase()}
                                      </span>
                                      <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-xs font-bold text-white uppercase tracking-tight truncate">{ann.title}</h5>
                                          <span className="text-[8px] text-zinc-600 shrink-0">
                                            {new Date(ann.createdAt).toLocaleDateString("tr-TR")}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 truncate">{ann.message}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleAnnActive(ann.id)}
                                        className={`px-2 py-1 border rounded-lg text-[9px] font-bold transition-all select-none cursor-pointer ${
                                          ann.active 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                                            : "bg-zinc-900 text-zinc-500 border-zinc-850 hover:bg-zinc-800 hover:text-zinc-300"
                                        }`}
                                      >
                                        {ann.active ? "Aktif" : "Pasif"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAnnForm({
                                            title: ann.title,
                                            message: ann.message,
                                            type: ann.type,
                                            linkText: ann.linkText || "",
                                            linkUrl: ann.linkUrl || "",
                                            active: ann.active
                                          });
                                          setEditingAnnId(ann.id);
                                        }}
                                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                        title="Düzenle"
                                      >
                                        <FileEdit size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAnn(ann.id)}
                                        className="p-1.5 bg-zinc-900 hover:bg-red-900/20 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                                        title="Sil"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB: PROFILE & SOCIAL */}
                    {activeTab === "bio" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                          <User size={18} className="text-indigo-400" />
                          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Hakkımda & Kreatif Profil Kartı</h3>
                        </div>
                        
                        {/* Interactive Image Upload Section */}
                        <div className="p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <UploadCloud size={14} className="text-indigo-400" />
                            <label className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-widest block">TELEFONDAN / BİLGİSAYARDAN RESİM YÜKLE</label>
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
                                className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-indigo-500/20 file:text-xs file:font-bold file:bg-indigo-600/10 file:text-indigo-400 hover:file:bg-indigo-600/20 cursor-pointer"
                              />
                              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-md">Önerilen boyut kare (1:1), maksimum 2MB. Telefon galerinizden veya bilgisayarınızdan doğrudan profil fotoğrafınızı seçebilirsiniz.</p>
                              
                              {editedContent.settings.bioImage && (
                                <button
                                  type="button"
                                  onClick={() => setEditedContent({
                                    ...editedContent,
                                    settings: { ...editedContent.settings, bioImage: "" }
                                  })}
                                  className="px-3.5 py-1.5 bg-[#141620] hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-red-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
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
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">KREATİF PROFİL AD SOYAD</label>
                            <input
                              type="text"
                              value={editedContent.settings.bioName || ""}
                              placeholder="KREATİF EDİTÖR"
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, bioName: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">KREATİF PROFİL ÜNVAN/ROL</label>
                            <input
                              type="text"
                              value={editedContent.settings.bioRole || ""}
                              placeholder="VIDEO EDITOR • MOTION DESIGNER"
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, bioRole: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">BİYOGRAFİ KART BAŞLIĞI</label>
                            <input
                              type="text"
                              value={editedContent.settings.bioTitle}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, bioTitle: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">BİYOGRAFİ KART ALTBASLIGI (ROZET)</label>
                            <input
                              type="text"
                              value={editedContent.settings.bioSub}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, bioSub: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">BİYOGRAFİ AÇIKLAMA METNİ (HAKKIMDA PARAGRAFI)</label>
                          <textarea
                            rows={3}
                            value={editedContent.settings.bioDescription || ""}
                            placeholder="Kendinizi tanıtın ve bu paketin amacını anlatın..."
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioDescription: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all resize-none leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">PORTFÖY İNCELE BUTONU URL</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-zinc-500"><Link2 size={16} /></span>
                            <input
                              type="text"
                              value={editedContent.settings.portfolioUrl}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, portfolioUrl: e.target.value }
                              })}
                              className="w-full pl-11 pr-4 py-3 bg-[#0a0b10] border border-zinc-850 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        {/* Bento Stat widgets */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-indigo-400" />
                            <span className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase font-extrabold">Bento İstatistik Sayaç Kutuları</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {editedContent.settings.stats.map((st, idx) => (
                              <div key={idx} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2 shadow-inner">
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
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-indigo-400 text-center focus:outline-none focus:border-indigo-500/50"
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
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] text-zinc-400 text-center focus:outline-none focus:border-indigo-500/50 uppercase"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social Channels view */}
                        <div className="space-y-3 pt-3">
                          <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                            <Globe size={14} className="text-indigo-400" />
                            <span className="text-xs font-mono font-bold text-zinc-400 tracking-wider uppercase">SOSYAL MEDYA LİNKLERİ</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(Object.keys(editedContent.settings.socialLinks) as Array<keyof typeof editedContent.settings.socialLinks>).map((platform) => {
                              const platformStr = String(platform);
                              let colorClass = "focus:border-indigo-500";
                              if (platformStr === "youtube") colorClass = "focus:border-red-500";
                              else if (platformStr === "instagram") colorClass = "focus:border-pink-500";
                              else if (platformStr === "discord") colorClass = "focus:border-blue-500";
                              else if (platformStr === "tiktok") colorClass = "focus:border-cyan-500";

                              const handleValue = editedContent.settings.socialHandles?.[platform] ?? "";
                              let handlePlaceholder = "";
                              if (platformStr === "youtube") handlePlaceholder = "KREATİF EDİTÖR";
                              else if (platformStr === "instagram") handlePlaceholder = "@kreatifeditor";
                              else if (platformStr === "discord") handlePlaceholder = "SUNUCUYA KATIL";
                              else if (platformStr === "tiktok") handlePlaceholder = "@kreatifeditor";

                              return (
                                <div key={platformStr} className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-900 shadow-inner">
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
                                      className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none ${colorClass} transition-colors font-mono`}
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
                                      className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none ${colorClass} transition-colors`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB: SYSTEM & SECURITY */}
                    {activeTab === "system" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                          <Hash size={18} className="text-indigo-400" />
                          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Ziyaretçi Sayacı ve Sayaç Kontrolü</h3>
                        </div>
                        
                        <div className="space-y-2.5 p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] max-w-xl shadow-xl">
                          <label className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-widest block">TOPLAM SİTE ZİYARETÇİSİ</label>
                          <input
                            type="number"
                            value={editedContent.visitorCount}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              visitorCount: parseInt(e.target.value) || 0
                            })}
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-base text-indigo-400 font-mono font-bold focus:outline-none focus:border-indigo-500 transition-all"
                          />
                          <p className="text-[10px] text-zinc-500 leading-relaxed max-w-lg">Ana sayfa her ziyaret edildiğinde bu sayaç otomatik olarak artış gösterir. Buradan istediğiniz bir sayı ile sıfırlayabilir veya değiştirebilirsiniz.</p>
                        </div>

                        <div className="flex items-center gap-2 border-b border-zinc-900 pt-4 pb-3">
                          <Lock size={18} className="text-indigo-400" />
                          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Panel Güvenliği & Şifre Değiştir</h3>
                        </div>
                        
                        <div className="space-y-2.5 p-6 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] max-w-xl shadow-xl">
                          <label className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-widest block">GÜVENLİK GEÇİŞ ŞİFRESİ</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Yeni Panel Şifresi"
                              value={editedContent.settings.adminPassword || ""}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                settings: { ...editedContent.settings, adminPassword: e.target.value }
                              })}
                              className="w-full pl-4 pr-11 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed max-w-lg">Yönetici paneline giriş yaparken koruma sağlayan şifre. Değiştirdikten sonra kaydet butonuna tıklayarak güncelleyebilirsiniz.</p>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB: REQUESTS & FAQ MANAGEMENT */}
                    {activeTab === "requests" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        {/* PART 1: SUGGESTION BOX REQUESTS */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <div className="flex items-center gap-2">
                              <Megaphone size={18} className="text-indigo-400" />
                              <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Kullanıcı Talepleri ({ (editedContent.requests || []).length })</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Tüm kullanıcı isteklerini kalıcı olarak silmek istediğinize emin misiniz?")) {
                                  setEditedContent({ ...editedContent, requests: [] });
                                }
                              }}
                              className="text-[10px] font-mono font-bold text-red-500 hover:text-red-400 px-2.5 py-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/25 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                            >
                              Tümünü Temizle
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(!editedContent.requests || editedContent.requests.length === 0) ? (
                              <div className="p-8 text-center bg-[#0a0b0f] border border-zinc-900 rounded-[24px] text-zinc-500 font-mono text-xs">
                                Henüz hiçbir kullanıcı talebi gönderilmemiş.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
                                {editedContent.requests.map((req, idx) => {
                                  return (
                                    <div 
                                      key={req.id || idx}
                                      className="p-4 bg-[#0a0b0f] border border-zinc-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 border border-zinc-900 rounded">
                                            {req.category}
                                          </span>
                                          <span className="text-[9px] font-mono text-zinc-500">
                                            {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                                          </span>
                                          <span className="text-[9px] font-mono font-extrabold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/10 rounded-full flex items-center gap-1">
                                            <ThumbsUp size={10} /> {req.votes || 0} Oy
                                          </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-zinc-200 uppercase">{req.title}</h4>
                                        <p className="text-[11px] text-zinc-400 leading-normal">{req.description}</p>
                                        <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[9px] font-mono font-bold text-zinc-500">Link/Ek Dosya:</span>
                                          {req.referenceUrl && (
                                            <a 
                                              href={req.referenceUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[9px] font-mono shrink-0 border border-indigo-500/10"
                                            >
                                              <ExternalLink size={9} />
                                              <span>Aç</span>
                                            </a>
                                          )}
                                          <input 
                                            type="text"
                                            value={req.referenceUrl || ""}
                                            onChange={(e) => {
                                              const updated = (editedContent.requests || []).map(r => {
                                                if (r.id === req.id) {
                                                  return { ...r, referenceUrl: e.target.value };
                                                }
                                                return r;
                                              });
                                              setEditedContent({ ...editedContent, requests: updated });
                                            }}
                                            className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-zinc-300 w-56 font-mono focus:outline-none focus:border-indigo-500"
                                            placeholder="Link veya dosya URL ekle..."
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2.5 shrink-0">
                                        {/* Status Switcher */}
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[8px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">Durum:</span>
                                          <select
                                            value={req.status}
                                            onChange={(e) => {
                                              const updated = (editedContent.requests || []).map(r => {
                                                if (r.id === req.id) {
                                                  return { ...r, status: e.target.value as any };
                                                }
                                                return r;
                                              });
                                              setEditedContent({ ...editedContent, requests: updated });
                                            }}
                                            className="px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-bold font-mono text-zinc-300 focus:outline-none"
                                          >
                                            <option value="pending" className="text-amber-500 font-bold">Beklemede</option>
                                            <option value="approved" className="text-blue-500 font-bold">Kabul Edildi</option>
                                            <option value="completed" className="text-emerald-500 font-bold">Tamamlandı</option>
                                            <option value="rejected" className="text-red-500 font-bold">İptal Edildi</option>
                                          </select>
                                        </div>

                                        {/* Vote Changer */}
                                        <div className="flex flex-col gap-1 w-16">
                                          <span className="text-[8px] font-mono font-bold text-zinc-600 block uppercase tracking-wider">Oy Ekle:</span>
                                          <input
                                            type="number"
                                            value={req.votes}
                                            onChange={(e) => {
                                              const updated = (editedContent.requests || []).map(r => {
                                                if (r.id === req.id) {
                                                  return { ...r, votes: parseInt(e.target.value) || 0 };
                                                }
                                                return r;
                                              });
                                              setEditedContent({ ...editedContent, requests: updated });
                                            }}
                                            className="px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-bold font-mono text-zinc-300 focus:outline-none text-center"
                                          />
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = (editedContent.requests || []).filter(r => r.id !== req.id);
                                            setEditedContent({ ...editedContent, requests: updated });
                                          }}
                                          className="p-2 bg-red-600/5 hover:bg-red-600 border border-red-500/10 hover:border-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer self-end md:self-auto"
                                          title="Talebi Sil"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PART 2: FAQ MANAGEMENT */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <div className="flex items-center gap-2">
                              <HelpCircle size={18} className="text-indigo-400" />
                              <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Sıkça Sorulan Sorular ({ (editedContent.faqs || []).length })</h3>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-850">
                              SSS Konfigürasyonu
                            </span>
                          </div>

                          {/* Add / Edit FAQ Form */}
                          <div className="p-5 bg-[#0a0b0f] border border-zinc-900 rounded-[24px] space-y-4">
                            <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest block">
                              {editingFaqId ? "📝 SSS SORUSUNU DÜZENLE" : "✍️ YENİ SSS SORUSU EKLE"}
                            </span>

                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">SORU METNİ</label>
                                <input
                                  type="text"
                                  placeholder="Örn: Paketler her ne sıklıkla güncellenir?"
                                  value={newFaq.question}
                                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">CEVAP METNİ</label>
                                <textarea
                                  placeholder="Soruya verilecek ayrıntılı açıklayıcı cevap..."
                                  value={newFaq.answer}
                                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                  rows={3}
                                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="faq-active-check"
                                    checked={newFaq.active}
                                    onChange={(e) => setNewFaq({ ...newFaq, active: e.target.checked })}
                                    className="w-4 h-4 rounded bg-zinc-950 border border-zinc-850 text-indigo-600 focus:ring-0 cursor-pointer"
                                  />
                                  <label htmlFor="faq-active-check" className="text-[10px] font-mono font-bold text-zinc-400 uppercase cursor-pointer select-none">
                                    Sitede Aktif Olarak Göster
                                  </label>
                                </div>

                                <div className="flex items-center gap-2">
                                  {editingFaqId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingFaqId(null);
                                        setNewFaq({ question: "", answer: "", active: true });
                                      }}
                                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer"
                                    >
                                      Vazgeç
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newFaq.question.trim() || !newFaq.answer.trim()) {
                                        alert("Lütfen tüm alanları doldurun.");
                                        return;
                                      }

                                      let updatedFaqs = [...(editedContent.faqs || [])];
                                      if (editingFaqId) {
                                        updatedFaqs = updatedFaqs.map(f => {
                                          if (f.id === editingFaqId) {
                                            return { ...f, question: newFaq.question.trim(), answer: newFaq.answer.trim(), active: newFaq.active };
                                          }
                                          return f;
                                        });
                                      } else {
                                        updatedFaqs.push({
                                          id: `faq-${Date.now()}`,
                                          question: newFaq.question.trim(),
                                          answer: newFaq.answer.trim(),
                                          active: newFaq.active
                                        });
                                      }

                                      setEditedContent({ ...editedContent, faqs: updatedFaqs });
                                      setNewFaq({ question: "", answer: "", active: true });
                                      setEditingFaqId(null);
                                    }}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-md"
                                  >
                                    {editingFaqId ? "GÜNCELLE" : "LİSTEYE EKLE"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* FAQs List for deletion and editing */}
                          <div className="space-y-2">
                            {(!editedContent.faqs || editedContent.faqs.length === 0) ? (
                              <div className="p-4 text-center text-zinc-600 font-mono text-[10px]">
                                Henüz hiçbir soru/cevap girilmemiş.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {editedContent.faqs.map((faq) => (
                                  <div
                                    key={faq.id}
                                    className="p-3 bg-[#0a0b0f] border border-zinc-900 rounded-xl flex items-center justify-between gap-4"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-xs font-bold text-zinc-300 truncate uppercase flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${faq.active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                        {faq.question}
                                      </h5>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFaqId(faq.id);
                                          setNewFaq({ question: faq.question, answer: faq.answer, active: !!faq.active });
                                        }}
                                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded border border-zinc-850 cursor-pointer"
                                        title="Soru Düzenle"
                                      >
                                        <Edit size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (editedContent.faqs || []).filter(f => f.id !== faq.id);
                                          setEditedContent({ ...editedContent, faqs: updated });
                                        }}
                                        className="p-1.5 bg-red-600/5 hover:bg-red-600 border border-red-500/10 hover:border-red-500 text-red-500 hover:text-white rounded cursor-pointer"
                                        title="Soru Sil"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* 4. FOOTER CONTROLS AND SAVE ENGINE (Always stick to bottom) */}
                  <div className="h-20 px-6 bg-[#090a0f] border-t border-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 relative z-20">
                    <div className="text-center sm:text-left">
                      {saveStatus.type === "success" && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1.5 font-mono"
                        >
                          <CheckCircle size={14} className="text-emerald-400" /> <span>{saveStatus.msg.toUpperCase()}</span>
                        </motion.span>
                      )}
                      {saveStatus.type === "error" && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-red-400 font-bold flex items-center justify-center sm:justify-start gap-1.5 font-mono"
                        >
                          <AlertTriangle size={14} /> <span>{saveStatus.msg.toUpperCase()}</span>
                        </motion.span>
                      )}
                      {!saveStatus.type && (
                        <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                          SİSTEM KORUMA MODU ETKİN • DEĞİŞİKLİKLER BULUT VERİTABANINA YAZILIR
                        </span>
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
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black cursor-pointer border border-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 uppercase tracking-wider"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Yazılıyor...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            <span>DEĞİŞİKLİKLERİ KAYDET</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
