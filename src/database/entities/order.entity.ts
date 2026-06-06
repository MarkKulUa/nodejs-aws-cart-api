import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum OrderStatusEnum {
  OPEN = 'OPEN',
  ORDERED = 'ORDERED',
  CONFIRMED = 'CONFIRMED',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'cart_id' })
  cart_id: string;

  @Column({ type: 'jsonb', nullable: true })
  payment: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  delivery: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'varchar', default: OrderStatusEnum.OPEN })
  status: string;

  @Column({ type: 'numeric', default: 0 })
  total: number;
}
