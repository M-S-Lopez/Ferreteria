import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
    @ApiProperty({ example: 'uuid-del-producto', description: 'ID del producto a comprar' })
    @IsString()
    productId: string;

    @ApiProperty({ example: 2, description: 'Cantidad deseada', minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}