import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ProductStatus } from '../../../entities/product-status.enum';

export class ProductListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 12;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
