-- =====================================================================
-- MOOD AGENCY CRM — Campagnes (posts par créateur) + Facturation
-- À exécuter dans Supabase SQL Editor (projet mood-agency-crm)
-- =====================================================================

-- =====================================================================
-- A) CAMPAIGN POSTS
-- Stocke chaque publication d'un créateur (manuel — l'équipe saisit les stats)
-- =====================================================================

-- create type ne supporte pas "if not exists" → on encapsule dans un DO
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('draft', 'sent', 'paid', 'cancelled');
  end if;
end $$;

create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_influencer on public.campaign_posts(influencer_id, posted_at desc);
create index if not exists idx_posts_platform on public.campaign_posts(platform);
create index if not exists idx_posts_brand on public.campaign_posts(brand_id);

create trigger trg_posts_updated before update on public.campaign_posts
  for each row execute function public.touch_updated_at();

-- RLS : auth uniquement (la lecture publique passe par /c/[slug] côté serveur avec service_role)
alter table public.campaign_posts enable row level security;
create policy "auth all posts" on public.campaign_posts for all
  to authenticated using (true) with check (true);

-- =====================================================================
-- B) INVOICES + INVOICE_ITEMS
-- =====================================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  status invoice_status not null default 'draft',

  -- Émetteur (par défaut Mood Agency / Kainova Group — modifiable au cas par cas)
  issuer_name text not null default 'Mood Agency',
  issuer_legal_name text not null default 'KAINOVA GROUP',
  issuer_address text not null default '60 rue François 1er, 75008 Paris',
  issuer_siret text not null default '93477638600013',
  issuer_vat text not null default 'FR00934776386',
  issuer_email text not null default 'contact@mood-production.com',
  issuer_iban text,
  issuer_bic text,

  -- Destinataire — lié optionnellement à une marque ou saisi à la main
  brand_id uuid references public.brands(id) on delete set null,
  recipient_name text not null,
  recipient_legal_name text,
  recipient_address text,
  recipient_siret text,
  recipient_vat text,
  recipient_email text,

  issue_date date not null default current_date,
  due_date date,

  vat_rate numeric(5,2) not null default 20.00,
  total_ht numeric(10,2) not null default 0,

  -- Description globale (résumé de la prestation)
  subject text,
  description text,
  notes text,
  payment_terms text default 'Paiement à 30 jours par virement bancaire.',

  created_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_brand on public.invoices(brand_id);
create index if not exists idx_invoices_created_by on public.invoices(created_by);

create trigger trg_invoices_updated before update on public.invoices
  for each row execute function public.touch_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_ht numeric(10,2) not null default 0,
  total_ht numeric(10,2) generated always as (quantity * unit_price_ht) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_invoice on public.invoice_items(invoice_id, sort_order);

-- RLS factures : auth uniquement
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
create policy "auth all invoices" on public.invoices for all
  to authenticated using (true) with check (true);
create policy "auth all invoice_items" on public.invoice_items for all
  to authenticated using (true) with check (true);

-- =====================================================================
-- C) OPTIONNEL : bascule Zakaria en manager
-- =====================================================================
-- Décommenter et exécuter une seule fois :
--
-- update public.profiles
-- set role = 'manager'
-- where full_name ilike '%zakaria%';
