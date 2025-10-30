import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity({ tableName: 'order_items' })
export class OrderItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Order)
  order!: Order;

  @ManyToOne(() => Product)
  product!: Product;

  @Property()
  nameSnapshot!: string;

  @Property()
  priceCents!: number;

  @Property()
  quantity!: number;
}
