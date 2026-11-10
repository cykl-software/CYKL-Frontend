import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';

interface Props { value?: string; onSearch: (term: string) => void; placeholder?: string }

export default function SearchBar({ value = '', onSearch, placeholder = 'Busque por sofá, tijolo, cobertor…' }: Props) {
  const [text, setText] = useState(value);
  const id = useId();
  useEffect(() => setText(value), [value]);

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(text.trim()); }} className="flex w-full overflow-hidden rounded-lg bg-white shadow-sm">
      <label htmlFor={id} className="sr-only">Buscar doações pelo nome do item</label>
      <input id={id} type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none" />
      <button type="submit" aria-label="Buscar" className="flex items-center gap-1.5 bg-honey-400 px-4 text-sm font-semibold text-ink hover:bg-honey-300">
        <Search size={18} /> <span className="hidden sm:inline">Buscar</span>
      </button>
    </form>
  );
}
