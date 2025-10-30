import { useQuery } from '@tanstack/react-query';
import { Badge, Card } from 'flowbite-react';
import api from '../../../lib/api-client';

interface OrderCustomer {
  id: number;
  email: string;
}

interface RecentOrder {
  id: number;
  totalCents: number;
  status: string;
  paymentReference?: string | null;
  createdAt?: string;
  created_at?: string;
  user?: OrderCustomer;
}

interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  stockQty: number;
  status: string;
}

interface ProductListResponse {
  items: ProductSummary[];
  count: number;
}

export function AdminDashboard() {
  const { data: recentOrder, isLoading: orderLoading } = useQuery<RecentOrder[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await api.get<RecentOrder[]>('/orders');
      return response.data;
    },
    select: (orders) => {
      // Sort by creation date and take the most recent
      return orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 1);
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<ProductListResponse>({
    queryKey: ['products-summary'],
    queryFn: async () => {
      const response = await api.get<ProductListResponse>('/products');
      return response.data;
    },
  });

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'fulfilled':
        return 'info';
      case 'cancelled':
        return 'failure';
      default:
        return 'gray';
    }
  };

  const products = productsData?.items || [];
  const publishedProducts = products.filter(p => p.status === 'published');
  const lowStockProducts = publishedProducts.filter(p => p.stockQty < 10);
  const totalInventoryValue = publishedProducts.reduce((sum, p) => sum + (p.priceCents * p.stockQty), 0);

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <h2 className="text-sm font-semibold uppercase text-slate-500">Recent Order</h2>
        {orderLoading ? (
          <p className="mt-2 text-slate-500">Loading...</p>
        ) : recentOrder && recentOrder[0] ? (
          <>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              #{recentOrder[0].id.toString().padStart(4, '0')}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {recentOrder[0].user?.email ?? 'Unknown customer'}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold">
                ${(recentOrder[0].totalCents / 100).toFixed(2)}
              </span>
              <Badge color={getStatusColor(recentOrder[0].status)} className="capitalize">
                {recentOrder[0].status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Placed {formatDate(recentOrder[0].createdAt ?? recentOrder[0].created_at)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-slate-500">No orders yet</p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase text-slate-500">Available Products</h2>
        {productsLoading ? (
          <p className="mt-2 text-slate-500">Loading...</p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {publishedProducts.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Published products
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total value based on amount of stock:</span>
                <span className="font-medium">
                  ${(totalInventoryValue / 100).toFixed(2)}
                </span>
              </div>
              {lowStockProducts.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">Low stock (&lt; 10):</span>
                  <span className="font-medium text-amber-600">
                    {lowStockProducts.length}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase text-slate-500">Quick Actions</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage your store efficiently
        </p>
        <div className="mt-4 space-y-2">
          <a
            href="/admin/products"
            className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all products →
          </a>
          <a
            href="/admin/orders"
            className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all orders →
          </a>
        </div>
      </Card>
    </section>
  );
}
