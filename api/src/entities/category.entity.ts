import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Product } from './product.entity';

@Entity({ tableName: 'categories' })
export class Category {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  name!: string;

  @Property()
  @Unique()
  slug!: string;

  @ManyToMany(() => Product, (product) => product.categories)
  products = new Collection<Product>(this);
}
