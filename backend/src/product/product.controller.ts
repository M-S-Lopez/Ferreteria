import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // =========================================================
  // 🟢 RUTAS PÚBLICAS (Sin candado)
  // =========================================================

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // =========================================================
  // 🔴 RUTAS DE ADMIN (Con candados @Roles('ADMIN'))
  // =========================================================

  @Post('import-excel')
  @Roles('ADMIN') // 🔒 Candado
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo');

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Solo se permiten archivos Excel (.xlsx)');
    }

    return this.productService.importExcel(file);
  }

  @Post('upload')
  @ApiBearerAuth()
  @Roles('ADMIN') // 🔒 Candado
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se subió archivo');

    const result = await this.cloudinaryService.uploadImage(file).catch((error) => {
      throw new BadRequestException(error.message || 'Error al subir la imagen a Cloudinary');
    });

    return {
      message: 'Imagen subida exitosamente ☁️',
      secureUrl: result.secure_url,
      publicId: result.public_id
    };
  }

  @Post()
  @ApiBearerAuth()
  @Roles('ADMIN') // 🔒 Candado
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles('ADMIN') // 🔒 Candado
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('ADMIN') // 🔒 Candado
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}