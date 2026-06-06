import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CartEntity,
  CartItemEntity,
  CartStatus,
  OrderEntity,
} from '../../database/entities';
import { CreateOrderPayload } from '../type';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  getAll(): Promise<OrderEntity[]> {
    return this.orderRepository.find();
  }

  findById(orderId: string): Promise<OrderEntity | null> {
    return this.orderRepository.findOne({ where: { id: orderId } });
  }

  create(data: CreateOrderPayload): Promise<OrderEntity> {
    const order = this.orderRepository.create({
      user_id: data.userId,
      cart_id: data.cartId,
      payment: (data.payment as Record<string, unknown>) ?? {},
      delivery: (data.address as unknown as Record<string, unknown>) ?? {},
      comments: data.address?.comment ?? '',
      status: 'ORDERED',
      total: data.total,
    });

    return this.orderRepository.save(order);
  }

  /**
   * Transaction-based checkout (Task 8 optional +3):
   * - creates an order
   * - marks the cart as ORDERED (instead of deleting it, optional +20)
   * Both happen atomically.
   */
  async checkout(data: CreateOrderPayload): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(CartEntity, {
        where: { id: data.cartId, status: CartStatus.OPEN },
        relations: ['items'],
      });

      if (!cart || !cart.items?.length) {
        throw new NotFoundException('Open cart is empty or does not exist');
      }

      const order = manager.create(OrderEntity, {
        user_id: data.userId,
        cart_id: data.cartId,
        payment: (data.payment as Record<string, unknown>) ?? {},
        delivery: (data.address as unknown as Record<string, unknown>) ?? {},
        comments: data.address?.comment ?? '',
        status: 'ORDERED',
        total: data.total,
      });

      const savedOrder = await manager.save(order);

      cart.status = CartStatus.ORDERED;
      await manager.save(cart);

      return savedOrder;
    });
  }

  async update(orderId: string, data: Partial<OrderEntity>): Promise<void> {
    const order = await this.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order does not exist.');
    }

    await this.orderRepository.update(orderId, data);
  }
}
