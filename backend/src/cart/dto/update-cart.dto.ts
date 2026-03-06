import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartDto {
    @ApiProperty({ description: 'Nueva cantidad del producto', example: 2, minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}