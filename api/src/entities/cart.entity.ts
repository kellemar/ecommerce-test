import {
  Cascade,
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { CartStatus } from './cart-status.enum';
import { CartItem } from './cart-item.entity';
import { User } from './user.entity';

@Entity({ tableName: 'carts' })
export class Cart {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Enum(() => CartStatus)
  status: CartStatus = CartStatus.Active;

  @OneToMany(() => CartItem, (item) => item.cart, {
    orphanRemoval: true,
    cascade: [Cascade.PERSIST, Cascade.REMOVE],
  })
  items = new Collection<CartItem>(this);

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
