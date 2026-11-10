// Traduz códigos das funções do banco e erros do Supabase Auth em mensagens compreensíveis.
const MESSAGES: Record<string, string> = {
  not_authenticated: 'Entre na sua conta para continuar.',
  item_not_found: 'Este anúncio não existe mais.',
  request_not_found: 'Esta solicitação não foi encontrada.',
  own_item: 'Você não pode solicitar o seu próprio anúncio.',
  item_unavailable: 'Este item não está mais disponível para solicitações.',
  duplicate_request: 'Você já tem uma solicitação ativa para este item.',
  forbidden: 'Você não tem permissão para esta ação.',
  invalid_request_state: 'Esta solicitação não está mais no estado necessário para essa ação. Atualize a página.',
  cannot_delete: 'Anúncios reservados ou concluídos não podem ser excluídos.',
  item_locked: 'Anúncios reservados ou concluídos não podem ser alterados.',
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
};

export function getErrorMessage(err: unknown): string {
  const raw =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (MESSAGES[raw]) return MESSAGES[raw];
  if (code === '23505') return 'Já existe um registro igual a este.';
  if (/failed to fetch|networkerror/i.test(raw)) return 'Não foi possível conectar ao servidor. Verifique sua internet.';
  if (/password should be at least/i.test(raw)) return 'A senha é curta demais.';
  return 'Algo deu errado. Tente novamente em instantes.';
}
