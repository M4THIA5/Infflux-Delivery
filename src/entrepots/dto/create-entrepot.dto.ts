import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEntrepotDto {
  @IsString()
  @IsNotEmpty()
  addresse: string;
}
