import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useCategories } from '../hooks/useCategories';
import { listCatalog } from '../services/donations.service';
import type { CatalogFilters } from '../types';
import DonationGrid from '../components/items/DonationGrid';
import FilterPanel, { EMPTY_FILTERS } from '../components/items/FilterPanel';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const { categories } = useCategories();

  const filters = useMemo<CatalogFilters>(() => ({
    search: params.get('q') ?? '',
    categoryId: params.get('categoria') ?? '',
    city: params.get('cidade') ?? '',
    neighborhood: params.get('bairro') ?? '',
    onlyAvailable: params.get('todos') !== '1',
  }), [params]);

  const applyFilters = (f: CatalogFilters) => {
    const next = new URLSearchParams();
    if (f.search) next.set('q', f.search);
    if (f.categoryId) next.set('categoria', f.categoryId);
    if (f.city.trim()) next.set('cidade', f.city.trim());
    if (f.neighborhood.trim()) next.set('bairro', f.neighborhood.trim());
    if (!f.onlyAvailable) next.set('todos', '1');
    setParams(next);
  };

  const { data, loading, error } = useAsync(
    () => listCatalog(filters),
    [filters.search, filters.categoryId, filters.city, filters.neighborhood, filters.onlyAvailable],
  );
  const hasFilters = Boolean(filters.search || filters.categoryId || filters.city || filters.neighborhood);

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[260px_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <FilterPanel categories={categories} filters={filters} onChange={applyFilters} />
      </div>
      <section aria-live="polite">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{filters.search ? `Resultados para “${filters.search}”` : 'Catálogo de doações'}</h1>
          {!loading && !error && data && (
            <p className="mt-1 text-sm text-ink-soft">{data.length === 1 ? '1 item encontrado' : `${data.length} itens encontrados`}</p>
          )}
        </div>
        {loading ? <LoadingState label="Buscando doações…" /> : error ? <Alert kind="error">{error}</Alert> :
          (data ?? []).length === 0 ? (
            <EmptyState icon={<SearchX size={36} />}
              title={hasFilters ? 'Nenhum item encontrado' : 'Ainda não há itens no catálogo'}
              description={hasFilters ? 'Tente outro nome, remova algum filtro ou inclua itens que não estão disponíveis.' : 'Quando alguém anunciar uma doação, ela aparece aqui.'}
              action={hasFilters ? <button type="button" className="btn-outline" onClick={() => applyFilters(EMPTY_FILTERS)}>Limpar filtros</button> : undefined} />
          ) : <DonationGrid donations={data ?? []} />}
      </section>
    </div>
  );
}
