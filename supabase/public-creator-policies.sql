-- =====================================================================
-- Politiques d'accès pour les liens créateurs publics (/c/[slug])
-- À exécuter une seule fois dans Supabase SQL Editor.
-- =====================================================================

-- Permettre la lecture anonyme des influenceurs (nécessaire pour /c/[slug])
create policy "anon read influencers" on public.influencers for select
  to anon using (true);

-- Lecture anonyme des collaborations
create policy "anon read collaborations" on public.collaborations for select
  to anon using (true);

-- Lecture anonyme des marques (pour afficher le nom du client dans le tableau)
create policy "anon read brands" on public.brands for select
  to anon using (true);

-- Lecture anonyme des snapshots de stats
create policy "anon read snapshots" on public.influencer_stats_snapshots for select
  to anon using (true);
