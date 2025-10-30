import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { AuthResponse } from '../features/auth/types';
import { useAuthStore } from '../features/auth/stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { __isRetryRequest?: boolean };

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    const headers = config.headers ?? {};
    (headers as Record<string, unknown>).Authorization = `Bearer ${token}`;
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && config && !config.__isRetryRequest) {
      try {
        const refreshResponse = await api.post<AuthResponse>('/auth/refresh');
        const { accessToken, user } = refreshResponse.data;
        useAuthStore.getState().setSession(accessToken, user);
        const headers = config.headers ?? {};
        (headers as Record<string, unknown>).Authorization = `Bearer ${accessToken}`;
        config.headers = headers;
        config.__isRetryRequest = true;
        return api(config);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
