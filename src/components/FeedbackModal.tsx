import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { SiteContent, SuggestionRequest } from "../types";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SiteContent;
  onSaveContent: (updated: SiteContent) => Promise<void>;
  onShowToast: (title: string, message: string, type: "success" | "info" | "new_package") => void;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  content,
  onSaveContent,
  onShowToast
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<"Öneri" | "Şikâyet">("Öneri");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Konu alanı boş bırakılamaz.");
      return;
    }
    if (!description.trim()) {
      setError("Mesaj alanı boş bırakılamaz.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const newRequest: SuggestionRequest = {
      id: Date.now().toString() + Math.random().toString().substring(2, 6),
      title: title.trim(),
      description: description.trim(),
      category: feedbackType === "Öneri" ? "Öneri & Geliştirme" : "Şikâyet & Geri Bildirim",
      createdAt: new Date().toISOString(),
      status: "pending",
      votes: 0,
      feedbackType,
      userName: userName.trim() || undefined,
      contactInfo: contactInfo.trim() || undefined
    };

    const updatedRequests = [newRequest, ...(content.requests || [])];
    const updatedContent = {
      ...content,
      requests: updatedRequests
    };

    try {
      await onSaveContent(updatedContent);
      setSubmitSuccess(true);
      onShowToast(
        "Mesajınız İletildi! 🚀",
        `${feedbackType} bildiriminiz yönetici paneline başarıyla kaydedildi.`,
        "success"
      );
      // Reset form
      setTitle("");
      setDescription("");
      setUserName("");
      setContactInfo("");
    } catch (err) {
      console.error(err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0c0d12] border border-zinc-900/90 rounded-[28px] shadow-[0_24px_50px_rgba(0,0,0,0.8)] overflow-hidden z-10"
        >
          {/* Subtle Orange top highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-orange-500/80 via-purple-600/80 to-indigo-600/80" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-850/60 hover:border-zinc-800 transition-all cursor-pointer z-20"
          >
            <X size={15} />
          </button>

          <div className="p-7 sm:p-9 space-y-6">
            {!submitSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff5e3a] block">
                    BİZE ULAŞ
                  </span>
                  <h3 className="text-3xl font-display font-black text-white tracking-tight leading-tight">
                    Görüşün değerli.
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Önerini veya yaşadığın sorunu kısa şekilde anlat.
                  </p>
                </div>

                {/* Segmented Control / Tab Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#06070a] border border-zinc-950 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackType("Öneri");
                      setError(null);
                    }}
                    className={`py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer border ${
                      feedbackType === "Öneri"
                        ? "bg-zinc-900/80 text-white border-zinc-800 shadow-inner"
                        : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    Öneri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackType("Şikâyet");
                      setError(null);
                    }}
                    className={`py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer border ${
                      feedbackType === "Şikâyet"
                        ? "bg-zinc-900/80 text-white border-zinc-800 shadow-inner"
                        : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    Şikâyet
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-950/40 rounded-xl flex items-center gap-2 text-red-400 text-xs font-mono">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Subject Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                      Konu
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full px-4 py-3 bg-[#050609] border border-zinc-900 focus:border-red-500/25 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none transition-colors"
                      placeholder={feedbackType === "Öneri" ? "Örn. Yeni kategori isteği, efekt talebi" : "Örn. İndirme bağlantısı hatası, bozuk link"}
                    />
                  </div>

                  {/* Message Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                        Mesaj
                      </label>
                      <span className="text-[9px] font-mono text-zinc-600">
                        {description.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setDescription(e.target.value);
                          if (error) setError(null);
                        }
                      }}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#050609] border border-zinc-900 focus:border-red-500/25 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none transition-colors resize-none"
                      placeholder="Düşünceni buraya yaz..."
                    />
                  </div>

                  {/* Name (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                        İsim
                      </label>
                      <span className="text-[9px] font-mono text-zinc-600 font-medium">isteğe bağlı</span>
                    </div>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#050609] border border-zinc-900 focus:border-red-500/25 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none transition-colors"
                      placeholder="Adın veya kullanıcı adın"
                    />
                  </div>

                  {/* Contact info (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                        İletişim
                      </label>
                      <span className="text-[9px] font-mono text-zinc-600 font-medium">isteğe bağlı</span>
                    </div>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full px-4 py-3 bg-[#050609] border border-zinc-900 focus:border-red-500/25 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none transition-colors"
                      placeholder="Discord kullanıcı adı veya e-posta"
                    />
                  </div>
                </div>

                {/* Submit button with orange-to-purple gradient */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-purple-600 to-indigo-600 hover:from-orange-400 hover:via-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs tracking-widest text-center uppercase rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>İLETİLİYOR...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Mesajı Gönder</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Success State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-6"
              >
                <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">
                    Mesajınız Alındı!
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Değerli geri bildiriminiz için teşekkür ederiz. {feedbackType} bildiriminiz başarıyla iletilmiştir ve yöneticilerimiz tarafından incelenecektir.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-850 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Kapat
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
