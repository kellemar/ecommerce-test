import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../entities/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
