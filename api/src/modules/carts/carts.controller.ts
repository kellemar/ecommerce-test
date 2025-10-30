import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('me')
  getActiveCart(@CurrentUser('sub') userId: number) {
    return this.cartsService.getActiveCart(userId);
  }

  @Post('me/items')
  addItem(@CurrentUser('sub') userId: number, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(userId, dto);
  }

  @Patch('me/items/:itemId')
  updateItem(
    @CurrentUser('sub') userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(userId, itemId, dto);
  }

  @Delete('me/items/:itemId')
  removeItem(
    @CurrentUser('sub') userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartsService.removeItem(userId, itemId);
  }

  @Delete('me/items')
  clearCart(@CurrentUser('sub') userId: number) {
    return this.cartsService.clearCart(userId);
  }
}
