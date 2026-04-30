-- =====================================================================
-- MOOD AGENCY CRM — Schema SQL
-- À exécuter dans Supabase : SQL Editor → New query → coller → Run
-- =====================================================================

-- ===== ENUMS =====
create type user_role as enum ('admin', 'manager');
create type influencer_status as enum ('actif', 'inactif', 'en_attente');
create type platform as enum ('instagram', 'tiktok', 'youtube');
create type collab_type as enum ('agence', 'direct');
create type apporteur_type as enum ('createur', 'agent', 'agence');
create type collab_status as enum ('en_cours', 'terminee', 'annulee');
create type event_type as enum ('publication', 'campagne', 'deadline', 'reunion');

-- ===== PROFILES (lié à auth.users) =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'manager',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger pour créer un profil auto à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'manager'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== INFLUENCERS =====
create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  profile_picture_url text,
  bio text,
  status influencer_status not null default 'actif',
  tags text[] default '{}',
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  instagram_followers int default 0,
  tiktok_followers int default 0,
  youtube_subscribers int default 0,
  instagram_engagement_rate numeric(5,2) default 0,
  tiktok_engagement_rate numeric(5,2) default 0,
  youtube_avg_views int default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== STATS SNAPSHOTS (historique) =====
create table public.influencer_stats_snapshots (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  platform platform not null,
  followers int not null default 0,
  engagement_rate numeric(5,2) default 0,
  posts_count int default 0,
  avg_views int default 0,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_snapshots_influencer on public.influencer_stats_snapshots(influencer_id, snapshot_date desc);

-- ===== BRANDS (CRM marques) =====
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sector text,
  website text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  secondary_contact_name text,
  secondary_contact_email text,
  secondary_contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== COLLABORATIONS =====
create table public.collaborations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  influencer_id uuid references public.influencers(id) on delete set null,
  title text not null,
  year int not null,
  month int not null check (month between 1 and 12),
  type collab_type not null default 'agence',
  apporteur apporteur_type not null default 'agence',
  budget_ht numeric(10,2) default 0,
  commission_rate numeric(5,4) default 0.15,
  commission_ht numeric(10,2) generated always as (budget_ht * commission_rate) stored,
  remuneration_createur_ht numeric(10,2) generated always as (budget_ht - (budget_ht * commission_rate)) stored,
  status collab_status not null default 'en_cours',
  step_devis_contrat_envoye boolean not null default false,
  step_contrat_signe boolean not null default false,
  step_devis_signe boolean not null default false,
  step_en_production boolean not null default false,
  step_publie boolean not null default false,
  step_facture_envoyee boolean not null default false,
  step_stats_envoyees boolean not null default false,
  step_drive_ok boolean not null default false,
  brief text,
  deliverables text,
  publication_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_collabs_year_month on public.collaborations(year desc, month desc);
create index idx_collabs_brand on public.collaborations(brand_id);
create index idx_collabs_influencer on public.collaborations(influencer_id);

-- ===== CALENDAR EVENTS =====
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type event_type not null default 'publication',
  influencer_id uuid references public.influencers(id) on delete set null,
  collaboration_id uuid references public.collaborations(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz,
  color text default '#7C3AED',
  notes text,
  created_at timestamptz not null default now()
);

create index idx_events_start on public.calendar_events(start_date);

-- =====================================================================
-- TRIGGERS updated_at
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_influencers_updated before update on public.influencers
  for each row execute function public.touch_updated_at();
create trigger trg_brands_updated before update on public.brands
  for each row execute function public.touch_updated_at();
create trigger trg_collabs_updated before update on public.collaborations
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- Tous les utilisateurs authentifiés ont accès à toute la donnée.
-- Le filtrage admin/manager (montants masqués) se fait côté app.
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.influencers enable row level security;
alter table public.influencer_stats_snapshots enable row level security;
alter table public.brands enable row level security;
alter table public.collaborations enable row level security;
alter table public.calendar_events enable row level security;

-- Profiles : chacun voit son profil et ceux des autres (équipe)
create policy "auth read profiles" on public.profiles for select
  to authenticated using (true);
create policy "auth update own profile" on public.profiles for update
  to authenticated using (auth.uid() = id);

-- Helper : check si user est admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Admin peut update n'importe quel profile (pour changer les rôles)
create policy "admin manage profiles" on public.profiles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Toutes les autres tables : lecture & écriture pour tout user authentifié
create policy "auth all influencers" on public.influencers for all
  to authenticated using (true) with check (true);

create policy "auth all snapshots" on public.influencer_stats_snapshots for all
  to authenticated using (true) with check (true);

create policy "auth all brands" on public.brands for all
  to authenticated using (true) with check (true);

create policy "auth all collabs" on public.collaborations for all
  to authenticated using (true) with check (true);

create policy "auth all events" on public.calendar_events for all
  to authenticated using (true) with check (true);

-- =====================================================================
-- SEED DATA — quelques exemples pour démarrer
-- =====================================================================
insert into public.brands (name, sector, website, primary_contact_name, primary_contact_email, primary_contact_phone) values
  ('Saily', 'Tech / Mobile', 'https://saily.com', 'Marketing Manager', 'contact@saily.com', '+33 1 23 45 67 89'),
  ('Puma', 'Mode / Sport', 'https://puma.com', 'Influence Lead', 'influence@puma.com', '+33 1 98 76 54 32'),
  ('EasyJet', 'Voyage', 'https://easyjet.com', 'Brand Partnerships', 'brands@easyjet.com', '+33 1 11 22 33 44'),
  ('Airalo', 'Tech / Voyage', 'https://airalo.com', 'Influencer Marketing', 'partnerships@airalo.com', null),
  ('Salon Street Food', 'Évènementiel / Food', null, 'Direction', 'contact@salonstreetfood.fr', '+33 1 55 66 77 88');

insert into public.influencers (name, slug, bio, status, tags, instagram_handle, tiktok_handle, youtube_handle, instagram_followers, tiktok_followers, youtube_subscribers, instagram_engagement_rate, tiktok_engagement_rate, youtube_avg_views) values
  ('YOVA2N', 'yova2n', 'Entrepreneur, créateur de contenu — Mood Agency / Kainova', 'actif', ARRAY['entrepreneuriat','lifestyle','business'], 'yova2n', 'yova2n', 'YOVA2N', 45000, 82000, 12000, 4.8, 6.2, 8500),
  ('Demo Créatrice Lifestyle', 'demo-lifestyle', 'Créatrice lifestyle / mode', 'actif', ARRAY['lifestyle','mode'], 'demo_lifestyle', 'demo_lifestyle', null, 120000, 250000, 0, 5.4, 7.1, 0),
  ('Demo Créateur Food', 'demo-food', 'Foodie parisien', 'actif', ARRAY['food','paris'], 'demo_food', null, 'DemoFood', 75000, 0, 28000, 6.2, 0, 15000);

-- Snapshots initiaux
insert into public.influencer_stats_snapshots (influencer_id, platform, followers, engagement_rate, posts_count, avg_views, snapshot_date)
select id, 'instagram', instagram_followers, instagram_engagement_rate, 12, 0, current_date - 7
from public.influencers where instagram_handle is not null;

insert into public.influencer_stats_snapshots (influencer_id, platform, followers, engagement_rate, posts_count, avg_views, snapshot_date)
select id, 'instagram', instagram_followers + 500, instagram_engagement_rate + 0.2, 14, 0, current_date
from public.influencers where instagram_handle is not null;

-- Collaborations exemples
insert into public.collaborations (brand_id, influencer_id, title, year, month, type, apporteur, budget_ht, commission_rate, status, step_devis_contrat_envoye, step_contrat_signe, step_devis_signe, step_en_production, step_publie, step_facture_envoyee)
select
  (select id from public.brands where name = 'Saily'),
  (select id from public.influencers where slug = 'yova2n'),
  'Campagne Saily x YOVA2N — eSIM voyage',
  2026, 3, 'agence', 'agent', 4500, 0.30, 'terminee',
  true, true, true, true, true, true;

insert into public.collaborations (brand_id, influencer_id, title, year, month, type, apporteur, budget_ht, commission_rate, status, step_devis_contrat_envoye, step_contrat_signe)
select
  (select id from public.brands where name = 'Puma'),
  (select id from public.influencers where slug = 'demo-lifestyle'),
  'Drop printemps Puma',
  2026, 3, 'agence', 'agent', 6000, 0.30, 'en_cours',
  true, true;

insert into public.collaborations (brand_id, influencer_id, title, year, month, type, apporteur, budget_ht, commission_rate, status, step_devis_contrat_envoye)
select
  (select id from public.brands where name = 'Salon Street Food'),
  (select id from public.influencers where slug = 'demo-food'),
  'Couverture Salon Street Food 2026',
  2026, 4, 'agence', 'createur', 1800, 0.15, 'en_cours',
  true;
