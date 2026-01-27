import { IsOptional, IsInt, Min, IsString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @Min(0)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsString()
    search?: string;
}