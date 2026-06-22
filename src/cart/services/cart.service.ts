import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity, CartItemEntity, CartStatus } from '../../database/entities';
import { Cart, CartItem } from '../models';
import { PutCartPayload } from 'src/order/type';

/**
 * Maps a TypeORM CartEntity to the API Cart shape used by controllers.
 * The DB only stores product_id + count, so product details are projected
 * with the id only (the FE/product-service owns full product data).
 */
const toCartModel = (entity: CartEntity): Cart => ({
  id: entity.id,
  user_id: entity.user_id,
  created_at: entity.created_at ? entity.created_at.getTime() : Date.now(),
  updated_at: entity.updated_at ? entity.updated_at.getTime() : Date.now(),
  status: entity.status as unknown as Cart['status'],
  items: (entity.items ?? []).map(
    (item): CartItem => ({
      product: {
        id: item.product_id,
        title: item.title ?? '',
        description: item.description ?? '',
        price: Number(item.price ?? 0),
      },
      count: item.count,
    }),
  ),
});

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId, status: CartStatus.OPEN },
      relations: ['items'],
    });

    return cart ? toCartModel(cart) : null;
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({
      user_id: userId,
      status: CartStatus.OPEN,
      items: [],
    });

    const saved = await this.cartRepository.save(cart);

    return toCartModel(saved);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const cart = await this.findByUserId(userId);

    if (cart) {
      return cart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(
    userId: string,
    payload: PutCartPayload,
  ): Promise<Cart> {
    const cart = await this.findOrCreateByUserId(userId);
    const productId = payload.product.id;

    if (payload.count === 0) {
      await this.cartItemRepository.delete({
        cart_id: cart.id,
        product_id: productId,
      });
    } else {
      await this.cartItemRepository.save({
        cart_id: cart.id,
        product_id: productId,
        count: payload.count,
        title: payload.product.title ?? '',
        description: payload.product.description ?? '',
        price: payload.product.price ?? 0,
      });
    }

    // Touch the cart so updated_at refreshes.
    await this.cartRepository.update(cart.id, {
      updated_at: new Date(),
    });

    return this.findByUserId(userId) as Promise<Cart>;
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId, status: CartStatus.OPEN },
    });

    if (cart) {
      await this.cartRepository.delete(cart.id);
    }
  }
}
