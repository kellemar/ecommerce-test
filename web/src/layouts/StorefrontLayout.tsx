import { Button, Navbar } from 'flowbite-react';
import { Link, Outlet } from 'react-router-dom';
import { LogoutButton } from '../features/auth/components/LogoutButton';
import { useAuthStore } from '../features/auth/stores/auth.store';

export function StorefrontLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar className="border-b border-slate-200" fluid rounded>
        <Navbar.Brand as={Link} to="/">
          <span className="self-center whitespace-nowrap text-xl font-semibold">Mandai Wildlife Store</span>
        </Navbar.Brand>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' ? (
            <Button as={Link} to="/admin" color="light">
              Admin
            </Button>
          ) : null}
          {user?.role === 'customer' ? (
            <>
              <Button as={Link} to="/cart" color="light">
                Cart
              </Button>
              <Button as={Link} to="/orders" color="light">
                Orders
              </Button>
            </>
          ) : null}
          {user ? (
            <LogoutButton size="sm" />
          ) : (
            <>
              <Button as={Link} to="/login" color="light">
                Sign in
              </Button>
              <Button as={Link} to="/register">
                Create account
              </Button>
            </>
          )}
        </div>
      </Navbar>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} Mandai Wildlife — All rights reserved.
      </footer>
    </div>
  );
}
