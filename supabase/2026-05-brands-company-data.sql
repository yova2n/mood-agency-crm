-- =====================================================================
-- MOOD AGENCY CRM — Ajout des données légales d'entreprise sur "brands"
-- À exécuter dans Supabase : SQL Editor → New query → coller → Run
-- =====================================================================

alter table public.brands
  add column if not exists siren text,
  add column if not exists siret text,
  add column if not exists legal_form text,
  add column if not exists naf_code text,
  add column if not exists naf_label text,
  add column if not exists address text;

-- Index sur SIREN pour éviter les doublons si on souhaite plus tard une contrainte d'unicité
create index if not exists idx_brands_siren on public.brands(siren);
