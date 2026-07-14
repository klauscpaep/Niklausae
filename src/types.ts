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
}

export interface SiteContent {
  visitorCount: number;
  settings: SiteSettings;
  categories: Category[];
}
