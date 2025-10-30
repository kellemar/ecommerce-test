import {
  Cascade,
  Collection,
  Entity,
  Enum,
  ManyToMany,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { CartItem } from './cart-item.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { ProductImage } from './product-image.entity';
import { ProductStatus } from './product-status.enum';

@Entity({ tableName: 'products' })
export class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  @Unique()
  slug!: string;

  @Property({ nullable: true })
  description?: string;

  @Property()
  priceCents!: number;

  @Property()
  stockQty!: number;

  @Enum(() => ProductStatus)
  status: ProductStatus = ProductStatus.Draft;

  @OneToMany(() => ProductImage, (image) => image.product, {
    orphanRemoval: true,
    cascade: [Cascade.PERSIST, Cascade.REMOVE],
    orderBy: { sortOrder: 'asc' },
  })
  images = new Collection<ProductImage>(this);

  @ManyToMany(() => Category, (category) => category.products, {
    owner: true,
    pivotTable: 'product_categories',
  })
  categories = new Collection<Category>(this);

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems = new Collection<CartItem>(this);

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems = new Collection<OrderItem>(this);

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
