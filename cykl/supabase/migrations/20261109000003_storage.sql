-- CYKL · Imagens dos anúncios (RF015) — bucket público, escrita restrita à pasta do próprio usuário
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('donation-images', 'donation-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "donation_images_read" on storage.objects;
create policy "donation_images_read" on storage.objects for select
  using (bucket_id = 'donation-images');
drop policy if exists "donation_images_insert_own" on storage.objects;
create policy "donation_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'donation-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "donation_images_delete_own" on storage.objects;
create policy "donation_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'donation-images' and (storage.foldername(name))[1] = auth.uid()::text);
