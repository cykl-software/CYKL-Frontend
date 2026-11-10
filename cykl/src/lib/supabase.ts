import { createClient } from '@supabase/supabase-js';

// Tolera erros comuns no .env: espaços, aspas, barra final e o sufixo /rest/v1.
const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');

const url = clean(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

const isPlaceholder = /SEU-PROJETO|SUA-CHAVE/i.test(`${url ?? ''} ${anonKey ?? ''}`);

export const isSupabaseConfigured = Boolean(url && anonKey) && !isPlaceholder && /^https?:\/\//.test(url ?? '');

// Com variáveis ausentes, usamos valores neutros só para o app abrir e mostrar o aviso de configuração.
export const supabase = createClient(isSupabaseConfigured ? url! : 'http://localhost:54321', isSupabaseConfigured ? anonKey! : 'missing-key');
