import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-brand-200">
            Plataforma que aproxima quem tem itens em bom uso de quem precisa deles. Sem venda, sem pagamento: só doação.
          </p>
        </div>
        <nav aria-label="Navegação do rodapé" className="text-sm">
          <h2 className="mb-2 font-display text-base font-bold text-white">Navegue</h2>
          <ul className="space-y-1.5">
            <li><Link className="hover:underline" to="/catalogo">Catálogo de doações</Link></li>
            <li><Link className="hover:underline" to="/conta/anuncios/novo">Doar um item</Link></li>
            <li><Link className="hover:underline" to="/conta/solicitacoes">Minhas solicitações</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <h2 className="mb-2 font-display text-base font-bold text-white">Sobre o projeto</h2>
          <p className="text-brand-200">
            Projeto de extensão da disciplina Projeto Integração Social IV. A retirada e o transporte dos itens são combinados diretamente entre as pessoas.
          </p>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-200">© {new Date().getFullYear()} CYKL</div>
    </footer>
  );
}
