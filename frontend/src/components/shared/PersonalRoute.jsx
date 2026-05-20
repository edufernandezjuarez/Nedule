import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PersonalRoute() {
  const { canAccessPersonal } = useAuth();

  if (!canAccessPersonal) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
