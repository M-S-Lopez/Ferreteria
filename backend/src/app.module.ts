import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module'; 
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [ProductModule, CloudinaryModule, ConfigModule.forRoot({ isGlobal: true }), AuthModule, OrderModule,], 
  controllers: [],
  providers: [],
})
export class AppModule {}