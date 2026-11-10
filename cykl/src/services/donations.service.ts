import { supabase } from '../lib/supabase';
import type { CatalogFilters, Donation, DonationInput } from '../types';

const SELECT = '*, category:categories(id, name)';

// Evita que %, _ e \ digitados pelo usuário virem curingas do ILIKE.
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => '\\' + m);

export async function listCatalog(f: CatalogFilters, limit?: number): Promise<Donation[]> {
  let q = supabase.from('donations').select(SELECT).is('deleted_at', null);
  if (f.onlyAvailable) q = q.eq('status', 'disponivel');
  if (f.categoryId) q = q.eq('category_id', f.categoryId);
  if (f.search.trim()) q = q.ilike('name', `%${escapeLike(f.search.trim())}%`);
  if (f.city.trim()) q = q.ilike('city', `%${escapeLike(f.city.trim())}%`);
  if (f.neighborhood.trim()) q = q.ilike('neighborhood', `%${escapeLike(f.neighborhood.trim())}%`);
  q = q.order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Donation[];
}

export async function getDonation(id: string): Promise<Donation | null> {
  const { data, error } = await supabase.from('donations').select(SELECT).eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return (data as Donation | null) ?? null;
}

export async function listMyDonations(userId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations').select(SELECT).eq('donor_id', userId).is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Donation[];
}

export async function createDonation(userId: string, input: DonationInput): Promise<string> {
  const { data, error } = await supabase.from('donations').insert({ ...input, donor_id: userId }).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateDonation(id: string, input: DonationInput): Promise<void> {
  const { data, error } = await supabase.from('donations').update(input).eq('id', id).select('id');
  if (error) throw error;
  // RLS não gera erro quando bloqueia: nenhuma linha afetada significa anúncio alheio, reservado ou concluído.
  if (!data || data.length === 0) throw new Error('item_locked');
}

export async function setAvailability(id: string, available: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_donation_availability', { p_item_id: id, p_available: available });
  if (error) throw error;
}

export async function deleteDonation(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_donation', { p_item_id: id });
  if (error) throw error;
}

export async function uploadDonationImage(userId: string, file: File): Promise<string> {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('donation-images').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('donation-images').getPublicUrl(path).data.publicUrl;
}
