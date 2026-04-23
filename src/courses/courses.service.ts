import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  findAll(): Promise<Course[]> {
    return this.coursesRepository.find({
      relations: ['customer', 'deliverer', 'entrepot'],
    });
  }

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
      Object.assign(course, {
        ...dto,
        dateHeureDebut: new Date(dto.dateHeureDebut),
      });
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
    return this.coursesRepository.find({ where: { delivererId: IsNull() } });
  }

  async findMine(userId: string): Promise<{
    active: Course | null;
    history: Course[];
  }> {
    const courses = await this.coursesRepository.find({
      where: [{ customerId: userId }, { delivererId: userId }],
      relations: ['customer', 'deliverer', 'entrepot'],
      order: { createdAt: 'DESC' },
    });

    const active =
      courses.find(
        (c) => c.delivererId === userId && c.status === 'IN_PROGRESS',
      ) ?? null;

    const history = courses.filter(
      (c) =>
        c.delivererId === userId &&
        (c.status === 'COMPLETED' || c.status === 'CANCELLED'),
    );

    return { active, history };
  }

  async refuse(id: string, delivererId: string): Promise<Course> {
    const course = await this.findOne(id);
    if (course.delivererId !== delivererId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas refuser une course qui ne vous est pas assignée',
      );
    }
    if (course.status === 'IN_PROGRESS') {
      throw new BadRequestException(
        'Impossible de refuser une course déjà en cours',
      );
    }
    if (course.status === 'COMPLETED' || course.status === 'CANCELLED') {
      throw new BadRequestException(
        `Impossible de refuser une course au statut ${course.status}`,
      );
    }
    course.delivererId = null;
    course.status = 'PENDING';
    return this.coursesRepository.save(course);
  }

  async getMyStats(userId: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    inProgress: number;
    pending: number;
    totalRevenu: number;
    avgPrix: number;
  }> {
    const courses = await this.coursesRepository.find({
      where: { delivererId: userId },
      select: ['id', 'status', 'prix'],
    });

    const completed = courses.filter((c) => c.status === 'COMPLETED');
    const totalRevenu = completed.reduce((sum, c) => sum + Number(c.prix), 0);

    return {
      total: courses.length,
      completed: completed.length,
      cancelled: courses.filter((c) => c.status === 'CANCELLED').length,
      inProgress: courses.filter((c) => c.status === 'IN_PROGRESS').length,
      pending: courses.filter((c) => c.status === 'PENDING').length,
      totalRevenu: Math.round(totalRevenu * 100) / 100,
      avgPrix:
        completed.length > 0
          ? Math.round((totalRevenu / completed.length) * 100) / 100
          : 0,
    };
  }
}
