import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Order')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @ApiOperation({ summary: 'Finalizar Compra (Checkout)' })
  create(@Request() req) {
    return this.orderService.create(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Ver historial de compras' })
  findAll(@Request() req) {
    return this.orderService.findAll(req.user.userId);
  }
}