import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref as fbStorageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Storage as GCSStorage } from "@google-cloud/storage";
import multer from "multer";
import { Blob } from "buffer";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "site_content.json");

// Robust CORS and Preflight handler
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Configure uploads directory and multer
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize the original name to pure ASCII safe characters
    const safeBaseName = (file.originalname || "upload")
      .replace(/[^a-zA-Z0-9.]/g, "_")
      .substring(0, 80);
    const ext = path.extname(safeBaseName) || ".bin";
    cb(null, "file-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // limit to 100MB for media/video files
  },
});

// Serve uploads statically
app.use("/uploads", express.static(uploadsDir));

// Firebase setup
const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let db: any = null;
let storageBucket: any = null;
let storageBucketName: string | null = null;

// Anonymous authentication helper to satisfy Firebase security rules
async function ensureAuthenticated() {
  if (!firebaseApp) return;
  try {
    const auth = getAuth(firebaseApp);
    if (!auth.currentUser) {
      console.log("[Firebase Auth] Server signing in anonymously...");
      await signInAnonymously(auth);
      console.log("[Firebase Auth] Signed in successfully as:", auth.currentUser?.uid);
    }
  } catch (authErr) {
    console.error("[Firebase Auth] Anonymous sign in failed:", authErr);
  }
}

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    firebaseApp = initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    console.log("Firebase initialized successfully with project ID:", firebaseConfig.projectId);
    
    if (firebaseConfig.storageBucket) {
      storageBucket = getStorage(firebaseApp);
      storageBucketName = firebaseConfig.storageBucket;
      console.log("Firebase Storage initialized with bucket:", firebaseConfig.storageBucket);
    }
  } else {
    console.warn("firebase-applet-config.json not found. Offline fallback mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase", err);
}

app.use(express.json({ limit: "10mb" }));

// Default high-fidelity site content representing Kreatif Edit Arşivi
const DEFAULT_CONTENT = {
  visitorCount: 775,
  settings: {
    heroTitle: "KREATİF EDİT PACK",
    heroBadge: "AFTER EFFECTS PACKS",
    heroSub: "İncelemek istediğin paketi seç. Yalnızca seçtiğin kategori açılır.",
    pluginTitle: "Gerekli Pluginler",
    pluginDesc: "Kurulum videosunu izle",
    pluginUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder or can be customized
    bioTitle: "BEN KİMİM?",
    bioSub: "EDİTÖR / KREATİF PROFİL",
    bioImage: "pars_mazi_profile_1784000260155.jpg", // The generated profile photo filename
    stats: [
      { value: "6+", label: "YILLIK DENEYİM" },
      { value: "Ae", label: "MOTION DESIGN" },
      { value: "Pr", label: "VİDEO KURGU" }
    ],
    portfolioUrl: "https://www.behance.net",
    socialLinks: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      discord: "https://discord.gg",
      tiktok: "https://tiktok.com"
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
    }
  ]
};

// Helper to read data safely
let cachedData: any = null;

function sanitizeContent(data: any): any {
  if (!data) return data;
  try {
    let str = JSON.stringify(data);
    str = str.replace(/Pars Mazi Edit Pack/gi, "Kreatif Edit Arşivi");
    str = str.replace(/PARS MAZI EDIT PACK/gi, "KREATİF EDİT PACK");
    str = str.replace(/PARS MAZI PACK/gi, "KREATİF EDİT PACK");
    str = str.replace(/Pars Mazi/gi, "Kreatif Editör");
    str = str.replace(/PARS MAZI/gi, "KREATİF EDİTÖR");
    str = str.replace(/PARSMAZI/gi, "KREATİF EDİTÖR");
    str = str.replace(/@parsmazi/gi, "@kreatifeditor");
    str = str.replace(/parsmazi/gi, "kreatifeditor");
    str = str.replace(/pars_mazi/gi, "kreatif_editor");
    return JSON.parse(str);
  } catch (e) {
    console.error("Sanitizing failed:", e);
    return data;
  }
}

async function readData() {
  if (!db) {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const originalData = JSON.parse(raw);
        const sanitized = sanitizeContent(originalData);
        if (JSON.stringify(originalData) !== JSON.stringify(sanitized)) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(sanitized, null, 2), "utf-8");
        }
        return sanitized;
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
      const originalData = docSnap.data();
      const sanitized = sanitizeContent(originalData);
      if (JSON.stringify(originalData) !== JSON.stringify(sanitized)) {
        console.log("Stale 'Pars Mazi' data detected in Firestore. Auto-sanitizing and writing back...");
        await setDoc(docRef, sanitized);
        cachedData = sanitized;
      } else {
        cachedData = originalData;
      }
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
        const originalData = JSON.parse(raw);
        const sanitized = sanitizeContent(originalData);
        if (JSON.stringify(originalData) !== JSON.stringify(sanitized)) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(sanitized, null, 2), "utf-8");
        }
        return sanitized;
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

// SMTP Dynamic Email Dispatcher Helper
async function sendMailHelper(settings: any, to: string, subject: string, html: string) {
  const host = settings?.smtpHost || process.env.SMTP_HOST;
  const port = parseInt(settings?.smtpPort || process.env.SMTP_PORT || "587");
  const user = settings?.smtpUser || process.env.SMTP_USER;
  const pass = settings?.smtpPass || process.env.SMTP_PASS;
  const fromEmail = settings?.smtpFrom || process.env.SMTP_FROM || user;
  const fromName = settings?.smtpFromName || process.env.SMTP_FROM_NAME || "Kreatif Edit Arşivi";

  if (!host || !user || !pass) {
    console.warn("[SMTP] Mail sending skipped: SMTP configurations are not fully set up.");
    return { success: false, reason: "SMTP settings incomplete in Admin Panel or .env" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false // Bypass SSL self-signed certificate issues if any
    }
  });

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  console.log(`[SMTP] Attempting to send email to ${to} via ${host}:${port}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log("[SMTP] Email sent successfully! MessageID:", info.messageId);
  return { success: true, messageId: info.messageId };
}

// API Routes
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-posta adresi gereklidir." });
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ error: "Geçersiz e-posta adresi." });
    }

    const content = await readData();
    const currentSubscribers = content.subscribers || [];

    const alreadyExists = currentSubscribers.some(
      (sub: any) => sub.email.toLowerCase() === emailLower
    );

    if (alreadyExists) {
      return res.json({ success: true, alreadyExists: true, message: "Zaten abonesiniz!" });
    }

    const newSubscriber = {
      id: "sub_" + Date.now() + "_" + Math.round(Math.random() * 1e6),
      email: emailLower,
      subscribedAt: new Date().toISOString(),
    };

    content.subscribers = [...currentSubscribers, newSubscriber];
    await writeData(content);

    // Send welcome email if SMTP is configured
    let emailSent = false;
    let emailError = null;
    try {
      const welcomeSubject = "Bülten Aboneliğiniz Onaylandı! 🎥 - Kreatif Edit Arşivi";
      const welcomeHtml = `
        <div style="background-color: #07070a; color: #ffffff; font-family: sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1f1f2e;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; letter-spacing: 4px; font-weight: 900; margin: 0 0 10px 0;">NIKLAUSAE</h1>
            <span style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px;">KREATİF EDİT ARCHIVE</span>
          </div>
          
          <div style="background-color: #0d0e15; padding: 30px; border-radius: 12px; border: 1px solid #141622; margin-bottom: 30px;">
            <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #1f1f2e; padding-bottom: 12px;">BÜLTEN ABONELİĞİNİZ BAŞLADI! 🎉</h2>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 15px 0;">
              Harika bir karar! Kreatif Edit Arşivi bültenine başarıyla katıldınız. 
            </p>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 15px 0;">
              Artık arşive eklenen <strong>yeni geçiş efektleri, After Effects presetleri, Premiere Pro şablonları veya yüksek kaliteli SFX kütüphanelerinden</strong> ilk siz haberdar olacaksınız.
            </p>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 15px 0;">
              Sistemdeki güncellemeleri kaçırmamak için bu e-postayı güvenli listenize eklemeyi unutmayın!
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://${req.headers.host || "niklausae-editpack.run.app"}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 13px; letter-spacing: 1px; display: inline-block; border: 1px solid #ef4444;">ARŞİVİ ZİYARET ET</a>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #1f1f2e; padding-top: 20px; font-size: 11px; color: #52525b;">
            <p style="margin: 5px 0;">© 2026 NIKLAUSAE EDIT PACK. Tüm hakları saklıdır.</p>
            <p style="margin: 5px 0;">Reklamsız • Spam içermez • İstediğiniz an ayrılabilirsiniz.</p>
          </div>
        </div>
      `;

      const mailResult = await sendMailHelper(content.settings, emailLower, welcomeSubject, welcomeHtml);
      if (mailResult.success) {
        emailSent = true;
      } else {
        emailError = mailResult.reason;
      }

      // Notify admin on new subscriber if enabled
      if (content.settings.notifyOnNewSubscriber) {
        const adminEmail = content.settings.smtpFrom || content.settings.smtpUser;
        if (adminEmail) {
          const adminSubject = "Yeni Bülten Abonesi Kaydoldu! 📬";
          const adminHtml = `
            <div style="background-color: #07070a; color: #ffffff; font-family: sans-serif; padding: 30px 20px; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f1f2e;">
              <h2 style="color: #ef4444; border-bottom: 1px solid #1f1f2e; padding-bottom: 10px; margin-top: 0;">YENİ BÜLTEN ABONESİ</h2>
              <p style="font-size: 13px; color: #a1a1aa;">Sitenizdeki bülten formunu dolduran yeni bir ziyaretçi var:</p>
              <div style="background-color: #0d0e15; padding: 15px; border-radius: 8px; border: 1px solid #1f1f2e; margin: 20px 0;">
                <p style="margin: 5px 0; font-size: 12px; color: #ffffff;"><strong>E-posta Adresi:</strong> ${emailLower}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #ffffff;"><strong>Kayıt Tarihi:</strong> ${new Date().toLocaleString("tr-TR")}</p>
              </div>
              <p style="font-size: 11px; color: #52525b; text-align: center;">NIKLAUSAE Admin Panel</p>
            </div>
          `;
          await sendMailHelper(content.settings, adminEmail, adminSubject, adminHtml).catch(() => {});
        }
      }
    } catch (mailErr: any) {
      console.error("[SMTP Error] Welcome email dispatch failed:", mailErr);
      emailError = mailErr.message;
    }

    res.json({ success: true, emailSent, emailError });
  } catch (err: any) {
    console.error("Subscribe API error:", err);
    res.status(500).json({ error: "Abonelik kaydedilirken sunucu hatası oluştu." });
  }
});

app.post("/api/test-smtp", async (req, res) => {
  try {
    const { password, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpFromName, testEmail } = req.body;
    const currentData = await readData();

    if (password !== currentData.settings.adminPassword) {
      return res.status(403).json({ error: "Hatalı yönetici şifresi!" });
    }

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !testEmail) {
      return res.status(400).json({ error: "Lütfen tüm SMTP bilgilerini ve test alıcı adresini doldurun." });
    }

    const testSettings = {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom: smtpFrom || smtpUser,
      smtpFromName: smtpFromName || "SMTP Test Gönderici",
    };

    const subject = "SMTP Bağlantı Testi Başarılı! ⚙️";
    const html = `
      <div style="background-color: #07070a; color: #ffffff; font-family: sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1f1f2e;">
        <h2 style="color: #22c55e; margin-top: 0; font-size: 20px; text-transform: uppercase;">SMTP BAĞLANTI TESTİ BAŞARILI! 🎉</h2>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          Harika haber! Siteniz için girdiğiniz SMTP ayarları sorunsuz bir şekilde bağlandı ve bu test e-postasını başarıyla gönderdi.
        </p>
        <div style="background-color: #0d0e15; padding: 20px; border-radius: 8px; border: 1px solid #1f1f2e; margin: 20px 0; font-family: monospace; font-size: 12px; color: #cbd5e1;">
          <p style="margin: 4px 0;"><strong>Sunucu:</strong> ${smtpHost}:${smtpPort}</p>
          <p style="margin: 4px 0;"><strong>Kullanıcı:</strong> ${smtpUser}</p>
          <p style="margin: 4px 0;"><strong>Gönderen Adresi:</strong> ${smtpFrom}</p>
          <p style="margin: 4px 0;"><strong>Zaman Damgası:</strong> ${new Date().toLocaleString("tr-TR")}</p>
        </div>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          Artık bülteninize yeni kaydolan ziyaretçiler otomatik olarak hoş geldiniz e-postası alacaklar!
        </p>
        <p style="color: #52525b; font-size: 11px; border-top: 1px solid #1f1f2e; padding-top: 15px; margin-top: 25px; text-align: center;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.
        </p>
      </div>
    `;

    const result = await sendMailHelper(testSettings, testEmail, subject, html);
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: `SMTP gönderme hatası: ${result.reason}` });
    }
  } catch (err: any) {
    console.error("Test SMTP error:", err);
    res.status(500).json({ error: err.message || "Test e-postası gönderilirken sunucu hatası oluştu." });
  }
});

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

// Helper to upload a file to Firebase Storage (highly reliable, permanent, unblocked in Turkey)
async function uploadToFirebaseStorage(filePath: string, originalName: string, mimeType: string): Promise<string> {
  if (!storageBucketName) {
    throw new Error("Firebase Storage bucket name is not configured.");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const uniqueId = Date.now() + "_" + Math.round(Math.random() * 1e6);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
  const storagePath = `uploads/${uniqueId}_${cleanName}`;

  console.log(`[GCS Storage] Attempting direct GCS upload of ${originalName} to ${storagePath} in bucket ${storageBucketName}...`);

  try {
    const gcs = new GCSStorage();
    const bucket = gcs.bucket(storageBucketName);
    const blob = bucket.file(storagePath);
    
    await blob.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Generate standard public Firebase Storage download URL
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
    console.log(`[GCS Storage] Upload successful! Permanent URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (gcsErr) {
    console.error("[GCS Storage] Direct GCS upload failed, falling back to Web SDK upload:", gcsErr);
    
    // Fallback to Web SDK upload (requires auth/rules)
    if (!storageBucket) {
      throw new Error("Firebase Storage is not initialized.");
    }

    await ensureAuthenticated();
    const fileRef = fbStorageRef(storageBucket, storagePath);
    
    await uploadBytes(fileRef, fileBuffer, {
      contentType: mimeType,
    });

    const downloadUrl = await getDownloadURL(fileRef);
    console.log(`[Firebase Storage Web SDK] Upload success! Permanent URL: ${downloadUrl}`);
    return downloadUrl;
  }
}

// Helper to upload a file to Pixeldrain (free, high-speed CDN, unblocked in Turkey, supports streaming/Range headers)
async function uploadToPixeldrain(filePath: string, originalName: string, mimeType: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new (globalThis as any).FormData();
  formData.append("file", blob, originalName);

  console.log(`[Pixeldrain] Uploading ${originalName} (${mimeType}, size: ${fileBuffer.length} bytes)...`);
  const response = await fetch("https://pixeldrain.com/api/file", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pixeldrain HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.id) {
    throw new Error(`Pixeldrain upload failed: ${JSON.stringify(data)}`);
  }

  const directUrl = `https://pixeldrain.com/api/file/${data.id}`;
  console.log(`[Pixeldrain] Upload success! Permanent URL: ${directUrl}`);
  return directUrl;
}

// Helper to upload a file to Catbox (free, permanent, high-speed CDN with streaming / partial content support)
async function uploadToCatbox(filePath: string, originalName: string, mimeType: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new (globalThis as any).FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", blob, originalName);

  console.log(`[Catbox] Uploading ${originalName} (${mimeType}, size: ${fileBuffer.length} bytes)...`);
  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Catbox HTTP error! Status: ${response.status}`);
  }

  const resultUrl = await response.text();
  if (!resultUrl || !resultUrl.startsWith("http")) {
    throw new Error(`Invalid Catbox response: ${resultUrl}`);
  }

  console.log(`[Catbox] Upload success! Permanent URL: ${resultUrl}`);
  return resultUrl.trim();
}

// File upload API endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Dosya gönderilmedi veya yüklenirken bir hata oluştu." });
    }
    
    const localUrl = `/uploads/${req.file.filename}`;
    
    // 1. Try Firebase Storage first (highly reliable, permanent, 100% unblocked in Turkey)
    if (storageBucketName) {
      try {
        const firebaseUrl = await uploadToFirebaseStorage(req.file.path, req.file.originalname, req.file.mimetype);
        
        // Clean up the local file after successful upload to save disk space
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.warn("Could not delete local temp upload file:", unlinkErr);
        }
        
        return res.json({ success: true, url: firebaseUrl });
      } catch (fbErr: any) {
        console.error("Firebase Storage upload failed, trying next fallback:", fbErr);
      }
    }

    // 2. Try Pixeldrain as the highly durable, permanent second option (unblocked in Turkey, supports fast streaming/range headers)
    try {
      const pixeldrainUrl = await uploadToPixeldrain(req.file.path, req.file.originalname, req.file.mimetype);
      
      // Clean up local temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {}

      return res.json({ success: true, url: pixeldrainUrl });
    } catch (pdErr) {
      console.error("Pixeldrain upload failed, trying next fallback:", pdErr);
    }

    // 3. Try Catbox as a third option
    try {
      const catboxUrl = await uploadToCatbox(req.file.path, req.file.originalname, req.file.mimetype);
      
      // Clean up local temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {}

      return res.json({ success: true, url: catboxUrl });
    } catch (cbErr) {
      console.error("Catbox upload failed, falling back to local storage:", cbErr);
    }

    // 4. Fallback to local server static storage (fully functional, extremely fast, completely unblocked)
    console.log("Using local storage fallback for upload:", localUrl);
    return res.json({ success: true, url: localUrl });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    res.status(500).json({ error: err.message || "Dosya sunucuya yazılırken hata oluştu." });
  }
});

// Permanent image upload API (stores in Firestore 'images' collection to bypass Cloud Run stateless disk limits)
app.post("/api/upload-image", async (req, res) => {
  try {
    const { base64, contentType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Görsel verisi eksik." });
    }

    const imageId = "img_" + Date.now() + "_" + Math.round(Math.random() * 1e6);

    if (db) {
      const docRef = doc(db, "images", imageId);
      await setDoc(docRef, {
        base64,
        contentType: contentType || "image/jpeg",
        createdAt: new Date().toISOString()
      });
      console.log(`Saved image to Firestore images collection: ${imageId}`);
    } else {
      // Local fallback for offline mode
      const localPath = path.join(uploadsDir, `${imageId}.jpg`);
      fs.writeFileSync(localPath, Buffer.from(base64, "base64"));
      console.log(`Saved image to local fallback: ${imageId}`);
    }

    res.json({ success: true, url: `/api/image/${imageId}` });
  } catch (err: any) {
    console.error("Upload image API error:", err);
    res.status(500).json({ error: err.message || "Görsel kaydedilirken sunucu hatası oluştu." });
  }
});

// Permanent image retrieval API
app.get("/api/image/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (db) {
      const docRef = doc(db, "images", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const buffer = Buffer.from(data.base64, "base64");
        res.setHeader("Content-Type", data.contentType || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
        return res.send(buffer);
      }
    }

    // Local fallback
    const localPath = path.join(uploadsDir, `${id}.jpg`);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      return res.send(buffer);
    }

    res.status(404).send("Görsel bulunamadı.");
  } catch (err: any) {
    console.error("Get image API error:", err);
    res.status(500).send("Görsel yüklenirken hata oluştu.");
  }
});

// Custom error handler for Express (handles multer and other parsing errors)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Dosya yükleme hatası: ${err.message}` });
  }
  res.status(500).json({ error: err.message || "Sunucuda beklenmedik bir hata oluştu." });
});

// Background task to migrate any existing catbox.moe or tmpfiles.org URLs to Firebase Storage or local storage
async function migrateCatboxUrls() {
  try {
    console.log("[Migration] Starting background Catbox/tmpfiles URL migration check...");
    const content = await readData();
    let updated = false;

    if (!content || !content.categories) {
      console.log("[Migration] No categories found in content.");
      return;
    }

    for (const category of content.categories) {
      if (!category.items) continue;
      for (const item of category.items) {
        const keysToMigrate = ["previewBefore", "previewAfter", "previewVideo"] as const;
        for (const key of keysToMigrate) {
          const url = item[key];
          if (url && (url.includes("catbox.moe") || url.includes("tmpfiles.org"))) {
            console.log(`[Migration] Found blocked/temporary URL in item '${item.name}' (${key}): ${url}`);
            
            try {
              let fileBuffer: Buffer;
              let originalName = "";
              let contentType = "application/octet-stream";

              if (url.includes("tmpfiles.org")) {
                console.log(`[Migration] Handling tmpfiles.org URL specially to avoid landing page HTML...`);
                let normalizedLandingUrl = url;
                if (url.includes("/dl/")) {
                  normalizedLandingUrl = url.replace("/dl/", "/");
                }
                
                const parsedUrl = new URL(normalizedLandingUrl);
                const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
                originalName = pathParts[pathParts.length - 1] || "migrated_file";

                console.log(`[Migration] Fetching tmpfiles landing page: ${normalizedLandingUrl}`);
                const landingRes = await fetch(normalizedLandingUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                  }
                });

                if (!landingRes.ok) {
                  throw new Error(`Failed to fetch landing page. Status: ${landingRes.status}`);
                }

                const landingHtml = await landingRes.text();
                const cookies = landingRes.headers.get("set-cookie");

                const freshMatch = landingHtml.match(/class="download"\s+href="([^"]+)"/) || landingHtml.match(/id="img_preview"\s+src="([^"]+)"/);
                if (!freshMatch) {
                  throw new Error("Could not find direct download link in fresh landing page HTML");
                }

                const freshDlUrl = freshMatch[1];
                console.log(`[Migration] Found fresh download URL: ${freshDlUrl}`);

                console.log(`[Migration] Fetching direct binary...`);
                const downloadRes = await fetch(freshDlUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Cookie": cookies || ""
                  }
                });

                if (!downloadRes.ok) {
                  throw new Error(`Failed to download binary from ${freshDlUrl}. Status: ${downloadRes.status}`);
                }

                const buffer = await downloadRes.arrayBuffer();
                fileBuffer = Buffer.from(buffer);
                contentType = downloadRes.headers.get("content-type") || "application/octet-stream";

                if (fileBuffer.toString("utf8", 0, 100).includes("<!DOCTYPE") || fileBuffer.toString("utf8", 0, 100).includes("<html")) {
                  throw new Error("Downloaded file is still HTML");
                }
              } else {
                const response = await fetch(url);
                if (!response.ok) {
                  console.error(`[Migration] Failed to download file from ${url}: Status ${response.status}`);
                  continue;
                }
                const buffer = await response.arrayBuffer();
                fileBuffer = Buffer.from(buffer);

                const parsedUrl = new URL(url);
                originalName = path.basename(parsedUrl.pathname) || "migrated_file";
                contentType = response.headers.get("content-type") || "application/octet-stream";
              }

              const ext = path.extname(originalName) || ".bin";

              // 3. Save locally in uploads first as a fallback
              const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
              const localFilename = `migrated-${uniqueSuffix}${ext}`;
              const localFilePath = path.join(uploadsDir, localFilename);
              fs.writeFileSync(localFilePath, fileBuffer);
              const localUrl = `/uploads/${localFilename}`;

              let finalUrl = localUrl;

              // 4. Try uploading to Firebase Storage if available
              let uploadedToCloud = false;
              if (storageBucketName) {
                try {
                  finalUrl = await uploadToFirebaseStorage(localFilePath, originalName, contentType);
                  console.log(`[Migration] Successfully uploaded to Firebase Storage: ${finalUrl}`);
                  uploadedToCloud = true;
                  // delete local temp file if uploaded to Firebase
                  try {
                    fs.unlinkSync(localFilePath);
                  } catch (e) {}
                } catch (fbErr) {
                  console.error("[Migration] Failed to upload to Firebase Storage, trying Pixeldrain fallback:", fbErr);
                }
              }

              // Try Pixeldrain as secondary cloud fallback
              if (!uploadedToCloud) {
                try {
                  finalUrl = await uploadToPixeldrain(localFilePath, originalName, contentType);
                  console.log(`[Migration] Successfully uploaded to Pixeldrain: ${finalUrl}`);
                  uploadedToCloud = true;
                  // delete local temp file if uploaded
                  try {
                    fs.unlinkSync(localFilePath);
                  } catch (e) {}
                } catch (pdErr) {
                  console.error("[Migration] Failed to upload to Pixeldrain, using local fallback:", pdErr);
                }
              }

              // 5. Update item
              item[key] = finalUrl;
              updated = true;
              console.log(`[Migration] Migrated '${item.name}' (${key}) -> ${finalUrl}`);

            } catch (migrateErr) {
              console.error(`[Migration] Error migrating URL ${url}:`, migrateErr);
            }
          }
        }
      }
    }

    if (updated) {
      console.log("[Migration] Catbox/tmpfiles migration completed successfully. Writing back updated content...");
      await writeData(content);
    } else {
      console.log("[Migration] No Catbox/tmpfiles URLs found to migrate. Everything is clean.");
    }
  } catch (err) {
    console.error("[Migration] Error running migration task:", err);
  }
}

// Vite middleware and static serving setup
async function startServer() {
  // Run URL migration task in the background on startup
  migrateCatboxUrls().catch(err => {
    console.error("[Migration] Startup migration failed:", err);
  });

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
