import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  create(dto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create({
      ...dto,
      dateHeureDebut: new Date(dto.dateHeureDebut),
    });
    return this.coursesRepository.save(course);
  }

  async findNearby(lat: number, lng: number, radius = 5000): Promise<Course[]> {
    return this.coursesRepository.query(
      `SELECT c.* FROM course c
       JOIN entrepot e ON c."entrepotId" = e.id
       WHERE c."delivererId" IS NULL
       AND e.latitude IS NOT NULL
       AND e.longitude IS NOT NULL
       AND ST_DWithin(
         ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )`,
      [lng, lat, radius],
    );
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['customer', 'deliverer', 'entrepot'],
    });
    if (!course) throw new NotFoundException(`Course ${id} introuvable`);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    if (dto.dateHeureDebut) {
      Object.assign(course, { ...dto, dateHeureDebut: new Date(dto.dateHeureDebut) });
    } else {
      Object.assign(course, dto);
    }
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.coursesRepository.delete(course.id);
  }

  async accept(id: string, delivererId: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.delivererId) throw new ConflictException('Course déjà acceptée');
    course.delivererId = delivererId;
    return this.coursesRepository.save(course);
  }

  findPending(): Promise<Course[]> {
    return this.coursesRepository.find({ where: { delivererId: null } });
  }
}
