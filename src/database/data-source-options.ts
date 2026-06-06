import { DataSourceOptions } from 'typeorm';
import {
  CartEntity,
  CartItemEntity,
  OrderEntity,
  UserEntity,
} from './entities';
import { InitSchema1717000000000 } from './migrations/1717000000000-InitSchema';
import { SeedData1717000000001 } from './migrations/1717000000001-SeedData';

/**
 * Builds TypeORM connection options from environment variables.
 * Credentials are injected into the lambda environment by the CDK stack.
 */
export const getDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserEntity, CartEntity, CartItemEntity, OrderEntity],
  // Migration classes are referenced directly (not via a glob) so they survive
  // esbuild bundling into a single file inside the lambda.
  migrations: [InitSchema1717000000000, SeedData1717000000001],
  // Schema is managed by migrations only.
  synchronize: false,
  // Run pending migrations automatically on app start. This is how the
  // private RDS schema gets created/seeded (the DB is not reachable locally).
  migrationsRun: true,
  ssl:
    process.env.DB_SSL === 'false'
      ? false
      : { rejectUnauthorized: false },
  logging: ['error'],
  // Fail fast instead of hanging the whole lambda bootstrap (and returning a
  // 504 at the API Gateway 29s limit) when the DB is unreachable.
  connectTimeoutMS: 5000,
  extra: {
    max: 2,
    connectionTimeoutMillis: 5000,
  },
});
