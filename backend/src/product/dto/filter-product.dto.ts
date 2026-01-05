import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterProductDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number) // Convierte "1" (string) a 1 (numero)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Busca en nombre o descripcion' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filtrar por nombre de marca' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false, description: 'Filtrar por nombre de categoria' })
  @IsOptional()
  @IsString()
  category?: string;
}