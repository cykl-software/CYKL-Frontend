import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { createRequest } from '../services/requests.service';
import { getDonation } from '../services/donations.service';
import { conditionLabel } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { formatQuantity } from '../components/items/DonationCard';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { FormTextarea } from '../components/ui/FormInput';

export default function ItemDetails() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: d, loading, error, reload } = useAsync(() => getDonation(id), [id]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <div className="container-page py-8"><Alert kind="error">{error}</Alert></div>;
  if (!d) {
    return <EmptyState title="Anúncio não encontrado" description="Ele pode ter sido removido pela pessoa que o publicou."
      action={<Link to="/catalogo" className="btn-primary">Voltar ao catálogo</Link>} />;
  }

  const isOwner = user?.id === d.donor_id;
  const available = d.status === 'disponivel';

  const startRequest = () => {
    if (!user) { navigate('/login', { state: { from: location.pathname } }); return; }
    setFormError(null); setOpen(true);
  };

  const submit = async () => {
    setBusy(true); setFormError(null);
    try { await createRequest(d.id, message.trim()); setOpen(false); setSent(true); setMessage(''); }
    catch (err) { setFormError(getErrorMessage(err)); reload(); }
    finally { setBusy(false); }
  };

  return (
    <div className="container-page py-6">
      <Link to="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"><ArrowLeft size={15} /> Voltar ao catálogo</Link>
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {d.image_url ? (
            <img src={d.image_url} alt={d.name} className="max-h-[480px] w-full object-cover" />
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-brand-50 text-brand-500"><Package size={64} aria-hidden="true" /></div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge kind="donation" status={d.status} />
              <span className="text-sm font-medium text-brand-700">{d.category?.name}</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{d.name}</h1>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-white p-4 text-sm">
            <div><dt className="text-xs text-ink-soft">Quantidade</dt><dd className="font-semibold">{formatQuantity(d.quantity, d.unit)}</dd></div>
            <div><dt className="text-xs text-ink-soft">Estado</dt><dd className="font-semibold">{conditionLabel(d.condition)}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-ink-soft">Local de retirada</dt>
              <dd className="flex items-center gap-1 font-semibold"><MapPin size={14} /> {d.neighborhood}, {d.city}</dd></div>
          </dl>

          <div>
            <h2 className="mb-1 text-base font-bold">Descrição</h2>
            <p className="whitespace-pre-line text-sm text-ink-soft">{d.description}</p>
          </div>

          {sent && (
            <Alert kind="success">
              Solicitação enviada. Acompanhe a resposta em <Link to="/conta/solicitacoes" className="font-semibold underline">Minhas solicitações</Link>.
            </Alert>
          )}

          {isOwner ? (
            <Alert kind="info">Este é o seu anúncio. <Link to="/conta/anuncios" className="font-semibold underline">Gerenciar meus anúncios</Link></Alert>
          ) : available ? (
            <button type="button" className="btn-primary w-full py-3 text-base" onClick={startRequest} disabled={sent}>Solicitar este item</button>
          ) : (
            <Alert kind="info">
              {d.status === 'reservado' && 'Este item já está reservado para outra pessoa.'}
              {d.status === 'indisponivel' && 'Este item está temporariamente indisponível.'}
              {d.status === 'concluido' && 'Esta doação já foi concluída.'}
            </Alert>
          )}
          <p className="text-xs text-ink-soft">Os dados de contato de quem doa só são liberados depois que a solicitação é aprovada.</p>
        </div>
      </div>

      {open && (
        <Modal title="Solicitar este item" onClose={() => (busy ? undefined : setOpen(false))}>
          <p className="mb-3 text-sm text-ink-soft">Você está pedindo o lote completo: {formatQuantity(d.quantity, d.unit)} de “{d.name}”.</p>
          {formError && <div className="mb-3"><Alert kind="error">{formError}</Alert></div>}
          <FormTextarea label="Mensagem para quem doa" hint="Conte brevemente por que você precisa do item." rows={3}
            value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>Voltar</button>
            <button type="button" className="btn-primary" onClick={submit} disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />} Enviar solicitação
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
