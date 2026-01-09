import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { CartModule } from './cart/cart.module';
import { PrismaService } from './prisma/prisma.service';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ProductModule, CloudinaryModule, ConfigModule.forRoot({ isGlobal: true }), AuthModule, OrderModule, CartModule,],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }