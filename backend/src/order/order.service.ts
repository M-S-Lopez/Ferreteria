import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

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

        // Restar Stock
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

      // Crear Orden
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
  
  // Estos métodos vacíos los crea el generador, déjalos así para que no tire error
  findAll() { return `This action returns all order`; }
  findOne(id: number) { return `This action returns a #${id} order`; }
  update(id: number, updateOrderDto: any) { return `This action updates a #${id} order`; }
  remove(id: number) { return `This action removes a #${id} order`; }
}