import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateEntrepotDto {
  @IsString()
  @IsNotEmpty()
  addresse: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
