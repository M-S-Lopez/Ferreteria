import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/create-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) { }

  async addToCart(userId: string, itemsDto: AddToCartDto[]) {

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    for (const itemDto of itemsDto) {

      const product = await this.prisma.product.findUnique({
        where: { id: itemDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`El producto con ID ${itemDto.productId} no existe`);
      }

      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(`No hay suficiente stock para el producto: ${product.name}. Solo quedan ${product.stock}.`);
      }

      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: itemDto.productId,
        },
      });

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + itemDto.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: itemDto.productId,
            quantity: itemDto.quantity,
          },
        });
      }
    }

    return this.getCart(userId);
  }

  async getCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: {
            productId: 'asc'
          }
        }
      },
    });
  }
}