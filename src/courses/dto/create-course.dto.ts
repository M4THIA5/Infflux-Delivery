import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type CourseStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type RemorqueType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'REFRIGERATED';

export class CreateCourseDto {
  @IsDateString()
  dateHeureDebut: string;

  @IsOptional()
  @IsDateString()
  dateHeureArrivee?: string;

  @IsNumber()
  prix: number;

  @IsNotEmpty()
  adresseLivraison: string;

  @IsOptional()
  @IsNumber()
  latLivraison?: number;

  @IsOptional()
  @IsNumber()
  lngLivraison?: number;

  @IsUUID()
  customerId: string;

  @IsUUID()
  entrepotId: string;

  @IsOptional()
  @IsUUID()
  delivererId?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: CourseStatus;

  @IsOptional()
  @IsBoolean()
  isLegal?: boolean;

  @IsEnum(['SMALL', 'MEDIUM', 'LARGE', 'REFRIGERATED'])
  remorque: RemorqueType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  note?: number;
}
