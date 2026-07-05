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
  /** Pods layout: how this unit is displayed. */
  mount?: "wall" | "floor";
  /** Pods layout: pod/station name. */
  pod?: string;
  /** Pods layout: pod theme line. */
  podTheme?: string;
  /** Pods layout: primary feature chips. */
  podFeatures?: string[];
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
  /** "pods" renders the zone as separate experience pods (Climate). */
  layout?: string;
  textAnimation?: TextAnimation;
  products: Product[];
}

export interface SnapshotItem {
  icon: string;
  label: string;
  value: string;
}

export interface Milestone {
  id: string;
  month: string;
  dateLabel: string;
  title: string;
  focus: string;
  environment: string;
  accent: string;
  /** icon key drawn as an inline SVG in the overlay */
  icon: string;
  headline: string;
  body: string;
  bullets: string[];
  /** ids into allProducts shown in this milestone's bay */
  products: string[];
  /** Hero milestone only: the "enter the existing experience" action. */
  experienceB?: { label: string; action: "replay" };
}

export interface TimelineContent {
  enabled: boolean;
  chapter: string;
  intro: { kicker: string; heading: string; subheading: string };
  milestones: Milestone[];
  closing: { title: string; message: string };
}

export interface ExperienceContent {
  event: {
    title: string;
    subtitle: string;
    ledWallText: string;
    entryHint: string;
    textAnimation?: TextAnimation;
    intro: {
      kicker: string;
      heading: string;
      subheading: string;
      body: string[];
      snapshot: {
        title: string;
        items: SnapshotItem[];
      };
    };
  };
  zones: Zone[];
  finale: {
    chapter: string;
    title: string;
    tagline: string;
    description: string;
    closingTitle?: string;
    closing?: string;
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
  timeline?: TimelineContent;
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

export const timeline: TimelineContent | undefined = content.timeline;
