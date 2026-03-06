import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto'; // 👈 Importamos el nuevo DTO
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // 🔒 Todo el controlador protegido
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post()
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    // req.user.userId viene del Token JWT
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  getMyCart(@Request() req) {
    return this.cartService.getMyCart(req.user.userId);
  }

  // ==============================================================
  // 👇 NUEVO ENDPOINT: Actualizar cantidad
  // ==============================================================
  @Patch(':itemId')
  updateQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.updateItemQuantity(req.user.userId, itemId, updateCartDto.quantity);
  }

  @Delete(':itemId')
  remove(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(req.user.userId, itemId);
  }
}