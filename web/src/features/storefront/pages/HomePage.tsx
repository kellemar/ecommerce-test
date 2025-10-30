import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api-client';
import { useAuthStore } from '../../auth/stores/auth.store';

interface PublicProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface PublicProduct {
  id: number;
  name: string;
  description?: string;
  priceCents: number;
  images?: PublicProductImage[];
}

interface PublicProductListResponse {
  items: PublicProduct[];
  count: number;
  page: number;
  limit: number;
}

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { data, isLoading } = useQuery<PublicProductListResponse>({
    queryKey: ['public-products', 'all'],
    queryFn: async () => {
      const response = await api.get<PublicProductListResponse>('/public/products', {
        params: { limit: 1000 },
      });
      return response.data;
    },
  });

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const addToCartMutation = useMutation<void, Error, { productId: number; productName: string }>({
    mutationFn: async ({ productId }) => {
      await api.post('/carts/me/items', { productId, quantity: 1 });
    },
    onMutate: ({ productId }) => {
      setPendingProductId(productId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setToastMessage(`${variables.productName} was added to your cart.`);
    },
    onSettled: () => {
      setPendingProductId(null);
    },
  });

  const handleAddToCart = (productId: number, productName: string) => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    if (user.role !== 'customer') {
      navigate('/admin');
      return;
    }
    if (addToCartMutation.isPending) {
      return;
    }
    addToCartMutation.mutate({ productId, productName });
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <section className="hero mb-8 py-8 rounded-lg bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/mandai_hero_banner.png)' }}>
          <h1 className="text-4xl font-bold text-center text-white">Welcome to Mandai Wildlife Store!</h1>
        </section>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">All products</h1>
          <p className="mt-2 text-slate-600">Browse the complete collection available in the store.</p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p>Loading products...</p>
          ) : data?.items?.length ? (
            data.items.map((item) => {
              const primaryImage = item.images?.[0]?.imageUrl;
              const thumbnailUrl = primaryImage
                ? primaryImage.startsWith('http') || primaryImage.startsWith('/')
                  ? primaryImage
                  : `/store/images/${primaryImage}`
                : undefined;
              return (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={item.name}
                      className="mb-4 h-50 w-50 rounded-md object-fill"
                    />
                  ) : (
                    <div className="mb-4 h-50 w-50 overflow-hidden rounded-md bg-slate-100" aria-hidden />
                  )}
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                  <p className="mt-2 text-slate-600">${(item.priceCents / 100).toFixed(2)}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleAddToCart(item.id, item.name)}
                    disabled={addToCartMutation.isPending && pendingProductId === item.id}
                  >
                    {addToCartMutation.isPending && pendingProductId === item.id ? 'Adding…' : 'Add to cart'}
                  </Button>
                </article>
              );
            })
          ) : (
            <p>No products available yet.</p>
          )}
        </div>
      </div>
      {toastMessage ? (
        <div className="fixed right-4 top-20 z-50">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
            <span>{toastMessage}</span>
            <button
              type="button"
              className="rounded border border-transparent p-1 text-emerald-700 transition hover:bg-emerald-200"
              onClick={() => setToastMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
