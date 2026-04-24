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
import { User, UserRole } from '../users/user.entity';

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
      dateHeureArrivee: dto.dateHeureArrivee
        ? new Date(dto.dateHeureArrivee)
        : null,
      remorque: dto.remorque ?? 'MEDIUM',
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
    const nextValues = { ...dto };

    if (dto.dateHeureDebut) {
      Object.assign(nextValues, {
        dateHeureDebut: new Date(dto.dateHeureDebut),
      });
    }

    if ('dateHeureArrivee' in dto) {
      Object.assign(nextValues, {
        dateHeureArrivee: dto.dateHeureArrivee
          ? new Date(dto.dateHeureArrivee)
          : null,
      });
    }

    Object.assign(course, nextValues);
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

  async generateValidationCode(id: string): Promise<{ code: string }> {
    const course = await this.findOne(id);
    const code = String(Math.floor(10000 + Math.random() * 90000));
    course.validationCode = code;
    await this.coursesRepository.save(course);
    return { code };
  }

  async validateCode(
    id: string,
    code: string,
  ): Promise<{ valid: boolean }> {
    const course = await this.findOne(id);
    const valid = course.validationCode === code;
    if (valid) {
      course.status = 'COMPLETED';
      course.dateHeureArrivee = new Date();
      course.validationCode = null;
      await this.coursesRepository.save(course);
    }
    return { valid };
  }

  async confirmByCustomer(id: string, customerId: string): Promise<Course> {
    const course = await this.findOne(id);

    if (course.customerId !== customerId) {
      throw new ForbiddenException(
        'Vous ne pouvez confirmer que vos propres livraisons',
      );
    }

    const isInProgress = !!course.delivererId && !course.dateHeureArrivee;

    if (!isInProgress) {
      throw new BadRequestException(
        'Seules les livraisons en cours peuvent etre confirmees',
      );
    }

    course.dateHeureArrivee = new Date();
    course.status = 'COMPLETED';

    return this.coursesRepository.save(course);
  }

  findPending(): Promise<Course[]> {
    return this.coursesRepository.find({ where: { delivererId: IsNull() } });
  }

  async findMine(
    user: User,
  ): Promise<
    | Course[]
    | {
        active: Course | null;
        history: Course[];
      }
  > {
    if (user.role === UserRole.CUSTOMER) {
      return this.coursesRepository.find({
        where: { customerId: user.id },
        relations: ['customer', 'deliverer', 'entrepot'],
        order: { createdAt: 'DESC' },
      });
    }

    if (user.role === UserRole.ADMIN) {
      return this.findAll();
    }

    const courses = await this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.customer', 'customer')
      .leftJoinAndSelect('course.deliverer', 'deliverer')
      .leftJoinAndSelect('course.entrepot', 'entrepot')
      .leftJoinAndSelect('course.incidents', 'incidents')
      .where('course."delivererId" = :userId', { userId: user.id })
      .orderBy('course."createdAt"', 'DESC')
      .getMany();

    const active = courses.find((c) => c.status === 'IN_PROGRESS') ?? null;

    const history = courses.filter(
      (c) => c.status === 'COMPLETED' || c.status === 'CANCELLED',
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

  async getCustomerStats(customerId: string): Promise<{
    avgNote: number | null;
    totalCoursesEffectuees: number;
    coursesEnRetard: number;
  }> {
    const courses = await this.coursesRepository.find({
      where: { customerId },
      select: ['id', 'status', 'note', 'dateHeureDebut'],
    });

    const completed = courses.filter((c) => c.status === 'COMPLETED');

    const notedCourses = completed.filter((c) => c.note !== null);
    const avgNote =
      notedCourses.length > 0
        ? Math.round(
            (notedCourses.reduce((sum, c) => sum + (c.note as number), 0) /
              notedCourses.length) *
              10,
          ) / 10
        : null;

    const now = new Date();
    const coursesEnRetard = courses.filter(
      (c) =>
        (c.status === 'PENDING' || c.status === 'IN_PROGRESS') &&
        new Date(c.dateHeureDebut) < now,
    ).length;

    return {
      avgNote,
      totalCoursesEffectuees: completed.length,
      coursesEnRetard,
    };
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
