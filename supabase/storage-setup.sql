-- =====================================================================
-- Setup Supabase Storage pour upload d'images (photos profil + logos)
-- À exécuter une seule fois dans Supabase SQL Editor.
-- =====================================================================

-- Créer le bucket "media" (public en lecture)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Policies storage : tout le monde peut lire (les images sont publiques)
create policy "media public read"
on storage.objects for select
to public
using (bucket_id = 'media');

-- Seuls les utilisateurs authentifiés peuvent uploader / modifier / supprimer
create policy "media auth insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

create policy "media auth update"
on storage.objects for update
to authenticated
using (bucket_id = 'media');

create policy "media auth delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'media');
