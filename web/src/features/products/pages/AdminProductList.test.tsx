import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProductList } from './AdminProductList';

// Mock the API client
vi.mock('../../../lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../../../lib/api-client';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('AdminProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the products table', async () => {
    const mockProducts = {
      items: [
        {
          id: 1,
          name: 'Test Product',
          slug: 'test-product',
          priceCents: 2999,
          stockQty: 10,
          status: 'published',
          description: 'A test product',
        },
      ],
      count: 1,
    };

    (api.get as any).mockResolvedValue({ data: mockProducts });

    renderWithProviders(<AdminProductList />);

    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
  });

  it('shows "No products yet" when there are no products', async () => {
    (api.get as any).mockResolvedValue({ data: { items: [], count: 0 } });

    renderWithProviders(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('No products yet.')).toBeInTheDocument();
    });
  });

  it('opens add product modal when "Add product" is clicked', async () => {
    const user = userEvent.setup();
    (api.get as any).mockResolvedValue({ data: { items: [], count: 0 } });

    renderWithProviders(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('No products yet.')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add product/i });
    await user.click(addButton);

    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('renders status badges with correct colors', async () => {
    const mockProducts = {
      items: [
        {
          id: 1,
          name: 'Published Product',
          slug: 'published-product',
          priceCents: 1999,
          stockQty: 5,
          status: 'published',
          description: 'Published product',
        },
        {
          id: 2,
          name: 'Draft Product',
          slug: 'draft-product',
          priceCents: 999,
          stockQty: 0,
          status: 'draft',
          description: 'Draft product',
        },
        {
          id: 3,
          name: 'Archived Product',
          slug: 'archived-product',
          priceCents: 4999,
          stockQty: 20,
          status: 'archived',
          description: 'Archived product',
        },
      ],
      count: 3,
    };

    (api.get as any).mockResolvedValue({ data: mockProducts });

    renderWithProviders(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('Published Product')).toBeInTheDocument();
    });

    // Check that status badges are rendered (Flowbite Badge component may not expose text easily)
    expect(screen.getAllByText('published')).toHaveLength(1);
    expect(screen.getAllByText('draft')).toHaveLength(1);
    expect(screen.getAllByText('archived')).toHaveLength(1);
  });
});
