import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { CatalogFilters, Category } from '../../types';
import { FormInput, FormSelect } from '../ui/FormInput';

interface Props { categories: Category[]; filters: CatalogFilters; onChange: (f: CatalogFilters) => void }

export const EMPTY_FILTERS: CatalogFilters = { search: '', categoryId: '', city: '', neighborhood: '', onlyAvailable: true };

export default function FilterPanel({ categories, filters, onChange }: Props) {
  const [draft, setDraft] = useState(filters);
  const [open, setOpen] = useState(false);
  useEffect(() => setDraft(filters), [filters]);

  return (
    <aside aria-label="Filtros" className="rounded-xl border border-line bg-white p-4">
      <button type="button" className="flex w-full items-center justify-between font-display text-base font-bold lg:cursor-default"
        onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="flex items-center gap-2"><SlidersHorizontal size={17} /> Filtros</span>
        <span className="text-xs font-medium text-brand-700 lg:hidden">{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>
      <form className={`${open ? 'mt-4 block' : 'hidden'} space-y-4 lg:mt-4 lg:block`}
        onSubmit={(e) => { e.preventDefault(); onChange({ ...draft, search: filters.search }); }}>
        <FormSelect label="Categoria" required={false} value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FormSelect>
        <FormInput label="Cidade" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Ex.: Recife" />
        <FormInput label="Bairro" value={draft.neighborhood} onChange={(e) => setDraft({ ...draft, neighborhood: e.target.value })} placeholder="Ex.: Boa Viagem" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={draft.onlyAvailable}
            onChange={(e) => setDraft({ ...draft, onlyAvailable: e.target.checked })} />
          Mostrar só itens disponíveis
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">Aplicar</button>
          <button type="button" className="btn-outline" onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}>Limpar</button>
        </div>
      </form>
    </aside>
  );
}
