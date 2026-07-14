import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "site_content.json");

// Firebase setup
const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let db: any = null;

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    firebaseApp = initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    console.log("Firebase initialized successfully with project ID:", firebaseConfig.projectId);
  } else {
    console.warn("firebase-applet-config.json not found. Offline fallback mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase", err);
}

app.use(express.json({ limit: "10mb" }));

// Default high-fidelity site content representing Pars Mazi Edit Pack
const DEFAULT_CONTENT = {
  visitorCount: 775,
  settings: {
    heroTitle: "PARS MAZI EDIT PACK",
    heroBadge: "AFTER EFFECTS PACKS",
    heroSub: "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır.",
    pluginTitle: "Gerekli Pluginler",
    pluginDesc: "Kurulum videosunu izle",
    pluginUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder or can be customized
    bioTitle: "BEN KİMİM?",
    bioSub: "PARSMAZI / CREATIVE PROFILE",
    bioImage: "pars_mazi_profile_1784000260155.jpg", // The generated profile photo filename
    stats: [
      { value: "6+", label: "YILLIK DENEYİM" },
      { value: "Ae", label: "MOTION DESIGN" },
      { value: "Pr", label: "VİDEO KURGU" }
    ],
    portfolioUrl: "https://www.behance.net",
    socialLinks: {
      youtube: "https://youtube.com/@parsmazi",
      instagram: "https://instagram.com/parsmazi",
      discord: "https://discord.gg/parsmazi",
      tiktok: "https://tiktok.com/@parsmazi"
    },
    adminPassword: "admin" // Default admin password
  },
  categories: [
    {
      id: "cat_1",
      index: "01",
      title: "Renk Efektleri",
      badge: "7 RENK EFEKTİ",
      description: "After Effects için en popüler renk derecelendirme (LUT) ve CC ayarları.",
      gradient: "from-amber-500/20 to-red-600/10 hover:border-amber-500/40",
      items: [
        {
          id: "item_1_1",
          name: "Cinema Gold CC",
          size: "15 KB",
          downloadUrl: "https://gofile.io/",
          description: "Sinematik sıcak cilt tonları ve derin kontrastlı gölgeler sunan özel CC ayarı."
        },
        {
          id: "item_1_2",
          name: "Cyberpunk Neon CC",
          size: "24 KB",
          downloadUrl: "https://gofile.io/",
          description: "Mavi ve pembe tonların ön planda olduğu, gece kurgularına özel fütüristik renk ayarı."
        },
        {
          id: "item_1_3",
          name: "Vintage Film LUT",
          size: "45 KB",
          downloadUrl: "https://gofile.io/",
          description: "Kodak 500T film rulosundan esinlenilmiş, doğal grenli vintage hissi."
        },
        {
          id: "item_1_4",
          name: "Aesthetic Soft CC",
          size: "12 KB",
          downloadUrl: "https://gofile.io/",
          description: "Yumuşak pastel tonlar ve hafif sis efektiyle rüya gibi bir atmosfer."
        },
        {
          id: "item_1_5",
          name: "Dark Moody CC",
          size: "18 KB",
          downloadUrl: "https://gofile.io/",
          description: "Gizemli, karanlık temalı ve yeşil ağırlıklı gerilim/aksiyon CC'si."
        },
        {
          id: "item_1_6",
          name: "Anime Pop CC",
          size: "30 KB",
          downloadUrl: "https://gofile.io/",
          description: "AMV editörleri için renkleri canlandıran, yüksek kontrastlı ve parlak CC ayarı."
        },
        {
          id: "item_1_7",
          name: "Ice & Fire CC",
          size: "22 KB",
          downloadUrl: "https://gofile.io/",
          description: "Soğuk mavi gölgeler ile sıcak turuncu ışıkların kusursuz tezatlığı."
        }
      ]
    },
    {
      id: "cat_2",
      index: "02",
      title: "Shake'ler",
      badge: "4 SHAKE EFEKTİ",
      description: "Vuruşlara ve ritme mükemmel uyum sağlayan kamera sarsıntı presetleri.",
      gradient: "from-blue-500/20 to-indigo-600/10 hover:border-blue-500/40",
      items: [
        {
          id: "item_2_1",
          name: "Y-Shake Intense (Dikey)",
          size: "8 KB",
          downloadUrl: "https://gofile.io/",
          description: "Beat vuruşlarında dikey eksende hızlı ve sert bir sarsıntı sağlayan sarsma efekti."
        },
        {
          id: "item_2_2",
          name: "X-Rotational Shake (Yatay)",
          size: "12 KB",
          downloadUrl: "https://gofile.io/",
          description: "Yatayda hafif dönüşlü, akıcı geçişler için kullanılan yumuşak kamera sarsıntısı."
        },
        {
          id: "item_2_3",
          name: "Zoom-In Hit Shake",
          size: "10 KB",
          downloadUrl: "https://gofile.io/",
          description: "Hızlı bir yakınlaşma ile birlikte gelen, aksiyon sahnelerinde darbe hissini artıran preset."
        },
        {
          id: "item_2_4",
          name: "Soft Ambient Drift",
          size: "14 KB",
          downloadUrl: "https://gofile.io/",
          description: "Slow-motion kliplerinizde el kamerası havası veren doğal ve yavaş salınım."
        }
      ]
    },
    {
      id: "cat_3",
      index: "03",
      title: "Twixtor Ayarları",
      badge: "2 TWİXTOR EFEKTİ",
      description: "Kliplerinizi pürüzsüzce yavaşlatmak için optimize edilmiş hız rampası (Velocity) ayarları.",
      gradient: "from-teal-500/20 to-emerald-600/10 hover:border-teal-500/40",
      items: [
        {
          id: "item_3_1",
          name: "Ultra Smooth 60fps Velocity",
          size: "5 KB",
          downloadUrl: "https://gofile.io/",
          description: "Anime ve oyun kurgularında klipleri frame kaybı olmadan pürüzsüzce yavaşlatan Twixtor ayarı."
        },
        {
          id: "item_3_2",
          name: "Twixtor Slow-Fast Ramp",
          size: "7 KB",
          downloadUrl: "https://gofile.io/",
          description: "Klasik velocity editi hissi: Beat öncesi hızlı, vuruş anında ultra yavaş geçiş."
        }
      ]
    },
    {
      id: "cat_4",
      index: "04",
      title: "Geçiş Efektleri",
      badge: "5 GEÇİŞ EFEKTİ",
      description: "Klipler arasında sinematik, akıcı veya agresif geçiş efektleri.",
      gradient: "from-purple-500/20 to-fuchsia-600/10 hover:border-purple-500/40",
      items: [
        {
          id: "item_4_1",
          name: "3D Slide Transition",
          size: "32 KB",
          downloadUrl: "https://gofile.io/",
          description: "Hareket bulanıklığı (motion blur) içeren, üç boyutlu kayma efekti."
        },
        {
          id: "item_4_2",
          name: "Glow Spin Warp",
          size: "40 KB",
          downloadUrl: "https://gofile.io/",
          description: "Klibi döndürerek ve kenarlara ışıma vererek diğer klibe bağlayan sihirli geçiş."
        },
        {
          id: "item_4_3",
          name: "Luma Fade Transition",
          size: "18 KB",
          downloadUrl: "https://gofile.io/",
          description: "Klibin parlaklık değerlerine göre yavaşça silinerek alttaki klibin belirmesi."
        },
        {
          id: "item_4_4",
          name: "Glitch Flash Transition",
          size: "26 KB",
          downloadUrl: "https://gofile.io/",
          description: "Renk ayrışması (chromatic aberration) ve elektro parıltısı içeren dijital arıza geçişi."
        },
        {
          id: "item_4_5",
          name: "Whip Pan Blur",
          size: "15 KB",
          downloadUrl: "https://gofile.io/",
          description: "Yüksek hızlı kamera çevirme taklidi yapan, aksiyon kurgularının vazgeçilmezi."
        }
      ]
    },
    {
      id: "cat_5",
      index: "05",
      title: "Diğer Efektler",
      badge: "4 ÖZEL EFEKT",
      description: "Kurgularınıza benzersiz görsel detaylar katacak özel efektler.",
      gradient: "from-pink-500/20 to-rose-600/10 hover:border-pink-500/40",
      items: [
        {
          id: "item_5_1",
          name: "RGB Split Glitch",
          size: "45 KB",
          downloadUrl: "https://gofile.io/",
          description: "Kırmızı, yeşil ve mavi kanalları birbirinden ayırarak retro-fütüristik bir arıza efekti sunar."
        },
        {
          id: "item_5_2",
          name: "Heat Distortion Warp",
          size: "55 KB",
          downloadUrl: "https://gofile.io/",
          description: "Klibin arkasında gerçekçi ısı dalgalanması yaratan kırılma efekti."
        },
        {
          id: "item_5_3",
          name: "Vaporwave Scanlines",
          size: "30 KB",
          downloadUrl: "https://gofile.io/",
          description: "Eski tüplü televizyon (CRT) tarama çizgileri ve retro 90'lar atmosferi."
        },
        {
          id: "item_5_4",
          name: "Edge Glow Neon",
          size: "20 KB",
          downloadUrl: "https://gofile.io/",
          description: "Kliplerdeki nesnelerin veya karakterlerin kenarlarını algılayıp parlayan neon çizgileri çizer."
        }
      ]
    },
    {
      id: "cat_6",
      index: "06",
      title: "Ses Efektleri",
      badge: "24 SES EFEKTİ",
      description: "Editi hissettiren, derinlik katan yüksek kaliteli sinematik ses kütüphanesi.",
      gradient: "from-cyan-500/20 to-sky-600/10 hover:border-cyan-500/40",
      items: [
        {
          id: "item_6_1",
          name: "Cinematic Whoosh Bass",
          size: "1.2 MB",
          downloadUrl: "https://gofile.io/",
          description: "Geçişleri ve vuruşları destansı kılan alçak frekanslı rüzgar/swoosh sesi."
        },
        {
          id: "item_6_2",
          name: "Metal Hit Reverberation",
          size: "2.4 MB",
          downloadUrl: "https://gofile.io/",
          description: "Derin yankılı, metalik bir darbe sesi. Büyük aksiyon vuruşları için idealdir."
        },
        {
          id: "item_6_3",
          name: "Retro Laser Zap",
          size: "350 KB",
          downloadUrl: "https://gofile.io/",
          description: "8-bit oyun temalı geçişlerde veya hızlı pop-up efektlerinde kullanılan lazer sesi."
        },
        {
          id: "item_6_4",
          name: "Analog Vinyl Scratch",
          size: "820 KB",
          downloadUrl: "https://gofile.io/",
          description: "Editi aniden durdurmak veya retro bir hava yaratmak için plak sürtme sesi."
        }
      ]
    }
  ]
};

// Helper to read data safely
let cachedData: any = null;

async function readData() {
  if (!db) {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error reading site_content.json", err);
    }
    return DEFAULT_CONTENT;
  }

  try {
    const docRef = doc(db, "site", "content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedData = docSnap.data();
      return cachedData;
    } else {
      console.log("No content found in Firestore. Seeding with default data...");
      await setDoc(docRef, DEFAULT_CONTENT);
      cachedData = DEFAULT_CONTENT;
      return DEFAULT_CONTENT;
    }
  } catch (err) {
    console.error("Error reading from Firestore:", err);
    if (cachedData) return cachedData;
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (fileErr) {
      console.error("Error reading local fallback file:", fileErr);
    }
    return DEFAULT_CONTENT;
  }
}

// Helper to write data safely
async function writeData(data: any) {
  cachedData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local fallback file:", err);
  }

  if (!db) return;

  try {
    const docRef = doc(db, "site", "content");
    await setDoc(docRef, data);
    console.log("Firestore content updated successfully.");
  } catch (err) {
    console.error("Error writing to Firestore:", err);
  }
}

// API Routes
app.get("/api/content", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "İçerikler yüklenemedi." });
  }
});

app.post("/api/content", async (req, res) => {
  try {
    const { password, content } = req.body;
    const currentData = await readData();

    if (password !== currentData.settings.adminPassword) {
      return res.status(403).json({ error: "Hatalı yönetici şifresi!" });
    }

    // Preserve visitorCount if not explicitly provided
    const updatedContent = {
      ...content,
      visitorCount: content.visitorCount !== undefined ? content.visitorCount : currentData.visitorCount
    };

    await writeData(updatedContent);
    res.json({ success: true, content: updatedContent });
  } catch (err) {
    res.status(500).json({ error: "Güncelleme sırasında sunucu hatası oluştu." });
  }
});

app.post("/api/visit", async (req, res) => {
  try {
    const data = await readData();
    data.visitorCount = (data.visitorCount || 0) + 1;
    await writeData(data);
    res.json({ visitorCount: data.visitorCount });
  } catch (err) {
    res.status(500).json({ error: "Ziyaretçi sayısı güncellenemedi." });
  }
});

// Vite middleware and static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
