import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({ ...dto, password: hashed });
    return this.usersRepository.save(user);
  }

  findAll(role?: UserRole): Promise<User[]> {
    return this.usersRepository.find(role ? { where: { role } } : {});
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} introuvable`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const password = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : user.password;
    Object.assign(user, dto, { password });
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }

  async updatePosition(userId: string, latitude: number, longitude: number): Promise<void> {
    await this.findOne(userId);
    await this.usersRepository.query(
      `UPDATE "user" SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      [longitude, latitude, userId],
    );
  }
}
