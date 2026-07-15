import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, runTransaction, onSnapshot } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const firebaseApp = initializeApp(firebaseConfig);

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

const DEFAULT_CONTENT = {
  visitorCount: 0,
  settings: {
    adminPassword: "kreatifadmin",
    topBarText: "KREATİF EDİT PACK",
    loadingText: "KREATİF EDİT PACK yükleniyor...",
    heroTitle: "KREATİF EDİT PACK",
    heroSub: "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır.",
    heroBadge: "AFTER EFFECTS PACKS",
    pluginTitle: "Gerekli Pluginler",
    pluginDesc: "Kurulum videosunu izle",
    pluginUrl: "https://youtube.com",
    portfolioUrl: "https://youtube.com",
    bioTitle: "BEN KİMİM?",
    bioSub: "01 / CREATOR",
    bioName: "KREATİF EDİTÖR",
    bioRole: "VIDEO EDITOR • MOTION DESIGNER",
    bioDescription: "Uzun yıllardır After Effects ve video kurgu üzerine çalışıyorum. Bu arşiv, kurgularınızı profesyonel seviyeye taşımak için özenle hazırladığım efekt paketlerinden oluşuyor.",
    bioImage: "",
    stats: [
      { label: "ABONE", value: "10K+" },
      { label: "VİDEO", value: "250+" },
      { label: "İZLENME", value: "1M+" }
    ],
    socialLinks: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      discord: "https://discord.gg",
      tiktok: "https://tiktok.com"
    }
  },
  categories: [
    {
      id: "overlays",
      index: "01",
      badge: "VISUALS",
      title: "Overlays & Texture Packs",
      description: "Videolarınıza sinematik hava katacak özel kaplamalar, toz ve çizik efektleri.",
      gradient: "from-purple-950/40 via-zinc-950/90 to-purple-950/20 hover:border-purple-500/20",
      items: [
        {
          id: "ov1",
          name: "Cinematic Dust Overlay",
          size: "142 MB",
          description: "4K çözünürlükte, 24fps sinematik toz ve duman kaplama efekti.",
          downloadUrl: "https://drive.google.com"
        }
      ]
    },
    {
      id: "sfx",
      index: "02",
      badge: "AUDIO",
      title: "Sound Effects (SFX) Library",
      description: "Geçiş sesleri, darbe efektleri, rüzgar uğultuları ve profesyonel foley kayıtları.",
      gradient: "from-blue-950/40 via-zinc-950/90 to-blue-950/20 hover:border-blue-500/20",
      items: []
    }
  ],
  announcements: [
    {
      id: "welcome-announcement",
      title: "🔥 KREATİF EDİT ARŞİVİNE HOŞ GELDİNİZ!",
      message: " After Effects geçiş efektleri, özel kaplamalar, ses paketleri ve video kurgu kaynakları tek adreste. Yeni paketler her hafta ekleniyor!",
      type: "announcement",
      active: true,
      createdAt: new Date().toISOString(),
      linkText: "YouTube Kanalımı İncele",
      linkUrl: "https://youtube.com"
    }
  ],
  requests: [
    {
      id: "req-1",
      title: "RTX Motion Blur Preseti",
      description: "After Effects için pürüzsüz ve render süresini uzatmayan kaliteli bir motion blur ayarı gelebilir mi?",
      category: "Geçiş Efektleri",
      createdAt: new Date().toISOString(),
      status: "approved",
      votes: 42
    },
    {
      id: "req-2",
      title: "Glitch SFX Paketi",
      description: "Video geçişlerinde kullanmak için mekanik ve dijital arıza (glitch) ses efektleri çok iyi olur.",
      category: "Sound Effects (SFX)",
      createdAt: new Date().toISOString(),
      status: "pending",
      votes: 18
    }
  ],
  faqs: [
    {
      id: "faq-1",
      question: "Efekt paketlerini ve .ffx dosyalarını After Effects'e nasıl kurarım?",
      answer: "İndirdiğiniz .ffx uzantılı dosyaları After Effects klasörünüzdeki 'Support Files > Presets' dizinine kopyalamanız yeterlidir. Ardından AE içinde 'Effects & Presets' panelinden arayarak kullanabilirsiniz.",
      active: true
    },
    {
      id: "faq-2",
      question: "İndirme linkleri güvenli mi, virüs riski var mı?",
      answer: "Tüm indirme linklerimiz güvenli ve doğrudan bulut depolama sunucularında (Google Drive vb.) barındırılır. Kesinlikle hiçbir virüs, reklam veya kısaltılmış link içermez.",
      active: true
    },
    {
      id: "faq-3",
      question: "Özel bir efekt veya preset talep edebilir miyim?",
      answer: "Evet! Sayfanın altındaki 'Kullanıcı İstek Kutusu' kısmından dilediğiniz efekti kategorisiyle birlikte talep edebilirsiniz. Diğer kullanıcılar da isteğinize oy verirse, en popüler istekleri sırasıyla hazırlayıp sisteme ekliyorum.",
      active: true
    },
    {
      id: "faq-4",
      question: "Paketler Premiere Pro ve diğer kurgu programlarında da çalışır mı?",
      answer: "Evet! Ses efektleri (SFX) ve video kaplamaları (overlays/textures) .wav ve .mp4/MOV formatında olduğu için Premiere Pro, DaVinci Resolve, CapCut ve Vegas Pro dahil tüm kurgu programlarıyla tam uyumludur. Sadece .ffx formatındaki presetler After Effects'e özeldir.",
      active: true
    },
    {
      id: "faq-5",
      question: "LUT ve Color Correction (CC) paketlerini nasıl uygulayabilirim?",
      answer: "CC paketleri içerisindeki .cube uzantılı LUT dosyalarını Premiere Pro'da Lumetri Color panelinden (Creative > Look bölümü) veya After Effects'te 'Apply Color LUT' efektiyle doğrudan videolarınıza uygulayabilirsiniz.",
      active: true
    },
    {
      id: "faq-6",
      question: "Twixtor ve Velocity (ağır çekim) ayarları hangi sürümlerle uyumludur?",
      answer: "Twixtor presetleri After Effects CC 2020 ve üzeri tüm sürümlerle uyumludur. Sorunsuz çalışması için sisteminizde RE:Vision Effects Twixtor eklentisinin kurulu olması gerekmektedir.",
      active: true
    },
    {
      id: "faq-7",
      question: "Videolardaki siyah arka planı (Overlay) nasıl temizleyebilirim?",
      answer: "Arşivdeki video kaplamalarını kurgu programınıza aktardıktan sonra, katman karıştırma modunu (Blending Mode) 'Screen' (Ekran) veya 'Add' (Doğrusal Ekleme) olarak değiştirerek siyah arka planı saniyeler içinde şeffaf hale getirebilirsiniz.",
      active: true
    },
    {
      id: "faq-8",
      question: "Telif hakkı sorunu yaşar mıyım? Ticari projelerde kullanılabilir mi?",
      answer: "Kesinlikle hayır. Arşivdeki tüm sesler, kaplamalar ve presetler telifsizdir (royalty-free). Kendi YouTube videolarınızda, Instagram editlerinizde veya ticari marka projelerinizde dilediğiniz gibi telif sorunu yaşamadan kullanabilirsiniz.",
      active: true
    },
    {
      id: "faq-9",
      question: "Dosya indirme limitleri veya şifreleri var mı?",
      answer: "Arşivimizdeki tüm indirmeler tamamen şifresiz, reklamsız ve doğrudan yüksek hızlı Google Drive / Mega linklerinden oluşur. Herhangi bir kota veya hız sınırı bulunmamaktadır.",
      active: true
    },
    {
      id: "faq-10",
      question: "After Effects 'Expression error' hatası alıyorum, nasıl düzeltebilirim?",
      answer: "Expression hataları genellikle dil uyumsuzluğundan kaynaklanır. Kullandığınız After Effects Türkçe ise, İngilizceye özel yazılan presetler hata verebilir. AE'yi İngilizceye çevirmek veya After Effects ayarlarından Expression motorunu 'Legacy ExtendScript' yerine 'Modern JavaScript' yapmak bu hatayı saniyeler içinde çözer.",
      active: true
    },
    {
      id: "faq-11",
      question: "Element 3D, Sapphire veya RSMB gibi eklentiler (pluginler) olmadan paketler çalışır mı?",
      answer: "Sapphire, RSMB, Twixtor, Element 3D veya Deep Glow gerektiren presetlerin yanındaki açıklamalarda gerekli eklentiler belirtilmiştir. Sisteminizde bu harici pluginler yüklü değilse o efektler düzgün çalışmaz. Ancak temel geçişler, sesler, LUT'lar ve overlay'ler için hiçbir ek eklentiye ihtiyacınız yoktur.",
      active: true
    },
    {
      id: "faq-12",
      question: "Videolardaki yeşil ekran (Green Screen) arka planı After Effects'te nasıl temizlerim?",
      answer: "After Effects içinde 'Keylight (1.2)' efektini videonuzun üstüne sürükleyin. Efekt kontrol panelindeki damlalık (Screen Colour) aracıyla yeşil rengi seçin. İnce ayarlar için 'Screen Matte' sekmesi altındaki Clip Black ve Clip White değerleriyle oynayarak temizliği pürüzsüz hale getirebilirsiniz.",
      active: true
    },
    {
      id: "faq-13",
      question: "Render alırken After Effects çok kasıyor veya donuyor, ne yapmalıyım?",
      answer: "After Effects'te Edit > Preferences > Media & Disk Cache menüsünden 'Enable Disk Cache' seçeneğini aktif edin ve hızlı bir SSD disk seçin. Render alırken ise yerleşik render motoru yerine 'Adobe Media Encoder' kullanarak 'H.264 (MP4)' formatında donanım ivmeli (Hardware Acceleration) çıktı alabilirsiniz.",
      active: true
    },
    {
      id: "faq-14",
      question: "DaVinci Resolve veya CapCut kullanıcıları .ffx uzantılı dosyaları kullanabilir mi?",
      answer: "Hayır, .ffx dosyaları sadece After Effects programına özeldir. Ancak arşivde sunduğumuz profesyonel ses paketleri (SFX), video kaplamaları (Overlay) ve renk ayarları (.cube LUT) DaVinci Resolve, CapCut, Premiere Pro ve diğer tüm programlarla %100 uyumludur.",
      active: true
    },
    {
      id: "faq-15",
      question: "Sitedeki indirme linkleri kırık veya çalışmıyor, ne yapmalıyım?",
      answer: "Arşivimizdeki tüm linkleri düzenli olarak kontrol edip güncelliyoruz. Eğer yine de erişemediğiniz veya kota aşımı uyarısı veren bir linkle karşılaşırsanız, hemen sayfanın altındaki 'Kullanıcı İstek Kutusu' aracılığıyla bana bildirebilirsiniz. En kısa sürede alternatif linkler eklenecektir.",
      active: true
    },
    {
      id: "faq-16",
      question: "Yaptığım istekler ne zaman onaylanır veya arşive eklenir?",
      answer: "Gönderilen tüm istekleri admin panelinden günlük olarak inceliyorum. Onaylanan istekler 'İstekler' listesinde oylamaya açılır. En yüksek oy alan ve en çok talep edilen efektleri/paketleri her hafta sonu hazırlayıp indirme kategorilerine dahil ediyorum.",
      active: true
    }
  ]
};

export async function fetchSiteContent() {
  try {
    const docRef = doc(db, "site", "content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // If the faqs list is empty or has fewer than 10 items, upgrade to the rich list immediately to reflect new additions
      if (!data.faqs || data.faqs.length <= 9) {
        data.faqs = DEFAULT_CONTENT.faqs;
        await setDoc(docRef, data);
      }
      return data;
    } else {
      await setDoc(docRef, DEFAULT_CONTENT);
      return DEFAULT_CONTENT;
    }
  } catch (error) {
    console.error("Firestore fetch error:", error);
    throw error;
  }
}

export async function saveSiteContent(updatedContent: any) {
  try {
    const docRef = doc(db, "site", "content");
    await setDoc(docRef, updatedContent);
  } catch (error) {
    console.error("Firestore save error:", error);
    throw error;
  }
}

export async function incrementVisitorCount() {
  try {
    const docRef = doc(db, "site", "content");
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        transaction.set(docRef, { ...DEFAULT_CONTENT, visitorCount: 1 });
      } else {
        const newCount = (sfDoc.data().visitorCount || 0) + 1;
        transaction.update(docRef, { visitorCount: newCount });
      }
    });
  } catch (error) {
    console.error("Firestore transaction error:", error);
  }
}

export function subscribeToSiteContent(onUpdate: (content: any) => void, onError: (err: any) => void) {
  const docRef = doc(db, "site", "content");
  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        setDoc(docRef, DEFAULT_CONTENT)
          .then(() => onUpdate(DEFAULT_CONTENT))
          .catch(onError);
      }
    }, 
    (err) => {
      console.error("Firestore subscribe error:", err);
      onError(err);
    }
  );
}

export function getApiUrl(path: string): string {
  const origin = window.location.origin;
  if (
    origin.includes("github.io") || 
    origin.includes("localhost:517") || 
    origin.includes("127.0.0.1")
  ) {
    return `https://ais-pre-6teowb4yycr7gvrlclmvtb-94283634220.europe-west2.run.app${path}`;
  }
  return path;
}

