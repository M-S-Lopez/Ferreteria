import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string) {
    // Iniciamos una TRANSACCIÓN (Todo o nada)
    return this.prisma.$transaction(async (tx) => {

      // 1. Buscar el carrito del usuario
      const cart = await tx.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('El carrito está vacío');
      }

      // 2. Calcular el total
      const total = cart.items.reduce((acc, item) => {
        return acc + (item.quantity * item.product.price);
      }, 0);

      // 3. Verificar Stock y Crear la Orden
      // Primero creamos la orden cabecera
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING', // Podría ser 'PAID' si conectáramos MercadoPago real
        },
      });

      // 4. Procesar cada item del carrito
      for (const item of cart.items) {
        // A. Verificar stock en tiempo real (por si alguien compró hace 1 segundo)
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (product.stock < item.quantity) {
          throw new BadRequestException(`No hay suficiente stock de: ${product.name}`);
        }

        // B. Restar Stock del inventario
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        });

        // C. Crear el OrderItem (Historial inmutable)
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Guardamos el precio AL MOMENTO de la compra
          },
        });
      }

      // 5. Vaciar el carrito (Borrar items y el carrito)
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      return { message: 'Compra exitosa 🚀', orderId: order.id, total };
    });
  }

  // Ver mis compras anteriores
  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      include: {
        // Sería ideal incluir al usuario para saber quién compró:
        // user: { select: { id: true, email: true, name: true } }, 
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Actualizar el estado (Ej: PENDING -> SHIPPED)
  async updateStatus(orderId: string, status: any) { // Usamos 'any' o el enum OrderStatus de Prisma
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`La orden con ID ${orderId} no existe`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}