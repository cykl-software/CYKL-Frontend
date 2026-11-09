-- CYKL · REINICIAR O BANCO DE DESENVOLVIMENTO
-- ATENÇÃO: apaga TODAS as tabelas e dados do CYKL (users, categories, donations, requests).
-- Use só em projeto de teste. Depois, rode as 3 migrações na ordem (001, 002, 003).
-- Contas já criadas em Authentication continuam existindo, mas ficam sem perfil: após rodar a 001,
-- execute o bloco "BACKFILL" abaixo (ou apague os usuários de teste em Authentication > Users).

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.requests, public.donations, public.categories, public.users cascade;

drop function if exists public.create_request(uuid, text);
drop function if exists public.approve_request(uuid);
drop function if exists public.reject_request(uuid);
drop function if exists public.cancel_request(uuid);
drop function if exists public.confirm_receipt(uuid);
drop function if exists public.set_donation_availability(uuid, boolean);
drop function if exists public.delete_donation(uuid);
drop function if exists public.get_pickup_contact(uuid);
drop function if exists public.is_item_owner(uuid);
drop function if exists public.has_request_on(uuid);
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

drop policy if exists "donation_images_read" on storage.objects;
drop policy if exists "donation_images_insert_own" on storage.objects;
drop policy if exists "donation_images_delete_own" on storage.objects;

-- BACKFILL (rode DEPOIS da migração 001, se ficaram contas antigas em Authentication):
-- insert into public.users (id, name, email)
-- select id, coalesce(nullif(btrim(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1)), email
-- from auth.users on conflict (id) do nothing;
