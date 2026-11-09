# CYKL

Plataforma web que conecta pessoas por meio da doação de itens: quem tem algo para doar anuncia, quem precisa solicita, e o responsável pelo anúncio decide. MVP da disciplina Projeto Integração Social IV.

**Stack:** React + Vite + TypeScript · Tailwind CSS · Lucide React · Supabase (PostgreSQL, Auth, RLS, Storage) · Vercel.

## 1. Pré-requisitos

- Node.js 18+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor** e execute, **nesta ordem**, os arquivos de `supabase/migrations/`:
   1. `20261109000001_schema.sql`: tabelas, índices, triggers e categorias iniciais
   2. `20261109000002_security_and_functions.sql`: RLS, permissões por coluna e funções de negócio
   3. `20261109000003_storage.sql`: bucket `donation-images` para as fotos
   (Alternativa: `supabase db push`, se usar a CLI do Supabase.)
3. **Authentication → Providers → Email**: desative **Confirm email** (decisão do MVP: o acesso é imediato após o cadastro). Se preferir manter a confirmação, o cadastro continua funcionando e exibe um aviso pedindo a confirmação do e-mail.
4. **Project Settings → API**: copie a *Project URL* e a chave *anon public*.

## 3. Executar localmente

```bash
npm install
cp .env.example .env        # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                 # http://localhost:5173
```

Outros comandos: `npm run build` (checa tipos e gera `dist/`), `npm run typecheck`, `npm test`.

A chave `anon` é pública por projeto; a segurança vem das políticas RLS. **Nunca** coloque a chave `service_role` no frontend.

## 4. Publicar na Vercel

Importe o repositório, defina as duas variáveis `VITE_SUPABASE_*` e faça o deploy. O `vercel.json` já redireciona todas as rotas para `index.html`.

## 5. Estrutura

```
supabase/migrations/   schema, RLS, funções (RPC), storage
supabase/tests/        authorization.sql (regras e permissões) e concurrency.mjs
src/components/ui|layout|items|requests   componentes reutilizáveis
src/pages/             uma página por tela do Plano Técnico
src/services/          único ponto de acesso ao Supabase (as telas não consultam o banco direto)
src/contexts, hooks, routes, types, utils, lib
```

## 6. Modelagem

`users` (espelho de `auth.users`, mesmo UUID, criado por trigger) · `categories` · `donations` · `requests`, conforme o Plano Técnico. Acréscimos justificados: `updated_at` em `users`, e `donations.deleted_at` (exclusão lógica, para preservar o histórico, RN028).

Estados do anúncio: `disponivel`, `reservado`, `indisponivel`, `concluido`. Estados da solicitação: `pendente`, `aprovada`, `recusada`, `cancelada`, `concluida`.

## 7. Onde cada regra de negócio é garantida

| Regra | Garantia |
|---|---|
| Só dono edita o anúncio; só Disponível/Indisponível são editáveis | Política RLS `donations_update` |
| `status` e `deleted_at` não são graváveis pelo cliente | Permissões por coluna (`GRANT UPDATE (...)`) |
| Cliente não cria nem altera solicitações diretamente | Sem `INSERT/UPDATE/DELETE` em `requests`; tudo via RPC |
| Não solicitar o próprio anúncio / só item disponível / nasce Pendente | `create_request` |
| Solicitação ativa duplicada | Índice único parcial `requests_one_active_per_user` |
| Só o dono aprova/recusa; aprovação reserva o anúncio | `approve_request` / `reject_request` |
| Uma única aprovada por anúncio, sem condição de corrida | `SELECT ... FOR UPDATE` no anúncio + índice único `requests_one_approved_per_item` |
| Cancelar só pendente e só o solicitante | `cancel_request` |
| Confirmar recebimento conclui solicitação e anúncio | `confirm_receipt` |
| Contato só para as duas partes, só após a aprovação | `get_pickup_contact` |
| Excluir: bloqueado se reservado/concluído; histórico preservado | `delete_donation` (exclusão lógica) |
| Dados pessoais não públicos | `users` legível só pelo próprio usuário |

## 8. Decisões aprovadas (ambiguidades dos documentos)

- **Confirmação de recebimento é obrigatória** (a Especificação a marca como prioridade média, mas o fluxo e os critérios de aceite dependem dela).
- **Não há cancelamento de solicitação já aprovada** no MVP (não está definido nos documentos). Consequência: se quem recebeu nunca confirmar, o anúncio permanece reservado.
- **Outras solicitações pendentes não são alteradas** quando uma é aprovada: ficam pendentes, não podem ser aprovadas e o solicitante pode cancelá-las.
- **Exclusão lógica** de anúncios; anúncios reservados ou concluídos não podem ser excluídos.
- **Contato** (nome, e-mail, telefone, bairro/cidade) da outra parte é liberado só após a aprovação. Antes disso, quem doa vê apenas a mensagem e a data da solicitação, sem identificação da pessoa.
- Opções de **estado de conservação** e **unidades** são valores definidos pela equipe técnica (os documentos pedem opções predefinidas, mas não as listam).
- Telefone, cidade e bairro são opcionais no perfil; cidade e bairro são obrigatórios no anúncio e vêm pré-preenchidos do perfil.

## 9. Testes

| Teste | Como rodar | O que cobre |
|---|---|---|
| Unitários (Vitest) | `npm test` | Validação de formulários e tradução de erros |
| Autorização e regras (SQL) | Colar `supabase/tests/authorization.sql` no SQL Editor | 14 cenários: permissões por coluna, RLS, estados, privacidade, histórico. Roda em transação com `ROLLBACK` |
| Concorrência | `SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/concurrency.mjs` | Duas aprovações simultâneas no mesmo anúncio: só uma pode prevalecer |
| Interface | Checklist manual abaixo | Navegação, formulários, estados vazios, responsividade |

**Checklist manual:** visitante vê catálogo sem login · cadastro e login (credenciais corretas e erradas, e-mail repetido) · criar/editar/excluir anúncio · pesquisa por nome, categoria, cidade e bairro · catálogo vazio · solicitar item · tentar solicitar item próprio · aprovar/recusar · item reservado não aceita novos pedidos · cancelar pendente · confirmar recebimento · histórico · celular (≈375 px), tablet e desktop.

## 10. Escopo e limitações

Fora do MVP, conforme os documentos: venda, pagamento, chat, publicidade, avaliações e geolocalização.
Pendências conhecidas: liberação de reserva pelo responsável (não definida nos documentos); recusa automática das pendentes ao concluir uma doação; e-mails de notificação.
