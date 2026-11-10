import { Link } from 'react-router-dom';
import { Armchair, BedDouble, Hammer, Package, Plug, Shirt, type LucideIcon } from 'lucide-react';
import type { Category } from '../../types';

const ICONS: Record<string, LucideIcon> = {
  'Materiais de construção': Hammer,
  'Móveis': Armchair,
  'Eletrodomésticos': Plug,
  'Roupas e calçados': Shirt,
  'Cobertores e itens de cama, mesa e banho': BedDouble,
};

export default function CategoryCard({ category }: { category: Category }) {
  const Icon = ICONS[category.name] ?? Package;
  return (
    <Link to={`/catalogo?categoria=${category.id}`}
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-brand-500 hover:bg-brand-50">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon size={22} /></span>
      <span className="text-sm font-semibold leading-snug">{category.name}</span>
    </Link>
  );
}
