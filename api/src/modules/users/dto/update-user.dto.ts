import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../entities/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
