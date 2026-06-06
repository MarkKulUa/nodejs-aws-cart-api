import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDataSourceOptions } from './data-source-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...getDataSourceOptions(),
        // Don't retry for ~30s on a broken connection — fail fast.
        retryAttempts: 1,
        retryDelay: 1000,
        autoLoadEntities: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
