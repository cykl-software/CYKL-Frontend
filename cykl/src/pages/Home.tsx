import { Link, useNavigate } from 'react-router-dom';
import { Search, HandHeart, MessageSquareText, PackageCheck, Plus } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useCategories } from '../hooks/useCategories';
import { listCatalog } from '../services/donations.service';
import SearchBar from '../components/items/SearchBar';
import CategoryCard from '../components/items/CategoryCard';
import DonationGrid from '../components/items/DonationGrid';
import { EMPTY_FILTERS } from '../components/items/FilterPanel';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

const STEPS = [
  { Icon: Plus, title: 'Anuncie', text: 'Cadastre o item que você não usa mais, com foto, estado e bairro.' },
  { Icon: Search, title: 'Encontre', text: 'Pesquise no catálogo por nome, categoria ou local, sem precisar de conta.' },
  { Icon: MessageSquareText, title: 'Solicite', text: 'Quem precisa pede o item. Quem doa escolhe a solicitação que aprova.' },
  { Icon: PackageCheck, title: 'Retire', text: 'Com a aprovação, as duas partes combinam a retirada e quem recebeu confirma.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const recent = useAsync(() => listCatalog(EMPTY_FILTERS, 8), []);

  return (
    <>
      <section className="bg-brand-900 text-white">
        <div className="container-page py-12 sm:py-16">
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.05] sm:text-5xl">
            O que sobra na sua casa pode estar faltando na casa de alguém.
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Móveis, materiais de obra, roupas e eletrodomésticos circulam de graça entre vizinhos. Você doa, outra pessoa recebe, o item segue em uso.
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBar onSearch={(t) => navigate(t ? `/catalogo?q=${encodeURIComponent(t)}` : '/catalogo')} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/conta/anuncios/novo" className="btn-honey"><HandHeart size={17} /> Quero doar um item</Link>
            <Link to="/catalogo" className="btn border border-brand-500 text-white hover:bg-brand-800">Ver o que está disponível</Link>
          </div>
        </div>
      </section>

      <section className="container-page mt-10" aria-labelledby="cats">
        <h2 id="cats" className="mb-4 text-2xl font-bold">Navegue por categoria</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </section>

      <section className="container-page mt-12" aria-labelledby="recent">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recent" className="text-2xl font-bold">Doações recentes</h2>
          <Link to="/catalogo" className="text-sm font-semibold text-brand-700 hover:underline">Ver catálogo completo</Link>
        </div>
        {recent.loading ? <LoadingState /> : recent.error ? <Alert kind="error">{recent.error}</Alert> :
          (recent.data ?? []).length === 0 ? (
            <EmptyState title="Ainda não há itens disponíveis" description="Seja a primeira pessoa a anunciar uma doação."
              action={<Link to="/conta/anuncios/novo" className="btn-primary">Anunciar um item</Link>} />
          ) : <DonationGrid donations={recent.data ?? []} />}
      </section>

      <section className="container-page mt-14" aria-labelledby="how">
        <h2 id="how" className="mb-5 text-2xl font-bold">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-xl border border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-honey-300 text-ink"><Icon size={20} /></span>
                <span className="text-sm font-semibold text-ink-soft">Passo {i + 1}</span>
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
