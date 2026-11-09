import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { isSupabaseConfigured } from '../../lib/supabase';
import Alert from '../ui/Alert';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!isSupabaseConfigured && (
        <div className="container-page mt-4">
          <Alert kind="error">
            Supabase não configurado. Copie <code>.env.example</code> para <code>.env</code>, preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> com os valores reais do seu projeto e reinicie o servidor (<code>npm run dev</code>).
          </Alert>
        </div>
      )}
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
