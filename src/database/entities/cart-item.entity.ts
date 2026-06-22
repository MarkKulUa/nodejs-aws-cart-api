import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity({ name: 'cart_items' })
export class CartItemEntity {
  @PrimaryColumn({ type: 'uuid', name: 'cart_id' })
  cart_id: string;

  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @Column({ type: 'integer' })
  count: number;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'varchar', default: '' })
  description: string;

  @Column({
    type: 'numeric',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value == null ? 0 : parseFloat(value)),
    },
  })
  price: number;

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: CartEntity;
}
