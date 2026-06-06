import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fills the tables with test examples (Task 8.2.4).
 * Fixed UUIDs are used so the seed is idempotent and easy to query.
 */
export class SeedData1717000000001 implements MigrationInterface {
  name = 'SeedData1717000000001';

  private readonly userId = '11111111-1111-1111-1111-111111111111';
  private readonly cartOpenId = '22222222-2222-2222-2222-222222222222';
  private readonly cartOrderedId = '33333333-3333-3333-3333-333333333333';
  private readonly orderId = '44444444-4444-4444-4444-444444444444';

  // Product ids match the demo products from the product service.
  private readonly productA = '7567ec4b-b10c-48c5-9345-fc73c48a80aa';
  private readonly productB = '7567ec4b-b10c-48c5-9345-fc73c48a80a1';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "users" ("id", "name", "email", "password")
      VALUES ($1, 'MarkKulUa', 'mark.kulishenko@gmail.com', 'TEST_PASSWORD')
      ON CONFLICT ("id") DO NOTHING;
      `,
      [this.userId],
    );

    await queryRunner.query(
      `
      INSERT INTO "carts" ("id", "user_id", "status")
      VALUES
        ($1, $3, 'OPEN'),
        ($2, $3, 'ORDERED')
      ON CONFLICT ("id") DO NOTHING;
      `,
      [this.cartOpenId, this.cartOrderedId, this.userId],
    );

    await queryRunner.query(
      `
      INSERT INTO "cart_items" ("cart_id", "product_id", "count")
      VALUES
        ($1, $3, 2),
        ($1, $4, 1),
        ($2, $3, 5)
      ON CONFLICT ("cart_id", "product_id") DO NOTHING;
      `,
      [this.cartOpenId, this.cartOrderedId, this.productA, this.productB],
    );

    await queryRunner.query(
      `
      INSERT INTO "orders"
        ("id", "user_id", "cart_id", "payment", "delivery", "comments", "status", "total")
      VALUES
        ($1, $2, $3,
         '{"type":"card","status":"paid"}'::jsonb,
         '{"type":"post","address":"221B Baker Street"}'::jsonb,
         'Test seed order', 'ORDERED', 250)
      ON CONFLICT ("id") DO NOTHING;
      `,
      [this.orderId, this.userId, this.cartOrderedId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "orders" WHERE "id" = $1;`, [
      this.orderId,
    ]);
    await queryRunner.query(`DELETE FROM "cart_items" WHERE "cart_id" IN ($1, $2);`, [
      this.cartOpenId,
      this.cartOrderedId,
    ]);
    await queryRunner.query(`DELETE FROM "carts" WHERE "id" IN ($1, $2);`, [
      this.cartOpenId,
      this.cartOrderedId,
    ]);
    await queryRunner.query(`DELETE FROM "users" WHERE "id" = $1;`, [
      this.userId,
    ]);
  }
}
