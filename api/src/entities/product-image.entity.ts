import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Product } from './product.entity';

@Entity({ tableName: 'product_images' })
export class ProductImage {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Product)
  product!: Product;

  @Property()
  imageUrl!: string;

  @Property({ default: 0 })
  sortOrder: number = 0;
}
