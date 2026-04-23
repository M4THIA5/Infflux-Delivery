import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
