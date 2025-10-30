import {
  Cascade,
  Collection,
  Entity,
  Enum,
  JsonType,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
import { User } from './user.entity';

@Entity({ tableName: 'orders' })
export class Order {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  totalCents!: number;

  @Enum(() => OrderStatus)
  status: OrderStatus = OrderStatus.Pending;

  @Property({ nullable: true })
  paymentReference?: string;

  @Property({ type: JsonType, nullable: true })
  shippingAddress?: Record<string, unknown>;

  @OneToMany(() => OrderItem, (item) => item.order, {
    orphanRemoval: true,
    cascade: [Cascade.PERSIST, Cascade.REMOVE],
  })
  items = new Collection<OrderItem>(this);

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
