import { Link } from 'react-router-dom';

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" aria-label="CYKL, página inicial" className="inline-flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#f2b632' : '#145c46'} />
        <path d="M21 11a7 7 0 1 0 0 10" fill="none" stroke={light ? '#0b3a2d' : '#f2b632'} strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      <span className={`font-display text-2xl font-bold tracking-tight ${light ? 'text-white' : 'text-white'}`}>CYKL</span>
    </Link>
  );
}
