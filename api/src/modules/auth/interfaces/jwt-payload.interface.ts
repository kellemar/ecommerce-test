import { UserRole } from '../../../entities/user-role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}
