import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto'; 
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'; 
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, 
  ) {}

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
        role: Role.ADMIN, 
      },
    });
    
    return {
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email no encontrado)');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Contraseña incorrecta)');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        email: user.email,
        role: user.role, 
      },
    };
  }
}