import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../../../entities/product-status.enum';

class ProductImageInput {
  @IsString()
  @MinLength(1)
  imageUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsInt()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images?: ProductImageInput[];
}
