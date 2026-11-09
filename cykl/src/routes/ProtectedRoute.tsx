import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/ui/LoadingState';

export default function ProtectedRoute() {
  const { session, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <LoadingState />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
