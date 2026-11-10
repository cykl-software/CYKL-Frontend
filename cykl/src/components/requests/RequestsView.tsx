import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Inbox, MapPin, Package, Phone, Send, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  approveRequest, cancelRequest, confirmReceipt, getPickupContact, listMyRequests, listReceivedRequests, rejectRequest,
} from '../../services/requests.service';
import type { DonationRequest, PickupContact, RequestStatus } from '../../types';
import { getErrorMessage } from '../../utils/errors';
import Alert from '../ui/Alert';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { formatQuantity } from '../items/DonationCard';

type Mode = 'mine' | 'received';
type Tab = 'todas' | 'pendente' | 'aprovada' | 'historico';
type ActionKey = 'approve' | 'reject' | 'cancel' | 'confirm';

const TABS: { key: Tab; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'aprovada', label: 'Aprovadas' },
  { key: 'historico', label: 'Histórico' },
];
const HISTORY: RequestStatus[] = ['concluida', 'recusada', 'cancelada'];

const ACTIONS: Record<ActionKey, { title: string; message: string; label: string; danger?: boolean; run: (id: string) => Promise<void> }> = {
  approve: { title: 'Aprovar solicitação', message: 'O anúncio ficará reservado para esta pessoa e as informações de contato serão liberadas para as duas partes.', label: 'Aprovar', run: approveRequest },
  reject: { title: 'Recusar solicitação', message: 'A solicitação será recusada e permanecerá no histórico.', label: 'Recusar', danger: true, run: rejectRequest },
  cancel: { title: 'Cancelar solicitação', message: 'Você poderá solicitar este item novamente enquanto ele estiver disponível.', label: 'Cancelar solicitação', danger: true, run: cancelRequest },
  confirm: { title: 'Confirmar recebimento', message: 'Confirme apenas se você já recebeu o item. A doação será concluída e o anúncio encerrado.', label: 'Confirmar recebimento', run: confirmReceipt },
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export default function RequestsView({ mode }: { mode: Mode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data, loading, error, reload } = useAsync(
    () => (mode === 'mine' ? listMyRequests(userId) : listReceivedRequests(userId)), [mode, userId],
  );
  const [tab, setTab] = useState<Tab>('todas');
  const [pending, setPending] = useState<{ key: ActionKey; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [contactFor, setContactFor] = useState<string | null>(null);

  const all = data ?? [];
  const visible = all.filter((r) =>
    tab === 'todas' ? true : tab === 'historico' ? HISTORY.includes(r.status) : r.status === tab);

  const runAction = async () => {
    if (!pending) return;
    setBusy(true); setActionError(null);
    try { await ACTIONS[pending.key].run(pending.id); setPending(null); reload(); }
    catch (err) { setPending(null); setActionError(getErrorMessage(err)); reload(); }
    finally { setBusy(false); }
  };

  const title = mode === 'mine' ? 'Minhas solicitações' : 'Solicitações recebidas';
  const subtitle = mode === 'mine' ? 'Acompanhe os itens que você pediu.' : 'Decida quem recebe os itens que você anunciou.';

  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>

      <div role="tablist" aria-label="Filtrar por situação" className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-brand-700 text-brand-800' : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {actionError && <div className="mt-4"><Alert kind="error">{actionError}</Alert></div>}
      {loading && !data ? <LoadingState /> : error ? (
        <div className="mt-4"><Alert kind="error">{error}</Alert></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={mode === 'mine' ? <Send size={36} /> : <Inbox size={36} />}
          title={all.length === 0 ? (mode === 'mine' ? 'Você ainda não fez solicitações' : 'Nenhuma solicitação recebida ainda') : 'Nada nesta aba'}
          description={all.length === 0
            ? (mode === 'mine' ? 'Encontre um item no catálogo e peça para recebê-lo.' : 'Quando alguém pedir um dos seus itens, a solicitação aparece aqui.')
            : 'Troque de aba para ver as outras solicitações.'}
          action={all.length === 0 && mode === 'mine' ? <Link to="/catalogo" className="btn-primary">Ver catálogo</Link> : undefined}
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((r) => (
            <RequestRow key={r.id} r={r} mode={mode}
              onAction={(key) => { setActionError(null); setPending({ key, id: r.id }); }}
              onContact={() => setContactFor(r.id)} />
          ))}
        </ul>
      )}

      {pending && (
        <ConfirmDialog title={ACTIONS[pending.key].title} message={ACTIONS[pending.key].message}
          confirmLabel={ACTIONS[pending.key].label} danger={ACTIONS[pending.key].danger}
          busy={busy} onConfirm={runAction} onCancel={() => setPending(null)} />
      )}
      {contactFor && <ContactModal requestId={contactFor} onClose={() => setContactFor(null)} />}
    </div>
  );
}

function RequestRow({ r, mode, onAction, onContact }: {
  r: DonationRequest; mode: Mode; onAction: (k: ActionKey) => void; onContact: () => void;
}) {
  const d = r.donation;
  const removed = Boolean(d.deleted_at);
  const canApprove = r.status === 'pendente' && d.status === 'disponivel' && !removed;
  return (
    <li className="flex gap-3 rounded-xl border border-line bg-white p-3.5 sm:gap-4 sm:p-4">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 text-brand-500 sm:h-24 sm:w-24">
        {d.image_url ? <img src={d.image_url} alt="" className="h-full w-full object-cover" /> : <Package size={28} aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="request" status={r.status} />
          {removed && <span className="text-xs font-medium text-red-700">Anúncio removido</span>}
          <span className="text-xs text-ink-soft">{fmtDate(r.created_at)}</span>
        </div>
        <h2 className="mt-1 truncate font-sans text-base font-semibold">
          {removed ? d.name : <Link to={`/item/${d.id}`} className="hover:text-brand-700 hover:underline">{d.name}</Link>}
        </h2>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-ink-soft">
          <span>{formatQuantity(d.quantity, d.unit)}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {d.neighborhood}, {d.city}</span>
        </p>
        {r.message && <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">“{r.message}”</p>}
        {mode === 'received' && r.status === 'pendente' && !canApprove && !removed && (
          <p className="mt-1.5 text-xs text-ink-soft">O item não está disponível, então esta solicitação não pode ser aprovada agora.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {mode === 'received' && r.status === 'pendente' && (
            <>
              <button type="button" className="btn-primary !py-1.5" disabled={!canApprove} onClick={() => onAction('approve')}><Check size={15} /> Aprovar</button>
              <button type="button" className="btn-danger !py-1.5" onClick={() => onAction('reject')}><X size={15} /> Recusar</button>
            </>
          )}
          {mode === 'mine' && r.status === 'pendente' && (
            <button type="button" className="btn-danger !py-1.5" onClick={() => onAction('cancel')}>Cancelar solicitação</button>
          )}
          {mode === 'mine' && r.status === 'aprovada' && (
            <button type="button" className="btn-honey !py-1.5" onClick={() => onAction('confirm')}><Check size={15} /> Confirmar recebimento</button>
          )}
          {(r.status === 'aprovada' || r.status === 'concluida') && (
            <button type="button" className="btn-outline !py-1.5" onClick={onContact}><Phone size={15} /> Ver contato para retirada</button>
          )}
        </div>
      </div>
    </li>
  );
}

function ContactModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, loading, error } = useAsync<PickupContact>(() => getPickupContact(requestId), [requestId]);
  return (
    <Modal title="Contato para a retirada" onClose={onClose}>
      {loading ? <LoadingState /> : error ? <Alert kind="error">{error}</Alert> : data && (
        <div className="space-y-3 text-sm">
          <p className="text-ink-soft">Combinem a retirada diretamente. O CYKL não faz entrega nem transporte.</p>
          <dl className="space-y-2 rounded-lg bg-paper p-3">
            <div><dt className="text-xs text-ink-soft">Nome</dt><dd className="font-semibold">{data.name}</dd></div>
            <div><dt className="text-xs text-ink-soft">E-mail</dt><dd><a className="font-semibold text-brand-700 underline" href={`mailto:${data.email}`}>{data.email}</a></dd></div>
            <div><dt className="text-xs text-ink-soft">Telefone</dt><dd className="font-semibold">{data.phone ?? 'Não informado'}</dd></div>
            {(data.neighborhood || data.city) && (
              <div><dt className="text-xs text-ink-soft">Localização</dt><dd className="font-semibold">{[data.neighborhood, data.city].filter(Boolean).join(', ')}</dd></div>
            )}
          </dl>
          <button type="button" className="btn-outline w-full" onClick={onClose}>Fechar</button>
        </div>
      )}
    </Modal>
  );
}

