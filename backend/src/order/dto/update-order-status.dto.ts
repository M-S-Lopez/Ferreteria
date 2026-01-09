import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus, 
    description: 'Nuevo estado de la orden',
    example: 'PAID'
  })
  @IsEnum(OrderStatus) 
  status: OrderStatus;
}