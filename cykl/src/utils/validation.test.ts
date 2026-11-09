import { describe, expect, it } from 'vitest';
import { parseQuantity, validateDonation, validateLogin, validateRegister } from './validation';
import { getErrorMessage } from './errors';

const validDonation = {
  name: 'Sofá', categoryId: 'c1', description: 'Bom estado', quantity: '1', unit: '',
  condition: 'bom', city: 'Recife', neighborhood: 'Boa Viagem',
};

describe('validateRegister', () => {
  it('aceita dados válidos', () => {
    expect(validateRegister({ name: 'Ana', email: 'ana@x.com', password: '12345678', confirm: '12345678' })).toEqual({});
  });
  it('rejeita e-mail inválido, senha curta e confirmação diferente', () => {
    const e = validateRegister({ name: '', email: 'x', password: '123', confirm: '1' });
    expect(Object.keys(e).sort()).toEqual(['confirm', 'email', 'name', 'password']);
  });
});

describe('validateLogin', () => {
  it('exige e-mail e senha', () => {
    expect(Object.keys(validateLogin({ email: '', password: '' }))).toEqual(['email', 'password']);
  });
});

describe('validateDonation', () => {
  it('aceita um anúncio completo', () => expect(validateDonation(validDonation)).toEqual({}));
  it('exige campos obrigatórios', () => {
    const e = validateDonation({ ...validDonation, name: '', categoryId: '', city: '', neighborhood: '', description: '' });
    expect(Object.keys(e).sort()).toEqual(['categoryId', 'city', 'description', 'name', 'neighborhood']);
  });
  it('rejeita quantidade zero, negativa ou não numérica', () => {
    for (const q of ['0', '-2', 'abc', '']) expect(validateDonation({ ...validDonation, quantity: q }).quantity).toBeTruthy();
  });
  it('aceita vírgula decimal', () => {
    expect(validateDonation({ ...validDonation, quantity: '2,5' })).toEqual({});
    expect(parseQuantity('2,5')).toBe(2.5);
  });
});

describe('getErrorMessage', () => {
  it('traduz códigos do banco', () => {
    expect(getErrorMessage({ message: 'own_item' })).toMatch(/próprio anúncio/);
    expect(getErrorMessage({ message: 'item_unavailable' })).toMatch(/não está mais disponível/);
  });
  it('usa mensagem genérica para erros desconhecidos', () => {
    expect(getErrorMessage({ message: 'xyz' })).toMatch(/Algo deu errado/);
  });
});
