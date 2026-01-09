import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as XLSX from 'xlsx';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Prisma } from '@prisma/client';
import { FilterProductDto } from './dto/filter-product.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) { }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: createProductDto.sku,
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
      },
    });
  }

  async findAll(params: FilterProductDto) {
    const { page, limit, search, brand, category } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      AND: [],
    };

    if (search) {
      (where.AND as any[]).push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (brand) {
      (where.AND as any[]).push({
        brand: {
          name: { contains: brand, mode: 'insensitive' },
        },
      });
    }

    if (category) {
      (where.AND as any[]).push({
        category: {
          name: { contains: category, mode: 'insensitive' },
        },
      });
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where,
        include: { brand: true, category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: products,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true, category: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        sku: updateProductDto.sku,
        name: updateProductDto.name,
        description: updateProductDto.description,
        price: updateProductDto.price,
        stock: updateProductDto.stock,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async uploadExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let errors = [];

    for (const [index, row] of data.entries()) {
      try {
        const sku = row['SKU'];
        const name = row['Nombre'];
        const price = Number(row['Precio']);
        const stock = Number(row['Stock']);
        const brandName = row['Marca']?.toString().trim() || 'Genérica';
        const categoryName = row['Categoria']?.toString().trim() || 'General';

        if (!sku || !name || !price) {
          errors.push(`Fila ${index + 2}: Falta SKU, Nombre o Precio`);
          continue;
        }

        const brand = await this.prisma.brand.upsert({
          where: { name: brandName },
          update: {},
          create: { name: brandName },
        });

        const category = await this.prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });

        await this.prisma.product.create({
          data: {
            sku,
            name,
            description: row['Descripcion'] || '',
            price,
            stock: stock || 0,
            brandId: brand.id,
            categoryId: category.id,
          },
        });

        createdCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          errors.push(`Fila ${index + 2}: El SKU ${row['SKU']} ya existe.`);
        } else {
          console.error(error);
          errors.push(`Fila ${index + 2}: Error desconocido`);
        }
      }
    }

    return {
      message: 'Carga masiva completada',
      created: createdCount,
      errors: errors,
    };
  }

  async uploadProductImage(id: string, file: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const image = await this.cloudinary.uploadImage(file);
    return this.prisma.product.update({
      where: { id },
      data: { imageUrl: image.secure_url },
    });
  }
}