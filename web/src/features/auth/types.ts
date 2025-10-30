export type UserRole = 'admin' | 'customer';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  fullName?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
