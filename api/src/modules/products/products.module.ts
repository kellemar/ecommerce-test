import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Category, Product, ProductImage } from '../../entities';
import {
  ProductImagesController,
  ProductsController,
  PublicProductsController,
} from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [MikroOrmModule.forFeature([Product, Category, ProductImage])],
  controllers: [
    ProductsController,
    PublicProductsController,
    ProductImagesController,
  ],
  providers: [ProductsService, RolesGuard],
  exports: [ProductsService],
})
export class ProductsModule {}
