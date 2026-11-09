import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  return <EmptyState title="Página não encontrada" description="O endereço pode estar errado ou a página foi movida."
    action={<Link to="/" className="btn-primary">Ir para a página inicial</Link>} />;
}
