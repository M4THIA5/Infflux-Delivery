import { IsEnum, IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { IncidentType } from '../incident.entity';

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsString()
  @IsNotEmpty()
  commentaire: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  userId: string;
}
