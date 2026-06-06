import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1717000000000 implements MigrationInterface {
  name = 'InitSchema1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // carts.status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carts_status_enum') THEN
          CREATE TYPE "carts_status_enum" AS ENUM ('OPEN', 'ORDERED');
        END IF;
      END$$;
    `);

    // users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "email" varchar,
        "password" varchar NOT NULL,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);

    // carts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" "carts_status_enum" NOT NULL DEFAULT 'OPEN',
        CONSTRAINT "PK_carts_id" PRIMARY KEY ("id")
      );
    `);

    // cart_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "cart_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "count" integer NOT NULL,
        CONSTRAINT "PK_cart_items" PRIMARY KEY ("cart_id", "product_id"),
        CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cart_id")
          REFERENCES "carts" ("id") ON DELETE CASCADE
      );
    `);

    // orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "cart_id" uuid NOT NULL,
        "payment" jsonb,
        "delivery" jsonb,
        "comments" text,
        "status" varchar NOT NULL DEFAULT 'OPEN',
        "total" numeric NOT NULL DEFAULT 0,
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_cart" FOREIGN KEY ("cart_id")
          REFERENCES "carts" ("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "orders";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "carts_status_enum";`);
  }
}
