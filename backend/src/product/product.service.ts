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

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: createProductDto.sku,
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        // IGNORAMOS 'brand' y 'category' aquí intencionalmente
        // porque la creación manual simple no soporta la lógica avanzada.
      },
    });
  }

  async findAll(params: FilterProductDto) {
    const { page, limit, search, brand, category } = params;
    
    // 1. Calculamos cuántos saltar
    const skip = (page - 1) * limit;

    // 2. Construimos el filtro dinámico
    const where: Prisma.ProductWhereInput = {
      AND: [], // Empezamos con una lista vacía de condiciones
    };

    // Si hay texto de búsqueda, buscamos en Nombre O Descripción
    if (search) {
      (where.AND as any[]).push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Si hay filtro de marca (busca por nombre de la marca relacionada)
    if (brand) {
      (where.AND as any[]).push({
        brand: {
          name: { contains: brand, mode: 'insensitive' },
        },
      });
    }

    // Si hay filtro de categoría
    if (category) {
      (where.AND as any[]).push({
        category: {
          name: { contains: category, mode: 'insensitive' },
        },
      });
    }

    // 3. Ejecutamos dos consultas (Datos + Conteo Total)
    // Promise.all hace que se ejecuten en paralelo (más rápido)
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where,
        include: { brand: true, category: true },
        orderBy: { createdAt: 'desc' }, // Los más nuevos primero
      }),
      this.prisma.product.count({ where }),
    ]);

    // 4. Devolvemos la respuesta paginada
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
      include: { brand: true, category: true }, // Incluimos relaciones
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
        // También ignoramos las relaciones aquí para evitar el error rojo
      },
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // ==========================================
  // 🧠 LÓGICA INTELIGENTE DE EXCEL
  // ==========================================
  async uploadExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let errors = [];

    for (const [index, row] of data.entries()) {
      try {
        // 1. Validar datos mínimos
        const sku = row['SKU'];
        const name = row['Nombre'];
        const price = Number(row['Precio']);
        const stock = Number(row['Stock']);
        
        // Leemos las columnas de texto del Excel
        const brandName = row['Marca']?.toString().trim() || 'Genérica';
        const categoryName = row['Categoria']?.toString().trim() || 'General';

        if (!sku || !name || !price) {
          errors.push(`Fila ${index + 2}: Falta SKU, Nombre o Precio`);
          continue;
        }

        // 2. Gestionar MARCA (Buscar o Crear)
        // Upsert = Update + Insert (Si existe úsala, si no créala)
        const brand = await this.prisma.brand.upsert({
          where: { name: brandName },
          update: {}, // Si existe, no hacemos nada
          create: { name: brandName }, // Si no, la creamos
        });

        // 3. Gestionar CATEGORÍA (Buscar o Crear)
        const category = await this.prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });

        // 4. Crear el PRODUCTO vinculado
        await this.prisma.product.create({
          data: {
            sku,
            name,
            description: row['Descripcion'] || '',
            price,
            stock: stock || 0,
            brandId: brand.id,       // <--- Enlace mágico con ID
            categoryId: category.id, // <--- Enlace mágico con ID
          },
        });

        createdCount++;
      } catch (error) {
        // Si falla por SKU duplicado (código P2002 de Prisma)
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