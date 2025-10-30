import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Entity({ tableName: 'cart_items' })
@Unique({ properties: ['cart', 'product'] })
export class CartItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Cart)
  cart!: Cart;

  @ManyToOne(() => Product)
  product!: Product;

  @Property()
  quantity!: number;

  @Property()
  priceCents!: number;
}
