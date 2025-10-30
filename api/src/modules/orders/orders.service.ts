import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  Cart,
  CartStatus,
  Order,
  OrderItem,
  OrderStatus,
  Product,
} from '../../entities';
import { CartsService } from '../carts/carts.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly em: EntityManager,
    private readonly cartsService: CartsService,
  ) {}

  async checkout(userId: number, dto: CheckoutDto): Promise<Order> {
    const order = await this.em.transactional(async (transactionEm) => {
      const cart = await transactionEm.findOne(
        Cart,
        { user: userId, status: CartStatus.Active },
        { populate: ['items', 'items.product', 'user'] },
      );

      if (!cart || cart.items.isEmpty()) {
        throw new BadRequestException('Cart is empty');
      }

      let totalCents = 0;
      const orderEntity = new Order();
      orderEntity.user = cart.user;
      orderEntity.totalCents = 0;
      orderEntity.status = OrderStatus.Pending;
      orderEntity.paymentReference = dto.paymentMethod;
      orderEntity.shippingAddress = dto.shippingAddress;

      for (const item of cart.items.getItems()) {
        const product = await transactionEm.findOne(Product, item.product.id, {
          lockMode: LockMode.PESSIMISTIC_WRITE,
        });
        if (!product) {
          throw new NotFoundException('Product not found');
        }
        if (product.stockQty < item.quantity) {
          throw new BadRequestException(`${product.name} is out of stock`);
        }

        product.stockQty -= item.quantity;
        totalCents += item.priceCents * item.quantity;

        const orderItem = new OrderItem();
        orderItem.order = orderEntity;
        orderItem.product = product;
        orderItem.nameSnapshot = product.name;
        orderItem.priceCents = item.priceCents;
        orderItem.quantity = item.quantity;
        orderEntity.items.add(orderItem);
        transactionEm.persist(orderItem);
      }

      orderEntity.totalCents = totalCents;
      cart.status = CartStatus.Inactive;
      cart.items.removeAll();

      transactionEm.persist(orderEntity);
      transactionEm.persist(cart);
      await transactionEm.flush();

      return transactionEm.populate(orderEntity, ['items']);
    });

    await this.cartsService.getActiveCart(userId);
    return order;
  }

  findAll(): Promise<Order[]> {
    return this.em.find(Order, {});
  }

  findByUser(userId: number): Promise<Order[]> {
    return this.em.find(Order, { user: userId });
  }

  findOne(id: number): Promise<Order | null> {
    return this.em.findOne(Order, id);
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.em.findOne(Order, id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = dto.status;
    await this.em.flush();
    return order;
  }
}
