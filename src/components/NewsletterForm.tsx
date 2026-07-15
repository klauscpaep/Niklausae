import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { SiteContent } from "../types";

interface NewsletterFormProps {
  content: SiteContent;
  onSaveContent: (updatedContent: SiteContent) => Promise<void>;
  onShowToast: (title: string, message: string, type: "success" | "info" | "new_package") => void;
}

export default function NewsletterForm({ content, onSaveContent, onShowToast }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem("kreatif_newsletter_subscribed") === "true";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      onShowToast("Hata ⚠️", "Lütfen geçerli bir e-posta adresi girin.", "info");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentSubscribers = content.subscribers || [];
      const emailLower = email.trim().toLowerCase();

      // Check if already subscribed in database
      const alreadyExists = currentSubscribers.some(
        (sub) => sub.email.toLowerCase() === emailLower
      );

      if (alreadyExists) {
        setIsSubscribed(true);
        localStorage.setItem("kreatif_newsletter_subscribed", "true");
        onShowToast("Zaten Abonesiniz! 💌", "Bu e-posta adresi bültenimize zaten kayıtlı.", "info");
        setIsSubmitting(false);
        return;
      }

      const newSubscriber = {
        id: Date.now().toString(),
        email: emailLower,
        subscribedAt: new Date().toISOString(),
      };

      const updatedContent: SiteContent = {
        ...content,
        subscribers: [...currentSubscribers, newSubscriber],
      };

      await onSaveContent(updatedContent);
      setIsSubscribed(true);
      localStorage.setItem("kreatif_newsletter_subscribed", "true");
      onShowToast("Abonelik Başarılı! 🎉", "Yeni paketler eklendiğinde ilk siz haberdar olacaksınız.", "success");
      setEmail("");
    } catch (err) {
      console.error(err);
      onShowToast("Hata ⚠️", "Abonelik gerçekleştirilirken bir hata oluştu.", "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 mt-12 mb-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/70 p-6 md:p-8 shadow-2xl hover:border-red-500/20 transition-all duration-500">
        {/* Futuristic Background Accents */}
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-amber-600/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
          {/* Header Texts */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-red-500 tracking-wider uppercase">BÜLTEN BİLDİRİMLERİ</span>
            </div>
            <h3 className="text-xl font-display font-black text-white tracking-tight uppercase">
              YENİ PAKETLERDEN İLK SİZ HABERDAR OLUN!
            </h3>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xl font-mono">
              Arşive eklenen her yeni geçiş efekti, SFX kütüphanesi veya Premiere/After Effects presetlerinden anında haberdar olmak için e-postanızla abone olun. Reklamsız ve spam içermez.
            </p>
          </div>

          {/* Interactive Form or Subscribed Message */}
          <div className="w-full md:w-auto shrink-0 md:min-w-[340px]">
            {isSubscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-red-950/10 border border-red-900/20 rounded-2xl text-red-400"
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-red-500 animate-bounce" />
                <div className="space-y-0.5">
                  <p className="text-xs font-mono font-black uppercase tracking-wider">BÜLTENE ABONESİNİZ!</p>
                  <p className="text-[10px] text-zinc-400 font-mono">Desteğiniz için çok teşekkür ederiz.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-zinc-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    placeholder="E-posta adresinizi girin..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#08090d] border border-zinc-850 focus:border-red-500/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-900 disabled:border-zinc-800 disabled:text-zinc-500 text-white font-mono font-black text-xs tracking-widest uppercase rounded-xl border border-red-500 transition-all active:scale-98 shadow-md shadow-red-600/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      KAYDEDİLİYOR...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      BÜLTENE ABONE OL
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
