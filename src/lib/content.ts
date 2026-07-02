import raw from "@/content/experience.json";

export type TextAnimation = "fade" | "slide" | "scale" | "stagger" | "dissolve";

export interface AmazonInfo {
  price: string;
  mrp?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
}

export interface Product {
  id: string;
  name: string;
  shortName: string;
  /** Key into the procedural model registry (src/components/models.tsx). */
  model: string;
  tagline: string;
  description: string;
  specs: string[];
  notes?: string;
  video?: string | null;
  highlighted?: boolean;
  amazon?: AmazonInfo;
  scale?: number;
  /** Real product photos (public paths); first entry is the hero shot. */
  images?: string[];
  /** Official product page on mi.com. */
  link?: string;
}

export interface Zone {
  id: string;
  chapter: string;
  name: string;
  tagline: string;
  description: string;
  talkingPoints: string[];
  accent: string;
  effect: string;
  environment: string;
  textAnimation?: TextAnimation;
  products: Product[];
}

export interface ExperienceContent {
  event: {
    title: string;
    subtitle: string;
    ledWallText: string;
    welcome: string[];
    entryHint: string;
    textAnimation?: TextAnimation;
  };
  zones: Zone[];
  finale: {
    chapter: string;
    title: string;
    tagline: string;
    description: string;
    textAnimation?: TextAnimation;
  };
  amazon: {
    enabled: boolean;
    chapter: string;
    title: string;
    subtitle: string;
    journey: string[];
    note: string;
    textAnimation?: TextAnimation;
  };
}

export const content = raw as unknown as ExperienceContent;

export interface FlatProduct extends Product {
  zoneIndex: number;
  zoneId: string;
  productIndex: number;
  accent: string;
}

export const allProducts: FlatProduct[] = content.zones.flatMap((zone, zi) =>
  zone.products.map((p, pi) => ({
    ...p,
    zoneIndex: zi,
    zoneId: zone.id,
    productIndex: pi,
    accent: zone.accent,
  }))
);

/** Products that fly into the Amazon India transition (configurable in experience.json). */
export const amazonProducts: FlatProduct[] = allProducts.filter(
  (p) => p.highlighted && p.amazon
);
