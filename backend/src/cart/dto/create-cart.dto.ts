import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
    @ApiProperty({ description: 'ID del Producto', example: 'uuid-del-producto' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: 'Cantidad a comprar', example: 1, minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}