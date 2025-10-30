import { Migration } from '@mikro-orm/migrations';

export class Migration20251027173000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create type "user_role" as enum ('admin', 'customer');`);
    this.addSql(`create type "product_status" as enum ('draft', 'published', 'archived');`);
    this.addSql(`create type "order_status" as enum ('pending', 'paid', 'fulfilled', 'cancelled');`);
    this.addSql(`create type "cart_status" as enum ('active', 'inactive');`);

    this.addSql(
      `create table "users" ("id" bigserial primary key, "email" text not null, "password_hash" text not null, "role" "user_role" not null default 'customer', "full_name" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`,
    );
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(
      `create table "products" ("id" bigserial primary key, "name" text not null, "slug" text not null, "description" text null, "price_cents" int not null, "stock_qty" int not null check (stock_qty >= 0), "status" "product_status" not null default 'draft', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`,
    );
    this.addSql(`alter table "products" add constraint "products_slug_unique" unique ("slug");`);

    this.addSql(
      `create table "product_images" ("id" bigserial primary key, "product_id" bigint not null, "image_url" text not null, "sort_order" int not null default 0);`,
    );

    this.addSql(
      `create table "categories" ("id" bigserial primary key, "name" text not null, "slug" text not null);`,
    );
    this.addSql(`alter table "categories" add constraint "categories_name_unique" unique ("name");`);
    this.addSql(`alter table "categories" add constraint "categories_slug_unique" unique ("slug");`);

    this.addSql(
      `create table "product_categories" ("product_id" bigint not null, "category_id" bigint not null, constraint "product_categories_pkey" primary key ("product_id", "category_id"));`,
    );

    this.addSql(
      `create table "carts" ("id" bigserial primary key, "user_id" bigint not null, "status" "cart_status" not null default 'active', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`,
    );

    this.addSql(
      `create table "cart_items" ("id" bigserial primary key, "cart_id" bigint not null, "product_id" bigint not null, "quantity" int not null check (quantity > 0), "price_cents" int not null);`,
    );
    this.addSql(`alter table "cart_items" add constraint "cart_items_cart_id_product_id_unique" unique ("cart_id", "product_id");`);

    this.addSql(
      `create table "orders" ("id" bigserial primary key, "user_id" bigint not null, "total_cents" int not null check (total_cents >= 0), "status" "order_status" not null default 'pending', "payment_reference" text null, "shipping_address" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`,
    );

    this.addSql(
      `create table "order_items" ("id" bigserial primary key, "order_id" bigint not null, "product_id" bigint not null, "name_snapshot" text not null, "price_cents" int not null, "quantity" int not null);`,
    );

    this.addSql(
      `create table "refresh_tokens" ("id" bigserial primary key, "user_id" bigint not null, "token_hash" text not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, "created_at" timestamptz not null default now());`,
    );

    this.addSql(
      `alter table "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "product_categories" add constraint "product_categories_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "product_categories" add constraint "product_categories_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "carts" add constraint "carts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "cart_items" add constraint "cart_items_cart_id_foreign" foreign key ("cart_id") references "carts" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "cart_items" add constraint "cart_items_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "orders" add constraint "orders_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "order_items" add constraint "order_items_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "order_items" add constraint "order_items_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `create unique index "carts_user_id_active_unique" on "carts" ("user_id") where "status" = 'active';`,
    );
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "carts_user_id_active_unique";');

    this.addSql('alter table "product_images" drop constraint "product_images_product_id_foreign";');
    this.addSql('alter table "product_categories" drop constraint "product_categories_product_id_foreign";');
    this.addSql('alter table "product_categories" drop constraint "product_categories_category_id_foreign";');
    this.addSql('alter table "carts" drop constraint "carts_user_id_foreign";');
    this.addSql('alter table "cart_items" drop constraint "cart_items_cart_id_foreign";');
    this.addSql('alter table "cart_items" drop constraint "cart_items_product_id_foreign";');
    this.addSql('alter table "orders" drop constraint "orders_user_id_foreign";');
    this.addSql('alter table "order_items" drop constraint "order_items_order_id_foreign";');
    this.addSql('alter table "order_items" drop constraint "order_items_product_id_foreign";');
    this.addSql('alter table "refresh_tokens" drop constraint "refresh_tokens_user_id_foreign";');

    this.addSql('drop table if exists "refresh_tokens";');
    this.addSql('drop table if exists "order_items";');
    this.addSql('drop table if exists "orders";');
    this.addSql('drop table if exists "cart_items";');
    this.addSql('drop table if exists "carts";');
    this.addSql('drop table if exists "product_categories";');
    this.addSql('drop table if exists "categories";');
    this.addSql('drop table if exists "product_images";');
    this.addSql('drop table if exists "products";');
    this.addSql('drop table if exists "users";');

    this.addSql('drop type if exists "cart_status";');
    this.addSql('drop type if exists "order_status";');
    this.addSql('drop type if exists "product_status";');
    this.addSql('drop type if exists "user_role";');
  }
}
