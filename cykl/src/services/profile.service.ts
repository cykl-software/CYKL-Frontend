import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export interface ProfileUpdate {
  name: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
}

export async function updateProfile(userId: string, values: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase.from('users').update(values).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as Profile;
}
