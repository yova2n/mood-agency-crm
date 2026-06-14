-- =====================================================================
-- MOOD AGENCY CRM — Migration des statuts créateurs
-- Avant : actif / inactif / en_attente (enum influencer_status)
-- Après : signed / activable / prospect (text + check constraint)
-- =====================================================================

-- 1) Convertir l'enum en text (plus flexible pour évoluer)
alter table public.influencers
  alter column status drop default;

alter table public.influencers
  alter column status type text using status::text;

-- 2) Migrer les valeurs existantes
update public.influencers set status = 'signed'    where status in ('actif', 'active');
update public.influencers set status = 'activable' where status = 'inactif';
update public.influencers set status = 'prospect'  where status in ('en_attente', 'pending');

-- 3) Default + check constraint
alter table public.influencers
  alter column status set default 'prospect';

-- Drop l'ancienne contrainte (au cas où) puis recrée
alter table public.influencers
  drop constraint if exists influencers_status_check;
alter table public.influencers
  add constraint influencers_status_check
  check (status in ('signed', 'activable', 'prospect'));

-- 4) On peut supprimer l'ancien enum maintenant qu'il n'est plus utilisé
drop type if exists influencer_status;

-- =====================================================================
-- Vérification (à lancer manuellement après) :
--   select status, count(*) from public.influencers group by status;
-- =====================================================================
