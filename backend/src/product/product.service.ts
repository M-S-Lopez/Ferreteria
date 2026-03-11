import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductService {
  uploadImage(uploadData: any) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) { }

  // ======================================================
  // 1. CREAR PRODUCTO
  // ======================================================
  async create(data: any) {
    return this.prisma.product.create({
      data: {
        codigo: data.codigo,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),

        // ✅ CORREGIDO: La base de datos pide 'imagen'
        imagen: data.image || data.imagen || null,

        brand: data.brand || null,
        category: data.category || null,
      },
    });
  }

  // ======================================================
  // 2. LISTAR TODOS
  // ======================================================
  async findAll(paginationDto: any) {
    const { limit = 10, page = 1, search } = paginationDto;
    const offset = (page - 1) * limit;

    // Configurar el filtro de búsqueda (si enviaron algo)
    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },      // Busca en Nombre
        { brand: { contains: search, mode: 'insensitive' } },     // Busca en Marca
        { category: { contains: search, mode: 'insensitive' } },  // Busca en Categoría
        { codigo: { contains: search, mode: 'insensitive' } },    // Busca en Código
      ];
    }

    // 1. Obtener total (aplicando el filtro para que el número sea real)
    const totalItems = await this.prisma.product.count({
      where: whereCondition,
    });

    // 2. Obtener productos
    const products = await this.prisma.product.findMany({
      where: whereCondition, // 👈 Aplicamos el filtro aquí
      take: Number(limit),
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: products,
      meta: {
        totalItems,
        page: Number(page),
        lastPage: Math.ceil(totalItems / limit),
      }
    };
  }

  // ======================================================
  // 3. BUSCAR UNO
  // ======================================================
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  // ======================================================
  // 4. ACTUALIZAR
  // ======================================================
  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.price && { price: Number(data.price) }),
        ...(data.stock && { stock: Number(data.stock) }),
        ...(data.description && { description: data.description }),

        // ✅ CORREGIDO: Usamos 'imagen'
        ...((data.image || data.imagen) && { imagen: data.image || data.imagen }),

        ...(data.brand && { brand: data.brand }),
        ...(data.category && { category: data.category }),
      },
    });
  }

  // ======================================================
  // 5. IMPORTAR EXCEL
  // ======================================================
  async importExcel(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) throw new BadRequestException('El Excel está vacío');

    const results = [];

    for (const row of data as any[]) {
      const excelCodigo = row['Codigo'] || row['codigo'];
      if (!excelCodigo) continue;

      // Mapeo
      const nombre = row['Nombre'] || row['nombre'];
      const descripcion = row['Descripcion'] || row['descripcion'];
      const precio = row['Precio'] || row['precio'];
      const stock = row['Stock'] || row['stock'];
      const imagenUrl = row['Imagen'] || row['imagen'];
      const marca = row['Marca'] || row['marca'];
      const categoria = row['Categoria'] || row['categoria'];

      const savedProduct = await this.prisma.product.upsert({
        where: { codigo: String(excelCodigo) },

        update: {
          name: nombre,
          description: descripcion,
          price: Number(precio),
          stock: Number(stock),

          // ✅ CORREGIDO: Usamos 'imagen'
          imagen: imagenUrl || null,

          brand: marca || null,
          category: categoria || null
        },
        create: {
          codigo: String(excelCodigo),
          name: nombre,
          description: descripcion,
          price: Number(precio),
          stock: Number(stock),

          // ✅ CORREGIDO: Usamos 'imagen'
          imagen: imagenUrl || null,

          brand: marca || null,
          category: categoria || null
        },
      });

      results.push(savedProduct);
    }

    return {
      message: '✅ Importación completada',
      processedItems: results.length,
    };
  }

  // ======================================================
  // 6. BORRAR
  // ======================================================
  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}