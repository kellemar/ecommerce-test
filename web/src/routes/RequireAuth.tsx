import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../features/auth/types';
import { useAuthStore } from '../features/auth/stores/auth.store';

interface RequireAuthProps {
  allowRole?: UserRole | UserRole[];
}

export function RequireAuth({ allowRole, children }: PropsWithChildren<RequireAuthProps>) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowRole) {
    const allowed = Array.isArray(allowRole) ? allowRole : [allowRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
