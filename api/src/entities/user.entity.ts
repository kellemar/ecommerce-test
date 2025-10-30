import {
  Collection,
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Cart } from './cart.entity';
import { Order } from './order.entity';
import { RefreshToken } from './refresh-token.entity';
import { UserRole } from './user-role.enum';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  passwordHash!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.Customer;

  @Property({ nullable: true })
  fullName?: string;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();

  @Property({
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @OneToMany(() => Cart, (cart) => cart.user)
  carts = new Collection<Cart>(this);

  @OneToMany(() => Order, (order) => order.user)
  orders = new Collection<Order>(this);

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens = new Collection<RefreshToken>(this);
}
