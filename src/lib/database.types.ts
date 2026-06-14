export type UserRole = "admin" | "manager";
export type InfluencerStatus = "actif" | "inactif" | "en_attente";
export type Platform = "instagram" | "tiktok" | "youtube";
export type CollabType = "agence" | "direct";
export type ApporteurType = "createur" | "agent" | "agence";
export type CollabStatus = "en_cours" | "terminee" | "annulee";
export type EventType = "publication" | "campagne" | "deadline" | "reunion";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Influencer = {
  id: string;
  name: string;
  slug: string;
  profile_picture_url: string | null;
  bio: string | null;
  status: InfluencerStatus;
  tags: string[];
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  instagram_followers: number;
  tiktok_followers: number;
  youtube_subscribers: number;
  instagram_engagement_rate: number;
  tiktok_engagement_rate: number;
  youtube_avg_views: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StatsSnapshot = {
  id: string;
  influencer_id: string;
  platform: Platform;
  followers: number;
  engagement_rate: number;
  posts_count: number;
  avg_views: number;
  snapshot_date: string;
  created_at: string;
};

export type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  sector: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  secondary_contact_name: string | null;
  secondary_contact_email: string | null;
  secondary_contact_phone: string | null;
  notes: string | null;
  // Données légales (récupérées via recherche-entreprises.api.gouv.fr)
  siren: string | null;
  siret: string | null;
  legal_form: string | null;
  naf_code: string | null;
  naf_label: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

// Résultat de recherche d'entreprise (API gouv.fr)
export type CompanySearchResult = {
  siren: string;
  siret: string;
  name: string;
  legal_form: string | null;
  naf_code: string | null;
  naf_label: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  active: boolean;
  date_creation: string | null;
};

export type Collaboration = {
  id: string;
  brand_id: string | null;
  influencer_id: string | null;
  title: string;
  year: number;
  month: number;
  type: CollabType;
  apporteur: ApporteurType;
  budget_ht: number;
  commission_rate: number;
  commission_ht: number;
  remuneration_createur_ht: number;
  status: CollabStatus;
  step_devis_contrat_envoye: boolean;
  step_contrat_signe: boolean;
  step_devis_signe: boolean;
  step_en_production: boolean;
  step_publie: boolean;
  step_facture_envoyee: boolean;
  step_stats_envoyees: boolean;
  step_drive_ok: boolean;
  brief: string | null;
  deliverables: string | null;
  publication_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  influencer_id: string | null;
  collaboration_id: string | null;
  brand_id: string | null;
  start_date: string;
  end_date: string | null;
  color: string;
  notes: string | null;
  created_at: string;
};

// ===== Campagnes — Posts (saisis manuellement par l'équipe) =====
export type PostPlatform =
  | "instagram"
  | "instagram_story"
  | "instagram_reel"
  | "tiktok"
  | "youtube"
  | "youtube_shorts"
  | "snapchat"
  | "twitch"
  | "linkedin";

export type CampaignPost = {
  id: string;
  influencer_id: string;
  brand_id: string | null;
  platform: PostPlatform;
  post_url: string | null;
  posted_at: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ===== Facturation =====
export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuer_name: string;
  issuer_legal_name: string;
  issuer_address: string;
  issuer_siret: string;
  issuer_vat: string;
  issuer_email: string;
  issuer_iban: string | null;
  issuer_bic: string | null;
  brand_id: string | null;
  recipient_name: string;
  recipient_legal_name: string | null;
  recipient_address: string | null;
  recipient_siret: string | null;
  recipient_vat: string | null;
  recipient_email: string | null;
  issue_date: string;
  due_date: string | null;
  vat_rate: number;
  total_ht: number;
  subject: string | null;
  description: string | null;
  notes: string | null;
  payment_terms: string | null;
  created_by: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  sort_order: number;
  created_at: string;
};

// ===== Tableaux Partenaires (reporting client par campagne) =====
export type PartnerDashboardStatus = "draft" | "active" | "archived";

export type PartnerDashboard = {
  id: string;
  slug: string;
  name: string;
  partner_name: string;
  partner_logo_url: string | null;
  partner_color: string;
  agency_name: string;
  agency_logo_url: string | null;
  brand_id: string | null;
  status: PartnerDashboardStatus;
  period_start: string | null;
  period_end: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerDashboardPost = {
  id: string;
  partner_dashboard_id: string;
  influencer_id: string | null;
  platform: PostPlatform;
  post_url: string | null;
  posted_at: string;
  title: string | null;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
