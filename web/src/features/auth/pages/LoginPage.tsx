import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Label, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { login } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

interface ApiError {
  message?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | undefined)?.from;

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setError(null);
      setSession(accessToken, user);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo ?? '/', { replace: true });
      }
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message ?? 'Unable to sign in. Please try again.');
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-slate-50 py-16">
      <Card className="w-full max-w-md border border-slate-200 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to Mandai</h1>
        <p className="text-sm text-slate-500">
          Welcome back! Enter your account details to access the storefront dashboard.
        </p>
        {error ? (
          <Alert color="failure">{error}</Alert>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password" value="Password" />
            <TextInput
              id="password"
              type="password"
              value={password}
              required
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
