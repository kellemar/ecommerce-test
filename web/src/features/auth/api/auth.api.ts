import api from '../../../lib/api-client';
import type { AuthResponse } from '../types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  fullName?: string;
  role?: 'admin' | 'customer';
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', dto);
  return response.data;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', dto);
  return response.data;
}

export async function refresh(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/refresh');
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
