import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'PalabraSecretaPorSiFallaElEnv', 
      signOptions: { expiresIn: '1h' }, // El token dura 1 hora
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService,JwtStrategy],
})
export class AuthModule {}