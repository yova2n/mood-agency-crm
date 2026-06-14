-- =====================================================================
-- MOOD AGENCY CRM — Tableaux partenaires : créateur engagé + liens utiles
-- =====================================================================

alter table public.partner_dashboards
  add column if not exists influencer_id uuid references public.influencers(id) on delete set null,
  add column if not exists links text;

create index if not exists idx_partner_dashboards_influencer
  on public.partner_dashboards(influencer_id);
