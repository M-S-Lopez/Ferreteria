import { IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ description: 'Cantidad de elementos a devolver', default: 10 })
    @IsOptional()
    @IsPositive()
    @Type(() => Number) // Convierte el string de la URL a un número real
    limit?: number;

    @ApiPropertyOptional({ description: 'Cantidad de elementos a saltar', default: 0 })
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number;

    @ApiPropertyOptional({ description: 'Término de búsqueda (busca en nombre, descripción o código)' })
    @IsOptional()
    @IsString()
    search?: string;
}