import { CONDITIONS, UNITS } from './constants';

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

export function validateLogin(v: { email: string; password: string }): FieldErrors {
  const e: FieldErrors = {};
  if (!v.email.trim()) e.email = 'Informe seu e-mail.';
  else if (!isValidEmail(v.email)) e.email = 'Informe um e-mail válido.';
  if (!v.password) e.password = 'Informe sua senha.';
  return e;
}

export function validateRegister(v: { name: string; email: string; password: string; confirm: string }): FieldErrors {
  const e: FieldErrors = {};
  if (!v.name.trim()) e.name = 'Informe seu nome.';
  if (!v.email.trim()) e.email = 'Informe seu e-mail.';
  else if (!isValidEmail(v.email)) e.email = 'Informe um e-mail válido.';
  if (!v.password) e.password = 'Crie uma senha.';
  else if (v.password.length < 8) e.password = 'A senha precisa ter ao menos 8 caracteres.';
  if (v.confirm !== v.password) e.confirm = 'As senhas não coincidem.';
  return e;
}

export function validateProfile(v: { name: string; phone: string }): FieldErrors {
  const e: FieldErrors = {};
  if (!v.name.trim()) e.name = 'Informe seu nome.';
  if (v.phone.trim() && v.phone.replace(/\D/g, '').length < 10) e.phone = 'Informe o telefone com DDD.';
  return e;
}

export interface DonationFormValues {
  name: string;
  categoryId: string;
  description: string;
  quantity: string;
  unit: string;
  condition: string;
  city: string;
  neighborhood: string;
}

export function validateDonation(v: DonationFormValues): FieldErrors {
  const e: FieldErrors = {};
  if (!v.name.trim()) e.name = 'Informe o nome do item.';
  if (!v.categoryId) e.categoryId = 'Escolha uma categoria.';
  if (!v.description.trim()) e.description = 'Descreva o item (marca, tamanho, detalhes).';
  const q = Number(v.quantity.replace(',', '.'));
  if (!v.quantity.trim()) e.quantity = 'Informe a quantidade.';
  else if (!Number.isFinite(q) || q <= 0) e.quantity = 'A quantidade deve ser maior que zero.';
  if (v.unit && !UNITS.includes(v.unit)) e.unit = 'Escolha uma unidade válida.';
  if (!CONDITIONS.some((c) => c.value === v.condition)) e.condition = 'Escolha o estado de conservação.';
  if (!v.city.trim()) e.city = 'Informe a cidade.';
  if (!v.neighborhood.trim()) e.neighborhood = 'Informe o bairro.';
  return e;
}

export const parseQuantity = (s: string) => Number(s.replace(',', '.'));
