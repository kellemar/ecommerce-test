import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminProductList } from '../features/products/pages/AdminProductList';
import { AdminOrderList } from '../features/orders/pages/AdminOrderList';
import { AdminUserList } from '../features/users/pages/AdminUserList';
import { RequireAuth } from './RequireAuth';

export const adminRoutes = [
  {
    path: '/admin',
    element: (
      <RequireAuth allowRole="admin">
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'products',
        element: <AdminProductList />,
      },
      {
        path: 'orders',
        element: <AdminOrderList />,
      },
      {
        path: 'users',
        element: <AdminUserList />,
      },
    ],
  },
];
