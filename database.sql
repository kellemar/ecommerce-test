-- Schema generated from Migration20251027173000.ts
-- Run with psql or any PostgreSQL client

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'customer');
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled');
CREATE TYPE cart_status AS ENUM ('active', 'inactive');

-- Users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  stock_qty INT NOT NULL CHECK (stock_qty >= 0),
  status product_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);

CREATE TABLE product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL
);
ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

CREATE TABLE product_categories (
  product_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id)
);

-- Carts
CREATE TABLE carts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status cart_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_cents INT NOT NULL
);
ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_product_id_unique UNIQUE (cart_id, product_id);

-- Orders
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  name_snapshot TEXT NOT NULL,
  price_cents INT NOT NULL,
  quantity INT NOT NULL
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign keys
ALTER TABLE product_images
  ADD CONSTRAINT product_images_product_id_foreign
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_categories
  ADD CONSTRAINT product_categories_product_id_foreign
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_categories
  ADD CONSTRAINT product_categories_category_id_foreign
  FOREIGN KEY (category_id) REFERENCES categories (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE carts
  ADD CONSTRAINT carts_user_id_foreign
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_cart_id_foreign
  FOREIGN KEY (cart_id) REFERENCES carts (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_product_id_foreign
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON UPDATE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_foreign
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON UPDATE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_id_foreign
  FOREIGN KEY (order_id) REFERENCES orders (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_foreign
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON UPDATE CASCADE;

ALTER TABLE refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_foreign
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON UPDATE CASCADE ON DELETE CASCADE;

-- Partial unique index for active carts
CREATE UNIQUE INDEX carts_user_id_active_unique ON carts (user_id)
WHERE status = 'active';

