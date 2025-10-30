import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Cart, CartItem, Order, OrderItem, Product } from '../../entities';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CartsModule } from '../carts/carts.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Order, OrderItem, Product, Cart, CartItem]),
    CartsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, RolesGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
