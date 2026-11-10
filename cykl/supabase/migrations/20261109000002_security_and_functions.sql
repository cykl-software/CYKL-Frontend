-- (Reexecutável: pode ser rodado mais de uma vez sem erro.)
-- CYKL · Etapa 3 · RLS, permissões por coluna e funções de negócio (RPC)
-- Regra geral: o cliente NUNCA altera estados diretamente. Toda transição passa por função
-- SECURITY DEFINER que valida regras e trava o anúncio (SELECT ... FOR UPDATE).

alter table public.users      enable row level security;
alter table public.categories enable row level security;
alter table public.donations  enable row level security;
alter table public.requests   enable row level security;

-- Supabase concede tudo por padrão: revogamos e liberamos só o necessário.
revoke all on public.users, public.categories, public.donations, public.requests from anon, authenticated;

-- ---------- Funções auxiliares (SECURITY DEFINER evita recursão entre políticas) ----------
create or replace function public.is_item_owner(p_item uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.donations d where d.id = p_item and d.donor_id = auth.uid())
$$;

create or replace function public.has_request_on(p_item uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.requests r where r.item_id = p_item and r.requester_id = auth.uid())
$$;

-- ---------- users: cada um lê/edita apenas o próprio perfil (RNF007, RN026) ----------
grant select on public.users to authenticated;
grant update (name, phone, city, neighborhood) on public.users to authenticated;
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select to authenticated using (id = auth.uid());
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- categories: leitura pública ----------
grant select on public.categories to anon, authenticated;
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (true);

-- ---------- donations ----------
grant select on public.donations to anon, authenticated;
grant insert (donor_id, category_id, name, description, quantity, unit, condition, city, neighborhood, image_url)
  on public.donations to authenticated;
-- status, deleted_at e id NÃO são graváveis pelo cliente
grant update (category_id, name, description, quantity, unit, condition, city, neighborhood, image_url)
  on public.donations to authenticated;

drop policy if exists donations_select on public.donations;
create policy donations_select on public.donations for select to anon, authenticated
  using (deleted_at is null or donor_id = auth.uid() or public.has_request_on(id));
drop policy if exists donations_insert on public.donations;
create policy donations_insert on public.donations for insert to authenticated
  with check (donor_id = auth.uid());
-- RN010/RN011: só o dono edita, e apenas anúncios Disponível/Indisponível
drop policy if exists donations_update on public.donations;
create policy donations_update on public.donations for update to authenticated
  using (donor_id = auth.uid() and deleted_at is null and status in ('disponivel','indisponivel'))
  with check (donor_id = auth.uid());

-- ---------- requests: somente leitura direta; escrita só via RPC ----------
grant select on public.requests to authenticated;
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests for select to authenticated
  using (requester_id = auth.uid() or public.is_item_owner(item_id));

-- ---------- RPC: criar solicitação (RF022–RF024, RN012–RN014, RN017) ----------
create or replace function public.create_request(p_item_id uuid, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_d public.donations; v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_d from public.donations where id = p_item_id and deleted_at is null for share;
  if not found then raise exception 'item_not_found'; end if;
  if v_d.donor_id = v_uid then raise exception 'own_item'; end if;
  if v_d.status <> 'disponivel' then raise exception 'item_unavailable'; end if;
  begin
    insert into public.requests (item_id, requester_id, message, status)
    values (p_item_id, v_uid, nullif(btrim(coalesce(p_message, '')), ''), 'pendente')
    returning id into v_id;
  exception when unique_violation then
    raise exception 'duplicate_request';
  end;
  return v_id;
end $$;

-- ---------- RPC: aprovar (RN015, RN016, RN018, RNF015) ----------
-- Ordem de locks fixa: anúncio -> solicitação.
create or replace function public.approve_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_item uuid; v_d public.donations; v_r public.requests;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select item_id into v_item from public.requests where id = p_request_id;
  if not found then raise exception 'request_not_found'; end if;
  select * into v_d from public.donations where id = v_item for update;
  if v_d.donor_id <> v_uid then raise exception 'forbidden'; end if;
  select * into v_r from public.requests where id = p_request_id for update;
  if v_d.deleted_at is not null then raise exception 'item_not_found'; end if;
  if v_r.status <> 'pendente' then raise exception 'invalid_request_state'; end if;
  if v_d.status <> 'disponivel' then raise exception 'item_unavailable'; end if;
  update public.requests  set status = 'aprovada' where id = v_r.id;
  update public.donations set status = 'reservado' where id = v_d.id;
end $$;

-- ---------- RPC: recusar (RN015, RN019) ----------
create or replace function public.reject_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_r public.requests;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_r from public.requests where id = p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if not public.is_item_owner(v_r.item_id) then raise exception 'forbidden'; end if;
  if v_r.status <> 'pendente' then raise exception 'invalid_request_state'; end if;
  update public.requests set status = 'recusada' where id = v_r.id;
end $$;

-- ---------- RPC: cancelar pela pessoa solicitante, só pendente (RN020) ----------
create or replace function public.cancel_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_r public.requests;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_r from public.requests where id = p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if v_r.requester_id <> v_uid then raise exception 'forbidden'; end if;
  if v_r.status <> 'pendente' then raise exception 'invalid_request_state'; end if;
  update public.requests set status = 'cancelada' where id = v_r.id;
end $$;

-- ---------- RPC: confirmar recebimento (RN023, RF033) ----------
create or replace function public.confirm_receipt(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_item uuid; v_d public.donations; v_r public.requests;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select item_id into v_item from public.requests where id = p_request_id;
  if not found then raise exception 'request_not_found'; end if;
  select * into v_d from public.donations where id = v_item for update;
  select * into v_r from public.requests where id = p_request_id for update;
  if v_r.requester_id <> v_uid then raise exception 'forbidden'; end if;
  if v_r.status <> 'aprovada' or v_d.status <> 'reservado' then raise exception 'invalid_request_state'; end if;
  update public.requests  set status = 'concluida' where id = v_r.id;
  update public.donations set status = 'concluido' where id = v_d.id;
end $$;

-- ---------- RPC: disponível <-> indisponível (RF011, RN010, RN011) ----------
create or replace function public.set_donation_availability(p_item_id uuid, p_available boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_d public.donations;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_d from public.donations where id = p_item_id for update;
  if not found or v_d.deleted_at is not null then raise exception 'item_not_found'; end if;
  if v_d.donor_id <> v_uid then raise exception 'forbidden'; end if;
  if v_d.status not in ('disponivel','indisponivel') then raise exception 'item_locked'; end if;
  update public.donations set status = case when p_available then 'disponivel' else 'indisponivel' end
  where id = v_d.id;
end $$;

-- ---------- RPC: excluir (lógico) (RF010, RN024, A3) ----------
create or replace function public.delete_donation(p_item_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_d public.donations;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_d from public.donations where id = p_item_id for update;
  if not found or v_d.deleted_at is not null then raise exception 'item_not_found'; end if;
  if v_d.donor_id <> v_uid then raise exception 'forbidden'; end if;
  if v_d.status in ('reservado','concluido')
     or exists (select 1 from public.requests where item_id = v_d.id and status in ('aprovada','concluida'))
  then raise exception 'cannot_delete'; end if;
  update public.donations set deleted_at = now() where id = v_d.id;
end $$;

-- ---------- RPC: contato da outra parte, só após aprovação (RF031, A4) ----------
create or replace function public.get_pickup_contact(p_request_id uuid)
returns table (name text, email text, phone text, city text, neighborhood text)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_r public.requests; v_donor uuid; v_other uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_r from public.requests where id = p_request_id;
  if not found then raise exception 'request_not_found'; end if;
  select donor_id into v_donor from public.donations where id = v_r.item_id;
  if v_uid <> v_r.requester_id and v_uid <> v_donor then raise exception 'forbidden'; end if;
  if v_r.status not in ('aprovada','concluida') then raise exception 'invalid_request_state'; end if;
  v_other := case when v_uid = v_r.requester_id then v_donor else v_r.requester_id end;
  return query
    select u.name::text, u.email::text, u.phone::text, u.city::text, u.neighborhood::text
    from public.users u where u.id = v_other;
end $$;

-- Execução apenas para usuários autenticados
do $$
declare f text;
begin
  foreach f in array array[
    'create_request(uuid,text)','approve_request(uuid)','reject_request(uuid)','cancel_request(uuid)',
    'confirm_receipt(uuid)','set_donation_availability(uuid,boolean)','delete_donation(uuid)',
    'get_pickup_contact(uuid)','is_item_owner(uuid)','has_request_on(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
-- has_request_on é usada na política de donations (avaliada também para anon): precisa de execute para anon
grant execute on function public.has_request_on(uuid) to anon;
