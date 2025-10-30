import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Cart, CartItem, Product } from '../../entities';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

@Module({
  imports: [MikroOrmModule.forFeature([Cart, CartItem, Product])],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
