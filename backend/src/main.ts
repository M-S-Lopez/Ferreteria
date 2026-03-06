import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // =========================================================
  // 👇 2. EL BLINDAJE GLOBAL CONTRA DATOS BASURA
  // =========================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Borra cualquier dato extra que no esté en tus DTOs
      forbidNonWhitelisted: true, // Si mandan un dato extra, rechaza la petición con error 400
      transform: true, // Transforma los strings de la URL a números automáticamente si el DTO lo pide
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Ferretería API')
    .setDescription('API para e-commerce de ferretería industrial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors();

  await app.listen(3000);
}
bootstrap();