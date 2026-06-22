import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persist product details (title, description, price) on cart items so the
 * cart API returns the same product model that was sent in, and order totals
 * are calculated from real prices.
 */
export class AddCartItemProductFields1717000000002
  implements MigrationInterface
{
  name = 'AddCartItemProductFields1717000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cart_items"
        ADD COLUMN IF NOT EXISTS "title" varchar NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "description" varchar NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "price" numeric NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cart_items"
        DROP COLUMN IF EXISTS "title",
        DROP COLUMN IF EXISTS "description",
        DROP COLUMN IF EXISTS "price";
    `);
  }
}
