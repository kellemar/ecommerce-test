import { Button } from 'flowbite-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout as logoutRequest } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

interface LogoutButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'light' | 'gray' | 'dark' | 'info' | 'success' | 'failure' | 'warning';
  fullWidth?: boolean;
}

export function LogoutButton({ size = 'sm', color = 'light', fullWidth }: LogoutButtonProps) {
  const clearSession = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.clear();
      clearSession();
    },
    onError: () => {
      queryClient.clear();
      clearSession();
    },
  });

  return (
    <Button
      size={size}
      color={color}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={fullWidth ? 'w-full' : undefined}
    >
      {mutation.isPending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
