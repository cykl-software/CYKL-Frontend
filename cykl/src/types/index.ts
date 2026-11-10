export type DonationStatus = 'disponivel' | 'reservado' | 'indisponivel' | 'concluido';
export type RequestStatus = 'pendente' | 'aprovada' | 'recusada' | 'cancelada' | 'concluida';
export type Condition = 'novo' | 'otimo' | 'bom' | 'desgaste';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Donation {
  id: string;
  donor_id: string;
  category_id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string | null;
  condition: Condition;
  city: string;
  neighborhood: string;
  image_url: string | null;
  status: DonationStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export type DonationInput = Pick<
  Donation,
  'category_id' | 'name' | 'description' | 'quantity' | 'unit' | 'condition' | 'city' | 'neighborhood' | 'image_url'
>;

export interface RequestItemInfo {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  status: DonationStatus;
  image_url: string | null;
  donor_id: string;
  deleted_at: string | null;
  quantity: number;
  unit: string | null;
}

export interface DonationRequest {
  id: string;
  item_id: string;
  requester_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  donation: RequestItemInfo;
}

export interface PickupContact {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
}

export interface CatalogFilters {
  search: string;
  categoryId: string;
  city: string;
  neighborhood: string;
  onlyAvailable: boolean;
}
