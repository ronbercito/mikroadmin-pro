import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Routers from './pages/Routers';
import RouterEdit from './pages/RouterEdit';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Ajustes from './pages/Ajustes';
import Networks from './pages/Networks'; // Importación añadida
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/routers" element={<Routers />} />
          <Route path="/routers/:id/edit" element={<RouterEdit />} />
          <Route path="/gestion/redes-ipv4" element={<Networks />} /> {/* Ruta registrada */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Placeholder />} />
        </Route>
      </Route>
    </Routes>
  );
}
