export interface StatItem {
  value: string;
  label: string;
}

export interface SocialLinks {
  youtube: string;
  instagram: string;
  discord: string;
  tiktok: string;
}

export interface SiteSettings {
  heroTitle: string;
  heroBadge: string;
  heroSub: string;
  pluginTitle: string;
  pluginDesc: string;
  pluginUrl: string;
  bioTitle: string;
  bioSub: string;
  bioImage: string;
  stats: StatItem[];
  portfolioUrl: string;
  socialLinks: SocialLinks;
  socialHandles?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
    tiktok?: string;
  };
  adminPassword?: string;
  topBarText?: string;
  loadingText?: string;
  bioName?: string;
  bioRole?: string;
  bioDescription?: string;
  logoImage?: string;
  maintenanceMode?: boolean;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpFromName?: string;
  notifyOnNewSubscriber?: boolean;
  showNewsletter?: boolean;
}

export interface EditPackItem {
  id: string;
  name: string;
  size: string;
  downloadUrl: string;
  description: string;
  previewBefore?: string;
  previewAfter?: string;
  previewVideo?: string;
  status?: "none" | "new" | "updated";
}

export interface Category {
  id: string;
  index: string;
  title: string;
  badge: string;
  description: string;
  gradient: string;
  items: EditPackItem[];
  icon?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger" | "announcement";
  active: boolean;
  createdAt: string;
  linkText?: string;
  linkUrl?: string;
  pinned?: boolean;
  expiryDate?: string;
  publishAt?: string;
  likes?: number;
  imageUrl?: string;
  customIcon?: string;
}

export interface SuggestionRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  status: "pending" | "approved" | "completed" | "rejected";
  votes: number;
  referenceUrl?: string;
  feedbackType?: "Öneri" | "Şikâyet";
  userName?: string;
  contactInfo?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  active: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface SiteContent {
  visitorCount: number;
  settings: SiteSettings;
  categories: Category[];
  announcements?: Announcement[];
  requests?: SuggestionRequest[];
  faqs?: FAQItem[];
  subscribers?: NewsletterSubscriber[];
}
