import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HelpCircle, ChevronDown, MessageSquare, ThumbsUp, PlusCircle, 
  Sparkles, CheckCircle2, Clock, Send, AlertCircle, RefreshCw,
  Link2, UploadCloud, ExternalLink, Loader2, Search, Filter
} from "lucide-react";
import { SiteContent, FAQItem, SuggestionRequest } from "../types";

interface HelpRequestsSectionProps {
  content: SiteContent;
  onSaveContent: (updated: SiteContent) => Promise<void>;
}

export default function HelpRequestsSection({ content, onSaveContent }: HelpRequestsSectionProps) {
  // FAQs State
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState("Tümü");

  // Suggestions State
  const [activeTab, setActiveTab] = useState<"popular" | "all" | "new">("popular");
  const [requestStatusFilter, setRequestStatusFilter] = useState<"all" | "pending" | "approved" | "completed">("all");
  
  // Submit Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Geçiş Efektleri");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("Dosya boyutu çok büyük! En fazla 100MB yükleyebilirsiniz.");
      return;
    }

    setIsUploading(true);
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
          setReferenceUrl(data.url);
          setIsUploading(false);
          return;
        }
      }
      
      // 2. If local server upload fails or is blocked by size limits, fall back to high-speed anonymous cloud host tmpfiles.org
      console.log("Local upload failed or was rejected. Falling back to tmpfiles.org direct upload...");
      const extRes = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (extRes.ok) {
        const extData = await extRes.json();
        if (extData.status === "success" && extData.data?.url) {
          // Convert to direct download link: e.g. https://tmpfiles.org/dl/w5wn1svzaBre/sample.txt
          const directUrl = extData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
          setReferenceUrl(directUrl);
        } else {
          alert("Dosya yüklenemedi. Lütfen Google Drive veya Mega linki bırakmayı deneyin.");
        }
      } else {
        alert("Dosya yükleme sunucusu yanıt vermedi. Lütfen Google Drive veya Mega linki bırakmayı deneyin.");
      }
    } catch (err) {
      console.error("File upload error:", err);
      // Double fallback check: try tmpfiles.org directly if there was a network/cors issue with local server
      try {
        const extRes = await fetch("https://tmpfiles.org/api/v1/upload", {
          method: "POST",
          body: formData,
        });
        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData.status === "success" && extData.data?.url) {
            const directUrl = extData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            setReferenceUrl(directUrl);
            setIsUploading(false);
            return;
          }
        }
      } catch (extErr) {
        console.error("External upload error:", extErr);
      }
      alert("Bağlantı hatası oluştu. Lütfen Google Drive veya Mega linki bırakmayı deneyin.");
    } finally {
      setIsUploading(false);
    }
  };

  // Vote State (Local tracking of voted IDs)
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("kreatif_voted_requests");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const faqs = content.faqs || [];
  const requests = content.requests || [];

  const handleToggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleVote = async (requestId: string) => {
    if (votedIds.includes(requestId)) return; // Already voted

    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        return { ...req, votes: (req.votes || 0) + 1 };
      }
      return req;
    });

    const updatedContent = {
      ...content,
      requests: updatedRequests
    };

    try {
      await onSaveContent(updatedContent);
      const newVoted = [...votedIds, requestId];
      setVotedIds(newVoted);
      localStorage.setItem("kreatif_voted_requests", JSON.stringify(newVoted));
    } catch (err) {
      console.error("Failed to submit vote:", err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSubmitError("Lütfen tüm alanları doldurun.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const newRequest: SuggestionRequest = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: category,
      createdAt: new Date().toISOString(),
      status: "pending",
      votes: 1,
      referenceUrl: referenceUrl.trim() || undefined
    };

    const updatedContent = {
      ...content,
      requests: [newRequest, ...requests]
    };

    try {
      await onSaveContent(updatedContent);
      
      // Auto vote for their own request
      const newVoted = [...votedIds, newRequest.id];
      setVotedIds(newVoted);
      localStorage.setItem("kreatif_voted_requests", JSON.stringify(newVoted));

      setTitle("");
      setDescription("");
      setReferenceUrl("");
      setSubmitSuccess(true);
      setActiveTab("popular");
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Request submit error:", err);
      setSubmitError("Talebiniz kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FAQ classification helper
  const getFaqCategory = (id: string): string => {
    switch (id) {
      case "faq-1": // AE ffx kurulum
      case "faq-4": // CapCut DaVinci uyumu
      case "faq-14": // DaVinci / CapCut ffx
        return "Kurulum & Uyum";
      case "faq-5": // LUT ve CC
      case "faq-7": // Siyah arka plan temizleme
      case "faq-12": // Yeşil ekran temizleme
        return "Kullanım & Efektler";
      case "faq-6": // Twixtor CC
      case "faq-10": // Expression error
      case "faq-11": // Element 3D / Sapphire
      case "faq-13": // Render kasması
        return "Eklentiler & Hatalar";
      case "faq-2": // Güvenli mi
      case "faq-9": // Limit var mı
      case "faq-15": // Kırık linkler
        return "İndirme & Linkler";
      case "faq-3": // Özel istek
      case "faq-16": // İstekler onay
      case "faq-8": // Telif hakkı
      default:
        return "Genel & İstekler";
    }
  };

  const faqCategories = ["Tümü", "Kurulum & Uyum", "Kullanım & Efektler", "Eklentiler & Hatalar", "İndirme & Linkler", "Genel & İstekler"];

  // Filter and sort FAQs
  const activeFaqs = faqs.filter(faq => faq.active !== false);
  const filteredFaqs = activeFaqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
    
    const matchesCategory = 
      selectedFaqCategory === "Tümü" || 
      getFaqCategory(faq.id) === selectedFaqCategory;
      
    return matchesSearch && matchesCategory;
  });

  // Calculate Request Statistics
  const totalReqCount = requests.length;
  const completedReqCount = requests.filter(r => r.status === "completed").length;
  const approvedReqCount = requests.filter(r => r.status === "approved").length;
  const pendingReqCount = requests.filter(r => r.status === "pending" || !r.status).length;

  const popularRequests = [...requests].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const recentRequests = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayedRequests = activeTab === "popular" ? popularRequests : recentRequests;

  // Filter requests by status
  const filteredRequests = displayedRequests.filter(req => {
    if (requestStatusFilter === "all") return true;
    if (requestStatusFilter === "pending") return req.status === "pending" || !req.status;
    return req.status === requestStatusFilter;
  });

  const categoriesList = [
    "Geçiş Efektleri",
    "Ses Efektleri (SFX)",
    "Twixtor & Velocity",
    "Overlays & Texture",
    "Color Correction (CC)",
    "After Effects Şablonu",
    "Diğer / Özel İstek"
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "Kabul Edildi", class: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
      case "completed":
        return { label: "Tamamlandı", class: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "rejected":
        return { label: "İptal Edildi", class: "bg-red-500/10 text-red-400 border border-red-500/20" };
      case "pending":
      default:
        return { label: "Beklemede", class: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "completed": return 100;
      case "approved": return 60;
      case "rejected": return 0;
      case "pending":
      default: return 20;
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-900/60" id="help-requests-section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Panel: FAQs */}
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              <HelpCircle size={10} /> Sıkça Sorulan Sorular
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
              Aklınıza Takılanlar
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Kullanım, kurulum ve diğer merak ettiğiniz tüm detayların pratik yanıtlarına buradan ulaşabilirsiniz.
            </p>
          </div>

          {/* FAQ Search and Filter Bar */}
          <div className="space-y-3.5 bg-zinc-950/30 border border-zinc-900 p-4.5 rounded-2xl">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Soru veya cevap içinde hızlı arayın..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-zinc-500 hover:text-white cursor-pointer bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800"
                >
                  TEMİZLE
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider cursor-pointer transition-all border ${
                    selectedFaqCategory === cat
                      ? "bg-red-500/10 border-red-500/35 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.06)]"
                      : "bg-[#0d0d12]/40 border-zinc-900/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center text-zinc-500 font-mono text-xs">
                Aradığınız kriterlere uygun soru ve cevap bulunamadı.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => handleToggleFaq(faq.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                    >
                      <span className="text-sm font-bold text-zinc-200 hover:text-white transition-colors">
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-zinc-500 shrink-0"
                      >
                        <ChevronDown size={16} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/40 space-y-2">
                            <p>{faq.answer}</p>
                            <div className="flex justify-end pt-1">
                              <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                                KAT: {getFaqCategory(faq.id)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Suggestion Box */}
        <div className="space-y-6 bg-zinc-950/20 border border-zinc-900/80 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/[0.02] rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              <MessageSquare size={10} /> İstek & Öneri Kutusu
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
              Arşivi Birlikte Büyütelim
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Arşivde bulunmasını istediğiniz yeni efekt paketlerini, presetleri veya araçları talep edin. Diğer kullanıcıların isteklerine oy vererek öne çıkmasını sağlayın!
            </p>
          </div>

          {/* Statistics Dashboard Widget */}
          <div className="grid grid-cols-4 gap-2 bg-[#09090c]/50 p-3 rounded-2xl border border-zinc-900/60 shadow-inner">
            <div className="text-center p-1.5 bg-[#0d0d12]/60 rounded-xl border border-zinc-900/40">
              <span className="text-sm font-mono font-extrabold text-zinc-400 block leading-none">{totalReqCount}</span>
              <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider block font-black mt-1">Topl. İstek</span>
            </div>
            <div className="text-center p-1.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
              <span className="text-sm font-mono font-extrabold text-amber-400 block leading-none">{pendingReqCount}</span>
              <span className="text-[7px] font-mono text-amber-600 uppercase tracking-wider block font-black mt-1">Değerlendir.</span>
            </div>
            <div className="text-center p-1.5 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <span className="text-sm font-mono font-extrabold text-blue-400 block leading-none">{approvedReqCount}</span>
              <span className="text-[7px] font-mono text-blue-600 uppercase tracking-wider block font-black mt-1">Onaylanan</span>
            </div>
            <div className="text-center p-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <span className="text-sm font-mono font-extrabold text-emerald-400 block leading-none">{completedReqCount}</span>
              <span className="text-[7px] font-mono text-emerald-600 uppercase tracking-wider block font-black mt-1">Tamamlanan</span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-zinc-900/60">
            <button
              onClick={() => setActiveTab("popular")}
              className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "popular"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              POPÜLER
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              EN YENİ
            </button>
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "new"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <PlusCircle size={13} />
              İSTEK GÖNDER
            </button>
          </div>

          {/* Status Sub-Filters (Only shown when not in 'new' submit request tab) */}
          {activeTab !== "new" && (
            <div className="flex flex-wrap gap-1.5 items-center bg-[#09090c]/40 p-2 rounded-xl border border-zinc-900/50">
              <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest flex items-center px-1">Durum:</span>
              {(["all", "pending", "approved", "completed"] as const).map((status) => {
                const labels = {
                  all: "TÜMÜ",
                  pending: "BEKLEMEDE",
                  approved: "ONAYLANAN",
                  completed: "TAMAMLANAN"
                };
                const activeColorClasses = {
                  all: "bg-zinc-800 border-zinc-700 text-zinc-100",
                  pending: "bg-amber-500/15 border-amber-500/30 text-amber-400",
                  approved: "bg-blue-500/15 border-blue-500/30 text-blue-400",
                  completed: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                };
                return (
                  <button
                    key={status}
                    onClick={() => setRequestStatusFilter(status)}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-black tracking-wider cursor-pointer border transition-all ${
                      requestStatusFilter === status
                        ? activeColorClasses[status]
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5"
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Talebiniz başarıyla gönderildi ve listelendi! Teşekkürler.</span>
                </motion.div>
              )}

              {activeTab === "new" ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSubmitRequest}
                  className="space-y-4 pt-1"
                >
                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">İSTEK BAŞLIĞI</label>
                    <input
                      type="text"
                      placeholder="Örn: 3D Camera Shake Preseti"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">KATEGORİ</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-red-500/50 transition-colors"
                    >
                      {categoriesList.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">AÇIKLAMA / DETAYLAR</label>
                    <textarea
                      placeholder="Lütfen talebinizi kısaca açıklayın. Ne tür bir efekt / preset istiyorsunuz?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">REFERANS LİNK VEYA EK DOSYA (İSTEĞE BAĞLI)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="https://youtube.com/watch?... veya Google Drive linki"
                          value={referenceUrl}
                          onChange={(e) => setReferenceUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                        <Link2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      </div>
                      
                      <label className="shrink-0 flex items-center justify-center px-4 py-2 bg-[#0d0d12] hover:bg-zinc-900 active:scale-95 text-[10px] font-mono font-extrabold text-zinc-300 hover:text-white rounded-xl border border-zinc-850 hover:border-zinc-700 cursor-pointer transition-all gap-1.5">
                        {isUploading ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-red-500" />
                            <span>YÜKLENİYOR...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={12} className="text-red-500" />
                            <span>DOSYA SEÇ</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="*/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-mono">
                      Talep ettiğiniz efekte dair ekran görüntüsü, video, preset veya ZIP dosyası yükleyebilir ya da indirme linki bırakabilirsiniz. (Maks 100MB)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-lg shadow-red-600/10 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>GÖNDERİLİYOR...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>TALEBİ YAYINLA</span>
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 pt-1"
                >
                  {filteredRequests.length === 0 ? (
                    <div className="p-8 text-center text-zinc-600 text-xs font-mono">
                      Bu filtre ile eşleşen hiçbir istek bulunamadı.
                    </div>
                  ) : (
                    filteredRequests.map((req) => {
                      const hasVoted = votedIds.includes(req.id);
                      const statusInfo = getStatusBadge(req.status);
                      const percent = getProgressPercentage(req.status);
                      
                      const barColorClass = req.status === "completed" 
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                        : req.status === "approved"
                        ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                        : req.status === "rejected"
                        ? "bg-red-500"
                        : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";

                      return (
                        <div
                          key={req.id}
                          className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-start gap-4 hover:border-zinc-850 transition-colors group"
                        >
                          {/* Vote Button */}
                          <button
                            onClick={() => handleVote(req.id)}
                            disabled={hasVoted}
                            className={`shrink-0 flex flex-col items-center justify-center w-11 py-2 rounded-xl border transition-all cursor-pointer ${
                              hasVoted
                                ? "bg-red-500/10 border-red-500/25 text-red-500"
                                : "bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-zinc-400 hover:text-white"
                            }`}
                            title={hasVoted ? "Oy verdiniz" : "Bu isteği destekle"}
                          >
                            <ThumbsUp size={12} className={hasVoted ? "fill-red-500/20" : ""} />
                            <span className="text-[10px] font-mono font-bold mt-1">
                              {req.votes || 0}
                            </span>
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-mono font-bold text-zinc-500 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-850/50">
                                {req.category}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusInfo.class}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            
                            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors uppercase">
                              {req.title}
                            </h4>
                            
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {req.description}
                            </p>

                            {/* Roadmap Progress Bar */}
                            <div className="space-y-1 pt-1 select-none">
                              <div className="flex justify-between items-center text-[7px] font-mono font-extrabold tracking-wider text-zinc-500">
                                <span>GELİŞİM SÜRECİ</span>
                                <span className={req.status === "completed" ? "text-emerald-400" : req.status === "approved" ? "text-blue-400" : "text-amber-400"}>
                                  {percent}% {req.status === "completed" ? "TAMAMLANDI" : req.status === "approved" ? "HAZIRLANIYOR" : "DEĞERLENDİRİLİYOR"}
                                </span>
                              </div>
                              <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden border border-zinc-850/40">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${barColorClass}`}
                                />
                              </div>
                            </div>

                            {req.referenceUrl && (
                              <div className="pt-1">
                                <a 
                                  href={req.referenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 text-[9px] font-mono font-extrabold text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                                >
                                  <ExternalLink size={10} />
                                  <span>EKLİ DOSYA / REFERANS LİNK</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
