import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Busca el token en el encabezado
      ignoreExpiration: false, // Rechaza tokens vencidos
      secretOrKey: process.env.JWT_SECRET || 'PalabraSecretaPorSiFallaElEnv', // La misma clave del módulo
    });
  }

  async validate(payload: any) {
    // Esto agrega los datos del usuario a la 'request'
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}