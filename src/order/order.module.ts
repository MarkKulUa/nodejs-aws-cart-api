import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../database/entities';
import { OrderService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
