import { Controller, Post, Body, UseGuards, Request, Get, ParseArrayPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/create-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post()
  @ApiBody({ type: [AddToCartDto] })
  addItem(
    @Request() req,
    @Body(new ParseArrayPipe({ items: AddToCartDto })) addToCartDto: AddToCartDto[]
  ) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }
}