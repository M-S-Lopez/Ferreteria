import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    // Inicializamos el Logger nativo de NestJS
    private readonly logger = new Logger(JwtAuthGuard.name);

    // Agregamos 'context' a los parámetros para poder leer la petición HTTP
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {

        if (err || !user) {
            // Extraemos datos de la petición para el log (muy útil para auditoría)
            const request = context.switchToHttp().getRequest();
            const ip = request.ip || request.connection.remoteAddress;
            const method = request.method;
            const url = request.originalUrl;

            let customMessage = 'Acceso no autorizado';
            let errorName = 'UnknownError';

            // Evaluamos el error específico de JWT
            if (info) {
                errorName = info.name;
                switch (info.name) {
                    case 'TokenExpiredError':
                        customMessage = 'El token ha expirado. Por favor, inicia sesión nuevamente.';
                        break;
                    case 'JsonWebTokenError':
                        customMessage = 'Firma del token inválida o token manipulado.';
                        break;
                    case 'NotBeforeError':
                        customMessage = 'El token aún no está activo.';
                        break;
                    default:
                        customMessage = info.message || customMessage;
                }
            }

            // Registramos el evento en la consola de NestJS con nivel "Warn" (Amarillo)
            this.logger.warn(
                `Intento fallido | IP: ${ip} | Ruta: [${method}] ${url} | Motivo: ${customMessage} (${errorName})`
            );

            // Lanzamos la excepción para el cliente (Swagger / Frontend)
            throw err || new UnauthorizedException({
                statusCode: 401,
                error: 'Unauthorized',
                message: customMessage,
                timestamp: new Date().toISOString()
            });
        }

        // Si todo está bien, dejamos pasar al usuario
        return user;
    }
}