export class CreateProductDto {
    sku: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    brand?: string;
  }