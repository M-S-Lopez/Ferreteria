import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto'; // <--- Importamos el DTO de login
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'; // <--- Importante para crear el token
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // <--- Inyectamos el servicio de JWT
  ) {}

  // REGISTRO (Ya lo tenías)
  async register(createAuthDto: CreateAuthDto) {
    const { email, password, name } = createAuthDto;
    const userExists = await this.prisma.user.findUnique({ where: { email } });

    if (userExists) {
      throw new BadRequestException('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roles: ['admin'], // <--- CAMBIO 1: Plural y entre corchetes []
      },
    });
    
    return {
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles, // <--- CAMBIO 2: Plural
      },
    };
  }

  // LOGIN (Nuevo) 👇
  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    // 1. Buscamos el usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email no encontrado)');
    }

    // 2. Comparamos la contraseña plana con la encriptada
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Contraseña incorrecta)');
    }

    // 3. Generamos el Token (JWT)
    // Aquí guardamos datos útiles dentro del token para usarlos luego
    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles // <--- CAMBIO 3: Plural
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        email: user.email,
        roles: user.roles, // <--- CAMBIO 4: Plural
      },
    };
  }
}