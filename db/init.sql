-- Task 8.2 — schema + test data.
-- The application also creates/seeds this via TypeORM migrations on startup
-- (the private RDS is not reachable locally). This script is kept in the repo
-- as required by the task and can be run manually if the DB is reachable.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carts_status_enum') THEN
    CREATE TYPE "carts_status_enum" AS ENUM ('OPEN', 'ORDERED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id       uuid NOT NULL DEFAULT uuid_generate_v4(),
  name     varchar NOT NULL,
  email    varchar,
  password varchar NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS carts (
  id         uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  status     carts_status_enum NOT NULL DEFAULT 'OPEN',
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id     uuid NOT NULL,
  product_id  uuid NOT NULL,
  count       integer NOT NULL,
  title       varchar NOT NULL DEFAULT '',
  description varchar NOT NULL DEFAULT '',
  price       numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (cart_id, product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
    REFERENCES carts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id       uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id  uuid NOT NULL,
  cart_id  uuid NOT NULL,
  payment  jsonb,
  delivery jsonb,
  comments text,
  status   varchar NOT NULL DEFAULT 'OPEN',
  total    numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_cart FOREIGN KEY (cart_id)
    REFERENCES carts (id) ON DELETE CASCADE
);

-- Test data
INSERT INTO users (id, name, email, password)
VALUES ('11111111-1111-1111-1111-111111111111', 'MarkKulUa', 'mark.kulishenko@gmail.com', 'TEST_PASSWORD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO carts (id, user_id, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'OPEN'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'ORDERED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cart_items (cart_id, product_id, count, title, description, price)
VALUES
  ('22222222-2222-2222-2222-222222222222', '7567ec4b-b10c-48c5-9345-fc73c48a80aa', 2, 'Seed Product A', 'Seed product A description', 29.99),
  ('22222222-2222-2222-2222-222222222222', '7567ec4b-b10c-48c5-9345-fc73c48a80a1', 1, 'Seed Product B', 'Seed product B description', 49.5),
  ('33333333-3333-3333-3333-333333333333', '7567ec4b-b10c-48c5-9345-fc73c48a80aa', 5, 'Seed Product A', 'Seed product A description', 29.99)
ON CONFLICT (cart_id, product_id) DO NOTHING;

INSERT INTO orders (id, user_id, cart_id, payment, delivery, comments, status, total)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '{"type":"card","status":"paid"}'::jsonb,
  '{"type":"post","address":"221B Baker Street"}'::jsonb,
  'Test seed order', 'ORDERED', 250
)
ON CONFLICT (id) DO NOTHING;
