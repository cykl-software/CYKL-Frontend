import { supabase } from '../lib/supabase';

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Retorna true quando a sessão já foi aberta (confirmação de e-mail desativada). */
export async function signUpWithPassword(name: string, email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password, options: { data: { name: name.trim() } },
  });
  if (error) throw error;
  // Com e-mail já cadastrado e confirmação ligada, o Supabase devolve um usuário sem identidades.
  if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error('User already registered');
  return Boolean(data.session);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
