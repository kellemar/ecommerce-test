import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { HomePage } from '../features/storefront/pages/HomePage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { CartPage } from '../features/cart/pages/CartPage';
import { CheckoutPage } from '../features/orders/pages/CheckoutPage';
import { OrdersPage } from '../features/orders/pages/OrdersPage';
import { RequireAuth } from './RequireAuth';

export const customerRoutes = [
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'cart',
        element: (
          <RequireAuth allowRole="customer">
            <CartPage />
          </RequireAuth>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireAuth allowRole="customer">
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth allowRole="customer">
            <OrdersPage />
          </RequireAuth>
        ),
      },
    ],
  },
];
