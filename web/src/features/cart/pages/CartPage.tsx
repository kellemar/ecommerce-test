import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Table } from 'flowbite-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../lib/api-client';

interface CartProduct {
  id: number;
  name: string;
  priceCents: number;
  stockQty: number;
}

interface CartItem {
  id: number;
  quantity: number;
  priceCents: number;
  product: CartProduct;
}

interface CartResponse {
  id: number;
  status: string;
  items: CartItem[];
}

const cartQueryKey = ['cart'];

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<CartResponse>({
    queryKey: cartQueryKey,
    queryFn: async () => {
      const response = await api.get<CartResponse>('/carts/me');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      await api.patch(`/carts/me/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (err: unknown) => {
      console.error(err);
      setError('Unable to update item quantity. Please try again.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await api.delete(`/carts/me/items/${itemId}`);
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (err: unknown) => {
      console.error(err);
      setError('Unable to remove item. Please try again.');
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/carts/me/items');
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
    onError: (err: unknown) => {
      console.error(err);
      setError('Unable to clear cart. Please try again.');
    },
  });

  const handleAdjustQuantity = (item: CartItem, delta: number) => {
    const nextQuantity = item.quantity + delta;
    if (nextQuantity <= 0) {
      removeMutation.mutate(item.id);
      return;
    }
    updateMutation.mutate({ itemId: item.id, quantity: nextQuantity });
  };

  const subtotal = data?.items?.reduce((acc, item) => acc + item.priceCents * item.quantity, 0) ?? 0;

  const disabled =
    updateMutation.isPending || removeMutation.isPending || clearMutation.isPending;

  return (
    <div className="mx-auto max-w-4xl py-12 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Your shopping cart</h1>
        <p className="mt-2 text-slate-600">
          Review items you&apos;d like to purchase and proceed to checkout when you&apos;re ready.
        </p>
      </div>
      {error ? <Alert color="failure" className="mb-4">{error}</Alert> : null}
      {isLoading ? (
        <p>Loading your cart…</p>
      ) : data && data.items.length ? (
        <>
          <div className="overflow-x-auto">
            <Table striped>
              <Table.Head>
                <Table.HeadCell>Product</Table.HeadCell>
                <Table.HeadCell>Quantity</Table.HeadCell>
                <Table.HeadCell>Price</Table.HeadCell>
                <Table.HeadCell>Total</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Remove</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {data.items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-slate-900">{item.product?.name ?? 'Product'}</p>
                        <p className="text-sm text-slate-500">In stock: {item.product?.stockQty ?? 0}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2">
                        <Button
                          color="light"
                          size="xs"
                          onClick={() => handleAdjustQuantity(item, -1)}
                          disabled={disabled}
                        >
                          −
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          color="light"
                          size="xs"
                          onClick={() => handleAdjustQuantity(item, 1)}
                          disabled={disabled}
                        >
                          +
                        </Button>
                      </div>
                    </Table.Cell>
                    <Table.Cell>${(item.priceCents / 100).toFixed(2)}</Table.Cell>
                    <Table.Cell>
                      ${(item.priceCents * item.quantity / 100).toFixed(2)}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        color="failure"
                        size="xs"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={disabled}
                      >
                        Remove
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              color="light"
              onClick={() => clearMutation.mutate()}
              disabled={disabled}
            >
              Clear cart
            </Button>
            <div className="text-right">
              <p className="text-sm text-slate-500">Subtotal</p>
              <p className="text-2xl font-semibold text-slate-900">
                ${(subtotal / 100).toFixed(2)}
              </p>
              <Button
                className="mt-3"
                onClick={() => navigate('/checkout')}
                disabled={disabled}
              >
                Proceed to checkout
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Browse the catalog and add items to your cart to start shopping.</p>
          <Button as={Link} to="/" className="mt-4">
            Continue shopping
          </Button>
        </div>
      )}
    </div>
  );
}
