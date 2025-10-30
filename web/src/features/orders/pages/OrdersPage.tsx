import { useQuery } from '@tanstack/react-query';
import { Table } from 'flowbite-react';
import api from '../../../lib/api-client';

interface OrderSummary {
  id: number;
  totalCents: number;
  status: string;
  paymentReference?: string | null;
  createdAt?: string;
  created_at?: string;
}

export function OrdersPage() {
  const { data, isLoading } = useQuery<OrderSummary[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get<OrderSummary[]>('/orders/me');
      return response.data;
    },
  });

  const formatPlacedDate = (timestamp?: string) => {
    if (!timestamp) {
      return '—';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  };

  return (
    <div className="py-12 px-4">
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500">View your order history and track current orders.</p>
        </div>
        <div className="overflow-x-auto">
          <Table striped hoverable>
            <Table.Head>
              <Table.HeadCell>Order #</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Total</Table.HeadCell>
              <Table.HeadCell>Date</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={4}>Loading orders…</Table.Cell>
                </Table.Row>
              ) : data?.length ? (
                data.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>#{order.id.toString().padStart(4, '0')}</Table.Cell>
                    <Table.Cell className="capitalize">{order.status}</Table.Cell>
                    <Table.Cell>${(order.totalCents / 100).toFixed(2)}</Table.Cell>
                    <Table.Cell>
                      {formatPlacedDate(order.createdAt ?? order.created_at)}
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={4}>No orders yet.</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </section>
    </div>
  );
}
