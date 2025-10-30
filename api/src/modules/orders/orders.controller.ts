import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser('sub') userId: number, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyOrders(@CurrentUser('sub') userId: number) {
    return this.ordersService.findByUser(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
