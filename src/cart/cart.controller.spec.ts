import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './services';
import { OrderService } from '../order';

describe('CartController', () => {
  let controller: CartController;

  const cartServiceMock = {
    findOrCreateByUserId: jest.fn(),
    findByUserId: jest.fn(),
    updateByUserId: jest.fn(),
    removeByUserId: jest.fn(),
  };

  const orderServiceMock = {
    checkout: jest.fn(),
    getAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
