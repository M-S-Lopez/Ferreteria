import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Order')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }


  @Get('all')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Ver TODAS las compras (Solo Admin)' })
  findAllForAdmin() {
    return this.orderService.findAllForAdmin();
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cambiar el estado de una orden (Solo Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto.status);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Finalizar Compra (Checkout)' })
  create(@Request() req) {
    return this.orderService.create(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver historial de mis compras' })
  findAll(@Request() req) {
    return this.orderService.findAll(req.user.userId);
  }
}