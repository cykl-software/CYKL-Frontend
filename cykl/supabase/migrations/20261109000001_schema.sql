-- CYKL · Etapa 3 · Esquema (tabelas, índices, triggers)
-- Entidades do Plano Técnico: users, categories, donations, requests.
-- Extra justificado: donations.deleted_at (exclusão lógica, preserva histórico — RN028).

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         varchar(120) not null check (char_length(btrim(name)) > 0),
  email        varchar(255) not null unique,
  phone        varchar(30),
  city         varchar(100),
  neighborhood varchar(100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(100) not null unique,
  description text
);

create table public.donations (
  id           uuid primary key default gen_random_uuid(),
  donor_id     uuid not null references public.users(id) on delete restrict,
  category_id  uuid not null references public.categories(id),
  name         varchar(150) not null check (char_length(btrim(name)) > 0),
  description  text not null check (char_length(btrim(description)) > 0),
  quantity     numeric(12,2) not null check (quantity > 0),
  unit         varchar(20) check (unit in ('unidade','par','kg','m','m²','m³','saco','caixa','litro')),
  condition    varchar(30) not null check (condition in ('novo','otimo','bom','desgaste')),
  city         varchar(100) not null check (char_length(btrim(city)) > 0),
  neighborhood varchar(100) not null check (char_length(btrim(neighborhood)) > 0),
  image_url    text,
  status       varchar(20) not null default 'disponivel'
               check (status in ('disponivel','reservado','indisponivel','concluido')),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.requests (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.donations(id) on delete restrict,
  requester_id uuid not null references public.users(id) on delete restrict,
  message      text,
  status       varchar(20) not null default 'pendente'
               check (status in ('pendente','aprovada','recusada','cancelada','concluida')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Índices das consultas principais
create index donations_donor_idx    on public.donations (donor_id);
create index donations_category_idx on public.donations (category_id);
create index donations_status_idx   on public.donations (status) where deleted_at is null;
create index donations_city_idx     on public.donations (lower(city));
create index donations_created_idx  on public.donations (created_at desc);
create index requests_item_idx      on public.requests (item_id);
create index requests_requester_idx on public.requests (requester_id);

-- Unicidade (A5): sem solicitação ativa duplicada do mesmo usuário para o mesmo item
create unique index requests_one_active_per_user
  on public.requests (item_id, requester_id) where status in ('pendente','aprovada');

-- RN016/RNF015: no máximo UMA solicitação aprovada (ou concluída) por anúncio, garantido pelo banco
create unique index requests_one_approved_per_item
  on public.requests (item_id) where status in ('aprovada','concluida');

-- updated_at automático
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger users_updated_at     before update on public.users     for each row execute function public.set_updated_at();
create trigger donations_updated_at before update on public.donations for each row execute function public.set_updated_at();
create trigger requests_updated_at  before update on public.requests  for each row execute function public.set_updated_at();

-- Perfil criado automaticamente a partir do Supabase Auth (mesmo UUID)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Categorias iniciais (Plano Técnico §4.2)
insert into public.categories (name, description) values
  ('Materiais de construção', 'Tijolos, cimento, tintas, telhas, pisos e outros materiais de obra'),
  ('Móveis', 'Camas, mesas, cadeiras, armários, sofás e estantes'),
  ('Eletrodomésticos', 'Geladeiras, fogões, ventiladores, liquidificadores e similares'),
  ('Roupas e calçados', 'Vestuário e calçados em condições de uso'),
  ('Cobertores e itens de cama, mesa e banho', 'Cobertores, lençóis, toalhas e itens domésticos de tecido'),
  ('Outros', 'Itens que não se encaixam nas demais categorias')
on conflict (name) do nothing;
