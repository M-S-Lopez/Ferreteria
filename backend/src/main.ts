import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <-- Nuevas importaciones

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Seguridad: Cabeceras HTTP seguras
  app.use(helmet());

  // 2. Seguridad: Configuración de CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Sanitización y validación estricta global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Configuración de Swagger (Documentación Automática)
  const config = new DocumentBuilder()
    .setTitle('API Ferretería')
    .setDescription('Documentación de los endpoints para el sistema de inventario y ventas')
    .setVersion('1.0')
    .addBearerAuth() // <-- Habilita el botón "Authorize" para probar con tokens
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();