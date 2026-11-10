import type { Condition, DonationStatus, RequestStatus } from '../types';

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'otimo', label: 'Usado, em ótimo estado' },
  { value: 'bom', label: 'Usado, em bom estado' },
  { value: 'desgaste', label: 'Usado, com desgaste' },
];

export const UNITS = ['unidade', 'par', 'kg', 'm', 'm²', 'm³', 'saco', 'caixa', 'litro'];

export const conditionLabel = (c: Condition) => CONDITIONS.find((x) => x.value === c)?.label ?? c;

export const DONATION_STATUS: Record<DonationStatus, { label: string; className: string }> = {
  disponivel: { label: 'Disponível', className: 'bg-brand-100 text-brand-800' },
  reservado: { label: 'Reservado', className: 'bg-amber-100 text-amber-900' },
  indisponivel: { label: 'Indisponível', className: 'bg-slate-200 text-slate-700' },
  concluido: { label: 'Concluído', className: 'bg-sky-100 text-sky-900' },
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-900' },
  aprovada: { label: 'Aprovada', className: 'bg-brand-100 text-brand-800' },
  recusada: { label: 'Recusada', className: 'bg-red-100 text-red-800' },
  cancelada: { label: 'Cancelada', className: 'bg-slate-200 text-slate-700' },
  concluida: { label: 'Concluída', className: 'bg-sky-100 text-sky-900' },
};

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
