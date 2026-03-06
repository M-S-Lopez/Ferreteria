import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Miramos si la ruta tiene la etiqueta @Roles
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si no tiene etiqueta, lo dejamos pasar libremente
        if (!requiredRoles) {
            return true;
        }

        // 2. Extraemos al usuario (que ya fue validado por el JWT Guard)
        const { user } = context.switchToHttp().getRequest();

        // 3. Verificamos si tiene el rol exigido
        // IMPORTANTE: Asumimos que tu token JWT guarda el 'role' del usuario
        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Acceso denegado: Área exclusiva para el dueño de la ferretería.');
        }

        return true;
    }
}