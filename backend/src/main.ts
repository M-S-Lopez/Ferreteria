import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configuración de Validación (Esto arregla el error 500 de paginación)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // <--- ¡La clave! Convierte texto a número automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 2. Configuración de Swagger (Esto devuelve la web azul /api)
  const config = new DocumentBuilder()
    .setTitle('Ferreteria API')
    .setDescription('Documentación de la API de Ferretería')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 3. CORS y encendido
  app.enableCors();
  await app.listen(3000);
}
bootstrap();