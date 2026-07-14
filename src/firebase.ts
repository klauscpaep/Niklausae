import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const firebaseApp = initializeApp(firebaseConfig);

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

const DEFAULT_CONTENT = {
  visitorCount: 0,
  settings: {
    adminPassword: "parsmaziadmin",
    topBarText: "PARS MAZI PACK",
    loadingText: "PARS MAZI EDIT PACK yükleniyor...",
    heroTitle: "PARS MAZI EDIT PACK",
    heroSub: "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır.",
    heroBadge: "AFTER EFFECTS PACKS",
    pluginTitle: "Gerekli Pluginler",
    pluginDesc: "Kurulum videosunu izle",
    pluginUrl: "https://youtube.com",
    portfolioUrl: "https://youtube.com",
    bioTitle: "BEN KİMİM?",
    bioSub: "01 / CREATOR",
    bioName: "PARS MAZI",
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
  ]
};

export async function fetchSiteContent() {
  try {
    const docRef = doc(db, "site", "content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
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
