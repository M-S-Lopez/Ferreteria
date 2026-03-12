import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import axios from 'axios'; // <-- 1. Importamos la nueva herramienta

export class LoginTestDto {
  @ApiProperty({ example: 'admin@ferreteria.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('Utilidades de Prueba')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('auth-test/login')
  @ApiOperation({ summary: 'Obtener Token de Supabase para probar en Swagger' })
  async getTestToken(@Body() body: LoginTestDto) {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en tu .env');
      }

      // 2. Usamos Axios en lugar de Fetch
      const response = await axios.post(
        `${url}/auth/v1/token?grant_type=password`,
        { email: body.email, password: body.password }, // El body
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
          },
        },
      );

      // Axios guarda la respuesta automáticamente dentro de la propiedad "data"
      const data = response.data;

      return {
        instruccion: 'Copia el texto largo de access_token y pégalo en el botón verde superior [Authorize]',
        access_token: data.access_token,
      };

    } catch (error: any) {
      // Axios guarda los mensajes de error de la API dentro de "response.data"
      const errorMsg = error.response?.data?.error_description || error.message || 'Error desconocido';

      throw new HttpException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Credenciales incorrectas o error en Supabase',
        CAUSA_REAL: errorMsg
      }, HttpStatus.UNAUTHORIZED);
    }
  }
}