import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { deleteDonation, listMyDonations, setAvailability } from '../services/donations.service';
import type { Donation } from '../types';
import { getErrorMessage } from '../utils/errors';
import { formatQuantity } from '../components/items/DonationCard';
import Alert from '../components/ui/Alert';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';

export default function MyItems() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data, loading, error, reload } = useAsync(() => listMyDonations(userId), [userId]);
  const [toDelete, setToDelete] = useState<Donation | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggle = async (d: Donation) => {
    setActionError(null);
    try { await setAvailability(d.id, d.status === 'indisponivel'); } catch (err) { setActionError(getErrorMessage(err)); }
    reload();
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true); setActionError(null);
    try { await deleteDonation(toDelete.id); } catch (err) { setActionError(getErrorMessage(err)); }
    setBusy(false); setToDelete(null); reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meus anúncios</h1>
          <p className="mt-1 text-sm text-ink-soft">Itens que você disponibilizou para doação.</p>
        </div>
        <Link to="/conta/anuncios/novo" className="btn-honey"><Plus size={16} /> Novo anúncio</Link>
      </div>

      {actionError && <div className="mt-4"><Alert kind="error">{actionError}</Alert></div>}
      {loading && !data ? <LoadingState /> : error ? <div className="mt-4"><Alert kind="error">{error}</Alert></div> :
        (data ?? []).length === 0 ? (
          <EmptyState title="Você ainda não anunciou nenhum item" description="Cadastre algo que você não usa mais e ajude outra pessoa."
            action={<Link to="/conta/anuncios/novo" className="btn-primary">Anunciar um item</Link>} />
        ) : (
          <ul className="mt-5 space-y-3">
            {(data ?? []).map((d) => {
              const editable = d.status === 'disponivel' || d.status === 'indisponivel';
              return (
                <li key={d.id} className="flex gap-3 rounded-xl border border-line bg-white p-3.5 sm:gap-4 sm:p-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 text-brand-500 sm:h-24 sm:w-24">
                    {d.image_url ? <img src={d.image_url} alt="" className="h-full w-full object-cover" /> : <Package size={28} aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <StatusBadge kind="donation" status={d.status} />
                    <h2 className="mt-1 truncate font-sans text-base font-semibold"><Link className="hover:text-brand-700 hover:underline" to={`/item/${d.id}`}>{d.name}</Link></h2>
                    <p className="text-xs text-ink-soft">{d.category?.name} · {formatQuantity(d.quantity, d.unit)} · {d.neighborhood}, {d.city}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {editable && <Link to={`/conta/anuncios/${d.id}/editar`} className="btn-outline !py-1.5"><Pencil size={14} /> Editar</Link>}
                      {editable && (
                        <button type="button" className="btn-outline !py-1.5" onClick={() => toggle(d)}>
                          {d.status === 'disponivel' ? <><EyeOff size={14} /> Marcar indisponível</> : <><Eye size={14} /> Marcar disponível</>}
                        </button>
                      )}
                      {d.status === 'reservado' && <Link to="/conta/recebidas" className="btn-outline !py-1.5">Ver solicitação aprovada</Link>}
                      {(d.status === 'disponivel' || d.status === 'indisponivel') && (
                        <button type="button" className="btn-danger !py-1.5" onClick={() => setToDelete(d)}><Trash2 size={14} /> Excluir</button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

      {toDelete && (
        <ConfirmDialog title="Excluir anúncio" danger busy={busy} confirmLabel="Excluir"
          message={`“${toDelete.name}” deixará de aparecer no catálogo. As solicitações já feitas continuam no histórico de quem as fez.`}
          onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
      )}
    </div>
  );
}
