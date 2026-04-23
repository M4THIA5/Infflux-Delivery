import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @IsDateString()
  dateHeureDebut: string;

  @IsNumber()
  prix: number;

  @IsNotEmpty()
  adresseLivraison: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  entrepotId: string;

  @IsOptional()
  @IsUUID()
  delivererId?: string;
}
