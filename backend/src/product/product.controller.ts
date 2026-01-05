import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query, // Importante para la seguridad
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport'; // El guardia de seguridad
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilterProductDto } from './dto/filter-product.dto';


@ApiTags('products') // (Opcional: ayuda a organizar Swagger)
@ApiBearerAuth()     // <--- 2. ¡ESTA ES LA CLAVE! 🔑
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ==========================================
  // 🔓 RUTAS PÚBLICAS (Cualquiera puede ver)
  // ==========================================

  @Get()
  findAll(@Query() params: FilterProductDto) {
    return this.productService.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // ==========================================
  // 🔒 RUTAS PRIVADAS (Solo Admin con Token)
  // ==========================================

  // 1. Crear producto manual
  @Post()
  @UseGuards(AuthGuard('jwt')) // 🔒 Candado
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  // 2. Editar producto
  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) // 🔒 Candado
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  // 3. Borrar producto
  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // 🔒 Candado
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // 4. Carga Masiva (Excel)
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    return this.productService.uploadExcel(file.buffer);
  }

  // 5. Subir Imagen a Cloudinary
  @Post(':id/image')
  @UseGuards(AuthGuard('jwt')) // 🔒 Candado
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }
    return this.productService.uploadProductImage(id, file);
  }
}