import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmMiddleware, MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(),
    AuthModule,
    UsersModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, MikroOrmMiddleware],
})
export class AppModule {}
