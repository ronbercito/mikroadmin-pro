import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}