import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    return await this.prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Producto no encontrado: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Sin stock para ${product.name}. Stock: ${product.stock}`
          );
        }

        total += product.price * item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      return await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });
    });

  }

  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  findAll() { return `This action returns all order`; }
  findOne(id: number) { return `This action returns a #${id} order`; }
  update(id: number, updateOrderDto: any) { return `This action updates a #${id} order`; }
  remove(id: number) { return `This action removes a #${id} order`; }

  async updateStatus(id: string, status: any) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío 🛒');
    }

    const totalAmount = cart.items.reduce((acc, item) => {
      return acc + (item.product.price * item.quantity);
    }, 0);

    return this.prisma.$transaction(async (tx) => {

      const order = await tx.order.create({
        data: {
          userId,
          total: totalAmount,
          status: 'PENDING',
        },
      });

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${item.product.name}`);
        }

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }
}