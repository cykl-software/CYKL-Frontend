import { NavLink, Outlet } from 'react-router-dom';
import { Inbox, PackageOpen, Send, UserRound } from 'lucide-react';

const LINKS = [
  { to: '/conta/perfil', label: 'Meu perfil', Icon: UserRound },
  { to: '/conta/anuncios', label: 'Meus anúncios', Icon: PackageOpen },
  { to: '/conta/solicitacoes', label: 'Minhas solicitações', Icon: Send },
  { to: '/conta/recebidas', label: 'Solicitações recebidas', Icon: Inbox },
];

export default function UserAreaLayout() {
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[230px_1fr]">
      <nav aria-label="Minha conta" className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/conta/anuncios'}
            className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-700 text-white' : 'text-ink hover:bg-brand-50'}`}>
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}
