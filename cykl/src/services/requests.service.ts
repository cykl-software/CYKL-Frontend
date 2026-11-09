import { supabase } from '../lib/supabase';
import type { DonationRequest, PickupContact } from '../types';

const SELECT =
  '*, donation:donations!inner(id, name, city, neighborhood, status, image_url, donor_id, deleted_at, quantity, unit)';

export async function createRequest(itemId: string, message: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_request', { p_item_id: itemId, p_message: message || null });
  if (error) throw error;
  return data as string;
}

export async function listMyRequests(userId: string): Promise<DonationRequest[]> {
  const { data, error } = await supabase
    .from('requests').select(SELECT).eq('requester_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DonationRequest[];
}

export async function listReceivedRequests(userId: string): Promise<DonationRequest[]> {
  const { data, error } = await supabase
    .from('requests').select(SELECT).eq('donation.donor_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DonationRequest[];
}

const call = async (fn: string, id: string) => {
  const { error } = await supabase.rpc(fn, { p_request_id: id });
  if (error) throw error;
};

export const approveRequest = (id: string) => call('approve_request', id);
export const rejectRequest = (id: string) => call('reject_request', id);
export const cancelRequest = (id: string) => call('cancel_request', id);
export const confirmReceipt = (id: string) => call('confirm_receipt', id);

export async function getPickupContact(requestId: string): Promise<PickupContact> {
  const { data, error } = await supabase.rpc('get_pickup_contact', { p_request_id: requestId });
  if (error) throw error;
  const row = (data as PickupContact[] | null)?.[0];
  if (!row) throw new Error('forbidden');
  return row;
}
