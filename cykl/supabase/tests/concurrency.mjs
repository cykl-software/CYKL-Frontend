// CYKL · Teste de concorrência (RN018 / RNF015): duas aprovações simultâneas no mesmo anúncio.
// Requer: migrações aplicadas, confirmação de e-mail DESATIVADA e `npm install` feito.
// Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/concurrency.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Defina SUPABASE_URL e SUPABASE_ANON_KEY.'); process.exit(1); }

const run = Date.now();
const password = 'Teste-' + run;
const newClient = () => createClient(url, key, { auth: { persistSession: false } });

async function user(label) {
  const c = newClient();
  const { data, error } = await c.auth.signUp({
    email: `cykl-${label}-${run}@example.com`, password, options: { data: { name: `Teste ${label}` } },
  });
  if (error) throw error;
  if (!data.session) throw new Error('Sem sessão: desative a confirmação de e-mail no Supabase.');
  return { c, id: data.user.id };
}
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

const owner = await user('dono');
const a = await user('a');
const b = await user('b');

const { data: cats } = await owner.c.from('categories').select('id').limit(1);
const item = must(await owner.c.from('donations').insert({
  donor_id: owner.id, category_id: cats[0].id, name: 'Item de teste de concorrência',
  description: 'Criado pelo script concurrency.mjs', quantity: 1, condition: 'bom',
  city: 'Recife', neighborhood: 'Centro',
}).select('id').single(), 'criar anúncio');

const ra = must(await a.c.rpc('create_request', { p_item_id: item.id, p_message: 'A' }), 'solicitação A');
const rb = must(await b.c.rpc('create_request', { p_item_id: item.id, p_message: 'B' }), 'solicitação B');

const results = await Promise.all([
  owner.c.rpc('approve_request', { p_request_id: ra }),
  owner.c.rpc('approve_request', { p_request_id: rb }),
]);
const ok = results.filter((r) => !r.error).length;
const failed = results.filter((r) => r.error).map((r) => r.error.message);
const { data: reqs } = await owner.c.from('requests').select('status').eq('item_id', item.id);
const approved = reqs.filter((r) => r.status === 'aprovada').length;

console.log({ aprovacoesComSucesso: ok, erros: failed, solicitacoesAprovadas: approved });
if (ok === 1 && approved === 1 && failed[0] === 'item_unavailable') {
  console.log('OK: apenas uma aprovação prevaleceu.');
} else {
  console.error('FALHOU: comportamento de concorrência inesperado.'); process.exitCode = 1;
}
await owner.c.rpc('delete_donation', { p_item_id: item.id }).then(() => {});
