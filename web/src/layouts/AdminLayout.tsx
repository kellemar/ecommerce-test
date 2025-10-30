import { Sidebar } from 'flowbite-react';
import { HiChartPie, HiCollection, HiShoppingCart, HiUsers } from 'react-icons/hi';
import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { LogoutButton } from '../features/auth/components/LogoutButton';

export function AdminLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar aria-label="Admin navigation" className="w-64">
          <Sidebar.Items>
            <Sidebar.ItemGroup>
              <Sidebar.Item as={Link} to="/admin" icon={HiChartPie}>
                Dashboard
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/admin/products" icon={HiCollection}>
                Products
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/admin/orders" icon={HiShoppingCart}>
                Orders
              </Sidebar.Item>
              <Sidebar.Item as={Link} to="/admin/users" icon={HiUsers}>
                Users
              </Sidebar.Item>
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </Sidebar>
        <main className="flex-1 p-8">
          <header className="mb-6 flex items-center justify-end gap-4">
            {user ? <span className="text-sm text-slate-500">Signed in as {user.email}</span> : null}
            <LogoutButton size="sm" />
          </header>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
