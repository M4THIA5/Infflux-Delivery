import { IsUUID } from 'class-validator';

export class AcceptCourseDto {
  @IsUUID()
  delivererId: string;
}
