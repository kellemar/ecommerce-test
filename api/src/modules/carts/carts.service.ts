import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  Cart,
  CartItem,
  CartStatus,
  Product,
  ProductStatus,
  User,
} from '../../entities';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(private readonly em: EntityManager) {}

  async getActiveCart(userId: number): Promise<Cart> {
    const existingCart = await this.em.findOne(
      Cart,
      { user: userId, status: CartStatus.Active },
      { populate: ['items', 'items.product'] },
    );

    if (existingCart) {
      return existingCart;
    }

    const userRef = this.em.getReference(User, userId);
    const newCart = new Cart();
    newCart.user = userRef;
    newCart.status = CartStatus.Active;
    await this.em.persistAndFlush(newCart);
    await this.em.populate(newCart, ['items', 'items.product']);
    return newCart;
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.getActiveCart(userId);
    const product = await this.em.findOne(Product, dto.productId);
    if (!product || product.status !== ProductStatus.Published) {
      throw new NotFoundException('Product not found');
    }

    const existing = cart.items
      .getItems()
      .find((item) => item.product.id === dto.productId);
    const desiredQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (desiredQuantity > product.stockQty) {
      throw new BadRequestException('Insufficient stock');
    }

    if (existing) {
      existing.quantity = desiredQuantity;
      existing.priceCents = product.priceCents;
    } else {
      const cartItem = new CartItem();
      cartItem.cart = cart;
      cartItem.product = product;
      cartItem.quantity = dto.quantity;
      cartItem.priceCents = product.priceCents;
      cart.items.add(cartItem);
      this.em.persist(cartItem);
    }

    await this.em.flush();
    await this.em.populate(cart, ['items', 'items.product']);
    return cart;
  }

  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getActiveCart(userId);
    const cartItem = cart.items.getItems().find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.em.findOne(Product, cartItem.product.id);
    if (!product || product.status !== ProductStatus.Published) {
      throw new NotFoundException('Product not found');
    }

    if (dto.quantity > product.stockQty) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = dto.quantity;
    cartItem.priceCents = product.priceCents;
    await this.em.flush();
    await this.em.populate(cart, ['items', 'items.product']);
    return cart;
  }

  async removeItem(userId: number, itemId: number): Promise<Cart> {
    const cartItem = await this.em.findOne(CartItem, {
      id: itemId,
      cart: { user: userId, status: CartStatus.Active },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.em.removeAndFlush(cartItem);
    return this.getActiveCart(userId);
  }

  async clearCart(userId: number): Promise<Cart> {
    const cart = await this.getActiveCart(userId);
    cart.items.removeAll();
    await this.em.flush();
    await this.em.populate(cart, ['items', 'items.product']);
    return cart;
  }
}
