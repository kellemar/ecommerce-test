import { createBrowserRouter } from 'react-router-dom';
import { NotFound } from '../components/NotFound';
import { adminRoutes } from './admin.routes';
import { customerRoutes } from './customer.routes';

export const router = createBrowserRouter([
  ...customerRoutes,
  ...adminRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]);
