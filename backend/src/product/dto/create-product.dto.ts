export class CreateProductDto {
  codigo: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  brand?: string;
}