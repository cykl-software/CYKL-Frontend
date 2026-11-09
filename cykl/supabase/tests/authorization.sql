-- CYKL · Testes de autorização e regras de negócio (SQL)
-- Como rodar: cole no SQL Editor do Supabase (papel postgres) APÓS aplicar as migrações.
-- Tudo roda numa transação e termina com ROLLBACK: nada é gravado. Cada teste imprime "OK Tn";
-- qualquer falha interrompe o script com uma mensagem "FALHOU".
begin;

create schema tests;
grant usage on schema tests to public;
create table tests.ctx (k text primary key, v uuid);
grant all on tests.ctx to public;

create function tests.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p::text, true);
  execute 'set local role authenticated';
end $$;

-- Executa p_sql e exige que falhe com mensagem contendo p_msg
create function tests.expect_error(p_sql text, p_msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like '%' || p_msg || '%' then return; end if;
    raise exception 'FALHOU: erro inesperado "%" em: %', sqlerrm, p_sql;
  end;
  raise exception 'FALHOU: esperava erro "%" em: %', p_msg, p_sql;
end $$;

create function tests.rows_affected(p_sql text) returns int language plpgsql as $$
declare n int;
begin execute p_sql; get diagnostics n = row_count; return n; end $$;

-- ---------- Preparação (como postgres) ----------
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'dono@teste.local',  '{"name":"Dono"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'req1@teste.local',  '{"name":"Solicitante 1"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'req2@teste.local',  '{"name":"Solicitante 2"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'outro@teste.local', '{"name":"Outra Pessoa"}');
insert into public.donations (id, donor_id, category_id, name, description, quantity, condition, city, neighborhood)
select 'd0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', c.id,
       'Sofá de 3 lugares', 'Sofá em bom estado', 1, 'bom', 'Recife', 'Boa Viagem'
from public.categories c where c.name = 'Móveis';

-- T1: perfil criado automaticamente pelo trigger do Auth
do $$ begin
  if (select count(*) from public.users where email like '%@teste.local') <> 4 then raise exception 'FALHOU T1'; end if;
  raise notice 'OK T1 perfis criados pelo trigger';
end $$;

-- T2: dono não consegue mudar status diretamente (coluna sem permissão)
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
select tests.expect_error($q$update public.donations set status = 'concluido' where id = 'd0000000-0000-0000-0000-000000000001'$q$, 'permission denied');
do $$ begin raise notice 'OK T2 status não editável pelo cliente'; end $$;

-- T3: terceiros não editam nem excluem anúncio alheio
select tests.as_user('00000000-0000-0000-0000-0000000000a4');
do $$ begin
  if tests.rows_affected($q$update public.donations set name = 'hack' where id = 'd0000000-0000-0000-0000-000000000001'$q$) <> 0
  then raise exception 'FALHOU T3: terceiro editou anúncio'; end if;
end $$;
select tests.expect_error($q$delete from public.donations where id = 'd0000000-0000-0000-0000-000000000001'$q$, 'permission denied');
select tests.expect_error($q$select public.delete_donation('d0000000-0000-0000-0000-000000000001')$q$, 'forbidden');
do $$ begin raise notice 'OK T3 edição/exclusão por terceiros bloqueadas'; end $$;

-- T4: não pode solicitar o próprio anúncio
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
select tests.expect_error($q$select public.create_request('d0000000-0000-0000-0000-000000000001', 'x')$q$, 'own_item');
do $$ begin raise notice 'OK T4 auto-solicitação bloqueada'; end $$;

-- T5: solicitações nascem Pendente; duplicada ativa é bloqueada; inserção direta é negada
select tests.as_user('00000000-0000-0000-0000-0000000000a2');
do $$ begin
  insert into tests.ctx values ('r1', public.create_request('d0000000-0000-0000-0000-000000000001', 'Preciso do sofá'));
  if (select status from public.requests where id = (select v from tests.ctx where k = 'r1')) <> 'pendente'
  then raise exception 'FALHOU T5: não iniciou como pendente'; end if;
end $$;
select tests.expect_error($q$select public.create_request('d0000000-0000-0000-0000-000000000001', 'de novo')$q$, 'duplicate_request');
select tests.expect_error($q$insert into public.requests (item_id, requester_id) values ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2')$q$, 'permission denied');
select tests.as_user('00000000-0000-0000-0000-0000000000a3');
do $$ begin insert into tests.ctx values ('r2', public.create_request('d0000000-0000-0000-0000-000000000001', null)); end $$;
do $$ begin raise notice 'OK T5 solicitação pendente, duplicidade e escrita direta'; end $$;

-- T6: só o dono aprova/recusa
select tests.as_user('00000000-0000-0000-0000-0000000000a2');
select tests.expect_error($q$select public.approve_request((select v from tests.ctx where k = 'r1'))$q$, 'forbidden');
select tests.as_user('00000000-0000-0000-0000-0000000000a4');
select tests.expect_error($q$select public.approve_request((select v from tests.ctx where k = 'r1'))$q$, 'forbidden');
select tests.expect_error($q$select public.reject_request((select v from tests.ctx where k = 'r1'))$q$, 'forbidden');
do $$ begin raise notice 'OK T6 aprovar/recusar restrito ao dono'; end $$;

-- T7: aprovação reserva o anúncio; segunda aprovação é bloqueada
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
select public.approve_request((select v from tests.ctx where k = 'r1'));
do $$ begin
  if (select status from public.donations where id = 'd0000000-0000-0000-0000-000000000001') <> 'reservado'
  then raise exception 'FALHOU T7: anúncio não reservou'; end if;
end $$;
select tests.expect_error($q$select public.approve_request((select v from tests.ctx where k = 'r2'))$q$, 'item_unavailable');
do $$ begin raise notice 'OK T7 aprovação reserva e impede segunda aprovação'; end $$;

-- T8: item reservado não recebe novas solicitações
select tests.as_user('00000000-0000-0000-0000-0000000000a4');
select tests.expect_error($q$select public.create_request('d0000000-0000-0000-0000-000000000001', null)$q$, 'item_unavailable');
do $$ begin raise notice 'OK T8 item reservado não aceita solicitações'; end $$;

-- T9: cancelar só pendente e só o solicitante
select tests.as_user('00000000-0000-0000-0000-0000000000a4');
select tests.expect_error($q$select public.cancel_request((select v from tests.ctx where k = 'r2'))$q$, 'forbidden');
select tests.as_user('00000000-0000-0000-0000-0000000000a3');
select public.cancel_request((select v from tests.ctx where k = 'r2'));
select tests.expect_error($q$select public.cancel_request((select v from tests.ctx where k = 'r2'))$q$, 'invalid_request_state');
select tests.as_user('00000000-0000-0000-0000-0000000000a2');
select tests.expect_error($q$select public.cancel_request((select v from tests.ctx where k = 'r1'))$q$, 'invalid_request_state');
do $$ begin raise notice 'OK T9 cancelamento só do solicitante e só pendente'; end $$;

-- T10: anúncio reservado: sem edição, sem exclusão, sem mudar disponibilidade
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  if tests.rows_affected($q$update public.donations set name = 'Novo nome' where id = 'd0000000-0000-0000-0000-000000000001'$q$) <> 0
  then raise exception 'FALHOU T10: editou anúncio reservado'; end if;
end $$;
select tests.expect_error($q$select public.delete_donation('d0000000-0000-0000-0000-000000000001')$q$, 'cannot_delete');
select tests.expect_error($q$select public.set_donation_availability('d0000000-0000-0000-0000-000000000001', false)$q$, 'item_locked');
do $$ begin raise notice 'OK T10 anúncio reservado protegido'; end $$;

-- T11: privacidade — terceiros não veem solicitações nem contatos
select tests.as_user('00000000-0000-0000-0000-0000000000a4');
do $$ begin
  if (select count(*) from public.requests) <> 0 then raise exception 'FALHOU T11: terceiro vê solicitações'; end if;
  if (select count(*) from public.users where id <> '00000000-0000-0000-0000-0000000000a4') <> 0
  then raise exception 'FALHOU T11: terceiro vê perfis alheios'; end if;
end $$;
select tests.expect_error($q$select * from public.get_pickup_contact((select v from tests.ctx where k = 'r1'))$q$, 'forbidden');
do $$ begin raise notice 'OK T11 dados privados protegidos'; end $$;

-- T12: contato liberado para as duas partes após a aprovação
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  if (select name from public.get_pickup_contact((select v from tests.ctx where k = 'r1'))) <> 'Solicitante 1'
  then raise exception 'FALHOU T12: dono não recebeu contato do solicitante'; end if;
end $$;
select tests.as_user('00000000-0000-0000-0000-0000000000a2');
do $$ begin
  if (select name from public.get_pickup_contact((select v from tests.ctx where k = 'r1'))) <> 'Dono'
  then raise exception 'FALHOU T12: solicitante não recebeu contato do dono'; end if;
  raise notice 'OK T12 contato liberado às duas partes';
end $$;

-- T13: só o solicitante confirma; conclui solicitação e anúncio
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
select tests.expect_error($q$select public.confirm_receipt((select v from tests.ctx where k = 'r1'))$q$, 'forbidden');
select tests.as_user('00000000-0000-0000-0000-0000000000a2');
select public.confirm_receipt((select v from tests.ctx where k = 'r1'));
do $$ begin
  if (select status from public.donations where id = 'd0000000-0000-0000-0000-000000000001') <> 'concluido'
     or (select status from public.requests where id = (select v from tests.ctx where k = 'r1')) <> 'concluida'
  then raise exception 'FALHOU T13: conclusão incorreta'; end if;
  raise notice 'OK T13 confirmação de recebimento conclui solicitação e anúncio';
end $$;

-- T14: histórico preservado (recusada/cancelada/concluída continuam consultáveis)
select tests.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  if (select count(*) from public.requests) <> 2 then raise exception 'FALHOU T14: histórico incompleto'; end if;
  raise notice 'OK T14 histórico preservado';
end $$;

reset role;
rollback;
