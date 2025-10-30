import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogoutButton } from './LogoutButton';

// Mock the API function
vi.mock('../api/auth.api', () => ({
  logout: vi.fn(),
}));

// Mock the auth store
vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

import { logout } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('LogoutButton', () => {
  const mockLogout = vi.fn();
  const mockClearSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the store
    (useAuthStore as any).mockReturnValue(mockClearSession);

    // Mock the API call
    (logout as any).mockImplementation(mockLogout);
  });

  it('renders logout button with default props', () => {
    renderWithProviders(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when logging out', async () => {
    const user = userEvent.setup();

    // Mock pending state by not resolving immediately
    let resolveMutation: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveMutation = resolve;
    });

    mockLogout.mockReturnValue(pendingPromise);

    renderWithProviders(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);

    // Should show loading text and be disabled
    await waitFor(() => {
      expect(screen.getByText('Signing out…')).toBeInTheDocument();
    });
    expect(button).toBeDisabled();

    // Resolve the mutation
    resolveMutation!({});

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  it('calls logout API and clears session on success', async () => {
    const user = userEvent.setup();

    mockLogout.mockResolvedValue({ success: true });

    renderWithProviders(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockClearSession).toHaveBeenCalled();
    });
  });

  it('clears session even on logout error', async () => {
    const user = userEvent.setup();

    mockLogout.mockRejectedValue(new Error('Logout failed'));

    renderWithProviders(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockClearSession).toHaveBeenCalled();
    });
  });

  it('applies custom props correctly', () => {
    renderWithProviders(
      <LogoutButton size="lg" color="failure" fullWidth />
    );

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toHaveClass('w-full');
  });
});
