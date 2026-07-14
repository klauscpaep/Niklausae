import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Save, Shield, Settings, FolderOpen, User, Lock, Plus, Trash2, Edit3, Eye, Link2, FileText, CheckCircle, AlertTriangle 
} from "lucide-react";
import { SiteContent, Category, EditPackItem } from "../types";

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
  
  // Form states copied from content
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [editedContent, setEditedContent] = useState<SiteContent>(JSON.parse(JSON.stringify(content)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });

  // Temp states for adding category/item
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [newItem, setNewItem] = useState<Partial<EditPackItem>>({ name: "", size: "15 KB", downloadUrl: "", description: "" });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ title: "", badge: "", description: "", gradient: "from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40" });

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
        setSaveStatus({ type: "success", msg: "Tüm değişiklikler başarıyla kaydedildi!" });
        setTimeout(() => {
          setSaveStatus({ type: null, msg: "" });
        }, 3000);
      } else {
        setSaveStatus({ type: "error", msg: res.error || "Kaydedilirken bir hata oluştu." });
      }
    } catch (err) {
      setSaveStatus({ type: "error", msg: "Sunucu hatası oluştu." });
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
      description: newItem.description || ""
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
    setNewItem({ name: "", size: "15 KB", downloadUrl: "", description: "" });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-zinc-900/50 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">
                    Pars Mazi Yönetici Paneli
                  </h2>
                  <p className="text-xs text-zinc-400">Gizli Panel • Sitenin tüm içeriklerini anında düzenleyin</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Login screen if not authenticated */}
            {!isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 max-w-md mx-auto text-center">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 text-red-500">
                  <Lock size={32} />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-1">Kimlik Doğrulama</h3>
                <p className="text-sm text-zinc-400 mb-6">Bu alana erişmek için yönetici şifresini girmelisiniz.</p>
                
                <form onSubmit={handleLogin} className="w-full space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Yönetici Şifresi"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-center font-mono placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                      autoFocus
                    />
                    {authError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> {authError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-semibold rounded-xl border border-red-500 transition-all cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    Giriş Yap
                  </button>
                </form>
                <p className="text-[10px] text-zinc-600 mt-8">Varsayılan şifre: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-500">admin</code></p>
              </div>
            ) : (
              // Authenticated Admin Dashboard Layout
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-zinc-900/20 border-r border-zinc-800 p-4 space-y-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer ${
                      activeTab === "general" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    }`}
                  >
                    <Settings size={16} />
                    <span>Genel Ayarlar</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer ${
                      activeTab === "categories" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    }`}
                  >
                    <FolderOpen size={16} />
                    <span>Paketler & Odalar</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("bio")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer ${
                      activeTab === "bio" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    }`}
                  >
                    <User size={16} />
                    <span>Profil & Sosyal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left whitespace-nowrap cursor-pointer ${
                      activeTab === "system" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    }`}
                  >
                    <Lock size={16} />
                    <span>Sistem & Güvenlik</span>
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  
                  {/* TAB 1: GENERAL SETTINGS */}
                  {activeTab === "general" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pb-2">Ana Sayfa Başlıkları & Kimlik</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Üst Logo Yazısı (Sol Üst Logo)</label>
                          <input
                            type="text"
                            value={editedContent.settings.topBarText || ""}
                            placeholder="PARS MAZI PACK"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, topBarText: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium font-bold text-red-400">Sayfa Yenilenirken Yükleniyor Yazısı</label>
                          <input
                            type="text"
                            value={editedContent.settings.loadingText || ""}
                            placeholder="PARS MAZI EDIT PACK yükleniyor..."
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, loadingText: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Hero Üst Rozet</label>
                          <input
                            type="text"
                            value={editedContent.settings.heroBadge}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, heroBadge: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Ana Başlık</label>
                          <input
                            type="text"
                            value={editedContent.settings.heroTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, heroTitle: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-medium">Kategori Açıklama Yazısı</label>
                        <textarea
                          rows={2}
                          value={editedContent.settings.heroSub}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            settings: { ...editedContent.settings, heroSub: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                      </div>

                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pt-4 pb-2">Gerekli Pluginler Modülü</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Plugin Kart Başlığı</label>
                          <input
                            type="text"
                            value={editedContent.settings.pluginTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginTitle: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Plugin Kart Açıklaması</label>
                          <input
                            type="text"
                            value={editedContent.settings.pluginDesc}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginDesc: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-medium">YouTube Kurulum Videosu URL</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-zinc-500"><Link2 size={16} /></span>
                          <input
                            type="text"
                            value={editedContent.settings.pluginUrl}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, pluginUrl: e.target.value }
                            })}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CATEGORIES & DOWNLOADABLE ITEMS */}
                  {activeTab === "categories" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-display font-semibold text-white">Kategoriler (Odalar) ve Dosyalar</h3>
                        <p className="text-xs text-zinc-500">Toplam {editedContent.categories.length} Kategori</p>
                      </div>

                      {/* Add New Category Card */}
                      <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
                        <span className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Plus size={14} /> Yeni Kategori (Oda) Ekle
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Kategori Adı (örn: Color Grading)"
                            value={newCategory.title}
                            onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                          />
                          <input
                            type="text"
                            placeholder="Alt Rozet (örn: 5 LUT EFEKTİ)"
                            value={newCategory.badge}
                            onChange={(e) => setNewCategory({ ...newCategory, badge: e.target.value })}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                          />
                          <select
                            value={newCategory.gradient}
                            onChange={(e) => setNewCategory({ ...newCategory, gradient: e.target.value })}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                          >
                            <option value="from-amber-500/20 to-red-600/10 hover:border-amber-500/40">Turuncu-Kırmızı Işıma</option>
                            <option value="from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40">Mavi-Çivit Işıma</option>
                            <option value="from-teal-500/20 to-emerald-600/10 hover:border-teal-500/40">Zümrüt Yeşili Işıma</option>
                            <option value="from-purple-500/20 to-fuchsia-600/10 hover:border-purple-500/40">Mor-Fuşya Işıma</option>
                            <option value="from-pink-500/20 to-rose-600/10 hover:border-pink-500/40">Pembe Işıma</option>
                            <option value="from-cyan-500/20 to-sky-600/10 hover:border-cyan-500/40">Turkuaz Işıma</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Kategori Açıklaması"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                        />
                        <button
                          onClick={handleAddCategory}
                          disabled={!newCategory.title}
                          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Plus size={14} /> Kategoriyi Listeye Ekle
                        </button>
                      </div>

                      {/* Manage Existing Categories */}
                      <div className="space-y-4">
                        {editedContent.categories.map((cat) => (
                          <div key={cat.id} className="border border-zinc-850 bg-zinc-950 rounded-2xl overflow-hidden">
                            {/* Category Header */}
                            <div className="p-4 bg-zinc-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850">
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="font-mono text-zinc-600 font-bold text-sm bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-lg">{cat.index}</span>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={cat.title}
                                    onChange={(e) => handleUpdateCategoryField(cat.id, "title", e.target.value)}
                                    className="font-display font-bold text-white bg-transparent border-b border-transparent focus:border-red-500/50 outline-none text-sm w-full py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={cat.badge}
                                    onChange={(e) => handleUpdateCategoryField(cat.id, "badge", e.target.value)}
                                    className="text-[10px] text-zinc-400 font-mono tracking-wider bg-transparent border-b border-transparent focus:border-red-500/50 outline-none w-full"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => setSelectedCatId(selectedCatId === cat.id ? "" : cat.id)}
                                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <FileText size={12} />
                                  <span>Dosyaları Yönet ({cat.items.length})</span>
                                </button>
                                <button
                                  onClick={() => handleRemoveCategory(cat.id)}
                                  className="p-1.5 hover:bg-red-950/30 text-zinc-600 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                  title="Kategoriyi Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Category Item Management (Conditional Drawer) */}
                            {selectedCatId === cat.id && (
                              <div className="p-4 bg-zinc-900/15 space-y-4">
                                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                  <FolderOpen size={12} className="text-red-500" /> "{cat.title}" İçindeki Edit Paketleri
                                </div>

                                {/* Add New Item to this category */}
                                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Yeni Paket/Preset Ekle</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Dosya Adı (örn: Deep Blue CC)"
                                      value={newItem.name}
                                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                      className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Boyut (örn: 15 KB veya 2.4 MB)"
                                      value={newItem.size}
                                      onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                      className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="İndirme Linki (Gofile, Drive vb.)"
                                      value={newItem.downloadUrl}
                                      onChange={(e) => setNewItem({ ...newItem, downloadUrl: e.target.value })}
                                      className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Kısa Açıklama (Opsiyonel)"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-red-500"
                                  />
                                  <button
                                    onClick={() => handleAddItem(cat.id)}
                                    disabled={!newItem.name || !newItem.downloadUrl}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Plus size={12} /> Dosyayı Kategoriye Ekle
                                  </button>
                                </div>

                                {/* List existing items */}
                                {cat.items.length === 0 ? (
                                  <p className="text-xs text-zinc-500 text-center py-2">Bu kategoride henüz dosya yok. Yukarıdan ekleyebilirsiniz.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {cat.items.map((item) => (
                                      <div key={item.id} className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center">
                                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 mr-2">
                                            <input
                                              type="text"
                                              value={item.name}
                                              placeholder="Dosya Adı"
                                              onChange={(e) => handleUpdateItemField(cat.id, item.id, "name", e.target.value)}
                                              className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs text-white outline-none focus:border-red-500"
                                            />
                                            <input
                                              type="text"
                                              value={item.size}
                                              placeholder="Boyut"
                                              onChange={(e) => handleUpdateItemField(cat.id, item.id, "size", e.target.value)}
                                              className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs text-white outline-none focus:border-red-500"
                                            />
                                            <input
                                              type="text"
                                              value={item.downloadUrl}
                                              placeholder="Link"
                                              onChange={(e) => handleUpdateItemField(cat.id, item.id, "downloadUrl", e.target.value)}
                                              className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs text-white outline-none focus:border-red-500 font-mono text-xs"
                                            />
                                          </div>
                                          <button
                                            onClick={() => handleRemoveItem(cat.id, item.id)}
                                            className="p-1 text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
                                            title="Dosyayı Sil"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                        <input
                                          type="text"
                                          value={item.description}
                                          placeholder="Açıklama"
                                          onChange={(e) => handleUpdateItemField(cat.id, item.id, "description", e.target.value)}
                                          className="w-full px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs text-white outline-none focus:border-red-500"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PROFILE & SOCIAL */}
                  {activeTab === "bio" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pb-2">Hakkımda & Kreatif Profil</h3>
                      
                      {/* Interactive Image Upload Section */}
                      <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
                        <label className="text-xs font-bold text-red-500 uppercase tracking-wider block">TELEFONDAN / BİLGİSAYARDAN RESİM YÜKLE</label>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          {/* Image Preview */}
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex-shrink-0">
                            {editedContent.settings.bioImage ? (
                              <img src={editedContent.settings.bioImage} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-[10px] text-center p-2">
                                <span>Varsayılan Resim</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Upload Controls */}
                          <div className="space-y-2 flex-1 w-full">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600/10 file:text-red-500 hover:file:bg-red-600/20 cursor-pointer"
                            />
                            <p className="text-[10px] text-zinc-500">Önerilen boyut kare (1:1 aspect ratio), maks. 2MB. Mobil cihazınızın galerisinden veya kamerasından doğrudan fotoğraf seçebilirsiniz.</p>
                            
                            {editedContent.settings.bioImage && (
                              <button
                                type="button"
                                onClick={() => setEditedContent({
                                  ...editedContent,
                                  settings: { ...editedContent.settings, bioImage: "" }
                                })}
                                className="px-3 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-[10px] rounded-lg transition-all"
                              >
                                Varsayılan Resme Geri Dön
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio Core Texts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Kreatif Profil Ad Soyad</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioName || ""}
                            placeholder="PARS MAZI"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioName: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Kreatif Profil Ünvan/Rol</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioRole || ""}
                            placeholder="VIDEO EDITOR • MOTION DESIGNER"
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioRole: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Biyografi Kart Başlığı</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioTitle}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioTitle: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-zinc-400 font-medium">Biyografi Kart Altbaşlığı</label>
                          <input
                            type="text"
                            value={editedContent.settings.bioSub}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, bioSub: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-medium">Biyografi Açıklama Metni (Hakkında Paragrafı)</label>
                        <textarea
                          rows={3}
                          value={editedContent.settings.bioDescription || ""}
                          placeholder="Kendinizi tanıtın ve bu paketin amacını anlatın..."
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            settings: { ...editedContent.settings, bioDescription: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-medium">Portföy İncele Butonu URL</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-zinc-500"><Link2 size={16} /></span>
                          <input
                            type="text"
                            value={editedContent.settings.portfolioUrl}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              settings: { ...editedContent.settings, portfolioUrl: e.target.value }
                            })}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-zinc-300">Bento İstatistik Kutuları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {editedContent.settings.stats.map((st, idx) => (
                          <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
                            <span className="text-[10px] text-zinc-500 font-mono">İSTATİSTİK {idx + 1}</span>
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
                              placeholder="Değer (örn: 6+)"
                              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
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
                              placeholder="Etiket (örn: DENEYİM)"
                              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                            />
                          </div>
                        ))}
                      </div>

                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pt-4 pb-2">Sosyal Medya Bağlantıları</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.keys(editedContent.settings.socialLinks) as Array<keyof typeof editedContent.settings.socialLinks>).map((platform) => (
                          <div key={platform} className="space-y-1.5">
                            <label className="text-xs text-zinc-400 capitalize font-medium">{platform}</label>
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
                              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition-colors font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: SYSTEM & SECURITY */}
                  {activeTab === "system" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pb-2">Ziyaretçi Sayacı</h3>
                      
                      <div className="space-y-1.5 max-w-sm">
                        <label className="text-xs text-zinc-400 font-medium">Toplam Ziyaretçi Sayısı</label>
                        <input
                          type="number"
                          value={editedContent.visitorCount}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            visitorCount: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                        />
                        <p className="text-[11px] text-zinc-500">Ana sayfa her açıldığında bu değer otomatik olarak artar. Buradan sıfırlayabilir veya değiştirebilirsiniz.</p>
                      </div>

                      <h3 className="text-lg font-display font-semibold text-white border-b border-zinc-900 pt-4 pb-2">Yönetici Paneli Şifresi</h3>
                      
                      <div className="space-y-1.5 max-w-sm">
                        <label className="text-xs text-zinc-400 font-medium">Yeni Şifre</label>
                        <input
                          type="text"
                          placeholder="Yönetici Şifresi"
                          value={editedContent.settings.adminPassword || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            settings: { ...editedContent.settings, adminPassword: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                        />
                        <p className="text-[11px] text-zinc-500">Yönetici paneline erişirken sorulan gizli şifreyi buradan değiştirin. Kaydetmeyi unutmayın.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Bottom Footer Actions (Active if Authenticated) */}
            {isAuthenticated && (
              <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  {saveStatus.type === "success" && (
                    <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle size={14} /> {saveStatus.msg}
                    </span>
                  )}
                  {saveStatus.type === "error" && (
                    <span className="text-xs text-red-500 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> {saveStatus.msg}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setPasswordInput("");
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-800 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer border border-red-500 transition-all flex items-center gap-2 shadow-lg shadow-red-600/10 active:scale-98 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
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
