import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/create-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) { }

  // 🛒 1. AGREGAR AL CARRITO
  async addToCart(userId: string, dto: AddToCartDto) {
    // A. Validar que el producto exista y tenga stock
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.stock < dto.quantity) {
      throw new BadRequestException(`No hay suficiente stock. Disponible: ${product.stock}`);
    }

    // B. Buscar si el usuario ya tiene un carrito activo
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
    });

    // C. Si no tiene, creamos uno
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // D. Verificar si el producto YA está en el carrito para sumar cantidad
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
      },
    });

    if (existingItem) {
      // Si ya existe, actualizamos la cantidad
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      // Si no existe, creamos el item nuevo
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }
  }

  // 👀 2. VER MI CARRITO
  async getMyCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true, // Incluimos detalles del producto (foto, precio)
          },
        },
      },
    });

    if (!cart) return { items: [], total: 0 };

    // Calculamos el total a pagar dinámicamente
    const total = cart.items.reduce((acc, item) => {
      return acc + (item.quantity * item.product.price);
    }, 0);

    return { ...cart, total };
  }

  // ❌ 3. ELIMINAR ITEM DEL CARRITO
  async removeFromCart(userId: string, itemId: string) {
    // Verificamos que el item pertenezca al carrito del usuario (Seguridad)
    const cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) throw new NotFoundException('Carrito no encontrado');

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) throw new NotFoundException('Item no encontrado en tu carrito');

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}