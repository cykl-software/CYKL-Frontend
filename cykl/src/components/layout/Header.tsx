import { useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, Menu, Plus, UserRound, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../items/SearchBar';
import Logo from './Logo';

export default function Header() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);

  const handleSearch = (term: string) => {
    setOpen(false);
    navigate(term ? `/catalogo?q=${encodeURIComponent(term)}` : '/catalogo');
  };
  const handleSignOut = async () => { setOpen(false); await signOut(); navigate('/'); };

  const firstName = profile?.name.split(' ')[0];

  return (
    <header className="sticky top-0 z-40 bg-brand-700 shadow-sm">
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Logo />
        <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
          <SearchBar value={params.get('q') ?? ''} onSearch={handleSearch} />
        </div>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-2 lg:flex">
          <NavLink to="/catalogo" className="rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">Catálogo</NavLink>
          {session ? (
            <>
              <NavLink to="/conta/perfil" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">
                <UserRound size={16} /> {firstName ?? 'Minha conta'}
              </NavLink>
              <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">
                <LogOut size={16} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">Entrar</Link>
              <Link to="/cadastro" className="rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">Cadastrar</Link>
            </>
          )}
          <Link to="/conta/anuncios/novo" className="btn-honey"><Plus size={16} /> Doar um item</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link to="/conta/anuncios/novo" className="btn-honey !px-3 !py-2"><Plus size={16} /> Doar</Link>
          <button type="button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-white hover:bg-brand-800">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Menu" className="border-t border-brand-600 bg-brand-800 lg:hidden">
          <ul className="container-page flex flex-col py-2 text-sm font-medium text-white">
            <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/catalogo">Catálogo</Link></li>
            {session ? (
              <>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/conta/anuncios">Meus anúncios</Link></li>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/conta/solicitacoes">Minhas solicitações</Link></li>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/conta/recebidas">Solicitações recebidas</Link></li>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/conta/perfil">Meu perfil</Link></li>
                <li><button type="button" onClick={handleSignOut} className="block w-full py-2.5 text-left">Sair</button></li>
              </>
            ) : (
              <>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/login">Entrar</Link></li>
                <li><Link onClick={() => setOpen(false)} className="block py-2.5" to="/cadastro">Cadastrar</Link></li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
