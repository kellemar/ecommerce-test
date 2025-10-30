import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsNotEmpty()
  @IsString()
  paymentMethod!: string;

  @IsOptional()
  shippingAddress?: Record<string, unknown>;
}
