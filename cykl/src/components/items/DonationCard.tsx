import { Link } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';
import type { Donation } from '../../types';
import { conditionLabel } from '../../utils/constants';
import StatusBadge from '../ui/StatusBadge';

export const formatQuantity = (q: number, unit: string | null) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(q)}${unit ? ` ${unit}` : ''}`;

export default function DonationCard({ donation: d }: { donation: Donation }) {
  const inactive = d.status !== 'disponivel';
  return (
    <Link to={`/item/${d.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-brand-50">
        {d.image_url ? (
          <img src={d.image_url} alt={d.name} loading="lazy" className={`h-full w-full object-cover ${inactive ? 'opacity-60' : ''}`} />
        ) : (
          <div className="grid h-full place-items-center text-brand-500"><Package size={40} aria-hidden="true" /></div>
        )}
        <div className="absolute left-2 top-2"><StatusBadge kind="donation" status={d.status} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-xs font-medium text-brand-700">{d.category?.name ?? 'Sem categoria'}</p>
        <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug group-hover:text-brand-700">{d.name}</h3>
        <p className="text-sm font-semibold">{formatQuantity(d.quantity, d.unit)}</p>
        <p className="text-xs text-ink-soft">{conditionLabel(d.condition)}</p>
        <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-ink-soft"><MapPin size={13} /> {d.neighborhood}, {d.city}</p>
      </div>
    </Link>
  );
}
