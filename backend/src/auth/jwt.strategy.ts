import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // 1. Buscas al usuario en TU base de datos local usando el ID de Supabase
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // 2. Si no lo encuentra, lo rechaza
    if (!user) {
      throw new UnauthorizedException('Usuario no registrado en el sistema local');
    }

    return user;
  }
}