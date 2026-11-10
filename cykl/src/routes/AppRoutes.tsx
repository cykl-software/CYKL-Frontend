import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import UserAreaLayout from '../components/layout/UserAreaLayout';
import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home';
import Catalog from '../pages/Catalog';
import ItemDetails from '../pages/ItemDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import MyItems from '../pages/MyItems';
import ItemForm from '../pages/ItemForm';
import MyRequests from '../pages/MyRequests';
import ReceivedRequests from '../pages/ReceivedRequests';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="item/:id" element={<ItemDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Register />} />

        <Route path="conta" element={<ProtectedRoute />}>
          <Route element={<UserAreaLayout />}>
            <Route index element={<Navigate to="anuncios" replace />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="anuncios" element={<MyItems />} />
            <Route path="anuncios/novo" element={<ItemForm />} />
            <Route path="anuncios/:id/editar" element={<ItemForm />} />
            <Route path="solicitacoes" element={<MyRequests />} />
            <Route path="recebidas" element={<ReceivedRequests />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
