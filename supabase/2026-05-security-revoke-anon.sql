-- =====================================================================
-- 🚨 CORRECTION SÉCURITÉ CRITIQUE — Mood Agency CRM
-- À exécuter D'URGENCE dans Supabase SQL Editor (projet mood-agency-crm)
-- =====================================================================
--
-- CONTEXTE :
-- Les policies "anon read *" donnaient au rôle anon (clé publique embarquée
-- dans le bundle JS du navigateur) un accès SELECT à toutes les tables.
-- N'importe qui pouvant intercepter cette clé pouvait dumper toute la base.
--
-- CORRECTIF :
-- 1) On supprime toutes les policies anon.
-- 2) La page publique /c/[slug] passe désormais par notre serveur Next.js
--    avec le service_role (jamais exposé au client).
-- 3) Le rôle anon n'a donc PLUS aucun droit de lecture sur public.*.
-- =====================================================================

drop policy if exists "anon read influencers"            on public.influencers;
drop policy if exists "anon read collaborations"         on public.collaborations;
drop policy if exists "anon read brands"                 on public.brands;
drop policy if exists "anon read snapshots"              on public.influencer_stats_snapshots;
drop policy if exists "anon read calendar_events"        on public.calendar_events;
drop policy if exists "anon read profiles"               on public.profiles;

-- Vérification : aucune policy ne doit autoriser le rôle "anon" en lecture sur
-- les tables sensibles. Si tu vois une ligne avec roles={anon,...}, vire-la.
-- (Lance ce SELECT dans le SQL editor pour vérifier.)
--
-- select schemaname, tablename, policyname, permissive, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- =====================================================================
-- BONUS : Storage — chaque user ne peut modifier/supprimer QUE ses propres uploads
-- (avant : tout user authentifié pouvait modifier les uploads des autres)
-- =====================================================================

drop policy if exists "media auth update" on storage.objects;
drop policy if exists "media auth delete" on storage.objects;

create policy "media owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'media' and owner = auth.uid())
with check (bucket_id = 'media' and owner = auth.uid());

create policy "media owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'media' and owner = auth.uid());

-- (Insert reste autorisé pour tout user authentifié — chaque insert pose owner
--  = auth.uid() automatiquement via le SDK Supabase.)
