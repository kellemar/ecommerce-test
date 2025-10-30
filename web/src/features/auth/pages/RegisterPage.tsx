import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Label, TextInput } from 'flowbite-react';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { register } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

interface ApiError {
  message?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: ({ accessToken, user }) => {
      setError(null);
      setSession(accessToken, user);
      navigate('/', { replace: true });
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message ?? 'Unable to create account. Please try again.');
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password, fullName });
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-slate-50 py-16">
      <Card className="w-full max-w-md border border-slate-200 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500">
          Join the Mandai community to explore and manage your shopping experience.
        </p>
        {error ? <Alert color="failure">{error}</Alert> : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="fullName" value="Full name" />
            <TextInput
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Alex Rivers"
            />
          </div>
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
              minLength={12}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 12 characters"
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
