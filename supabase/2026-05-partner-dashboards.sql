-- =====================================================================
-- MOOD AGENCY CRM — Tableaux partenaires (reporting client par campagne)
-- À exécuter dans Supabase SQL Editor (projet mood-agency-crm)
-- =====================================================================
-- Un "partner_dashboard" = une campagne au sens reporting client.
-- Ex : "Bunq × Genki — Q1 2026" → on saisit 4-5 vidéos, on partage l'URL
-- à la marque qui voit un dashboard pixel-perfect.
-- =====================================================================

create table if not exists public.partner_dashboards (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,                       -- "Bunq × Genki — Q1 2026"
  partner_name text not null,               -- "bunq"  (affiché en titre)
  partner_logo_url text,
  partner_color text default '#7C3AED',     -- accent du dashboard
  agency_name text default 'Mood Agency',
  agency_logo_url text,
  brand_id uuid references public.brands(id) on delete set null,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  period_start date,
  period_end date,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_dashboards_slug on public.partner_dashboards(slug);
create index if not exists idx_partner_dashboards_brand on public.partner_dashboards(brand_id);

drop trigger if exists trg_partner_dashboards_updated on public.partner_dashboards;
create trigger trg_partner_dashboards_updated before update on public.partner_dashboards
  for each row execute function public.touch_updated_at();

alter table public.partner_dashboards enable row level security;
drop policy if exists "auth all partner_dashboards" on public.partner_dashboards;
create policy "auth all partner_dashboards" on public.partner_dashboards for all
  to authenticated using (true) with check (true);

-- =====================================================================
-- Posts saisis par campagne (indépendant de campaign_posts)
-- =====================================================================
create table if not exists public.partner_dashboard_posts (
  id uuid primary key default gen_random_uuid(),
  partner_dashboard_id uuid not null references public.partner_dashboards(id) on delete cascade,
  influencer_id uuid references public.influencers(id) on delete set null,
  platform text not null check (platform in (
    'instagram', 'instagram_story', 'instagram_reel',
    'tiktok',
    'youtube', 'youtube_shorts',
    'snapchat',
    'twitch',
    'linkedin'
  )),
  post_url text,
  posted_at date not null default current_date,
  title text,
  thumbnail_url text,
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  saves int default 0,
  reach int default 0,
  impressions int default 0,
  engagement_rate numeric(5,2) default 0,
  notes text,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdp_dashboard on public.partner_dashboard_posts(partner_dashboard_id, sort_order);

drop trigger if exists trg_pdp_updated on public.partner_dashboard_posts;
create trigger trg_pdp_updated before update on public.partner_dashboard_posts
  for each row execute function public.touch_updated_at();

alter table public.partner_dashboard_posts enable row level security;
drop policy if exists "auth all pdp" on public.partner_dashboard_posts;
create policy "auth all pdp" on public.partner_dashboard_posts for all
  to authenticated using (true) with check (true);
