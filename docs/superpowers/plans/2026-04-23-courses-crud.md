# Courses CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le CRUD complet des courses avec proposition WebSocket aux livreurs proches, acceptation, et cron de re-proposition toutes les 30s.

**Architecture:** `CoursesService` gère le CRUD, `findNearby` via PostGIS raw query sur entrepot lat/lng, et `accept`. `CourseGateway` émet `course-proposed` à la création + cron 30s. `Entrepot` reçoit lat/lng. `ScheduleModule` activé globalement.

**Tech Stack:** NestJS 11, TypeORM, PostGIS, Socket.io, `@nestjs/schedule`

---

## File Map

| Action | Fichier |
|--------|---------|
| MODIFY | `package.json` — ajouter @nestjs/schedule |
| MODIFY | `src/app.module.ts` — importer ScheduleModule.forRoot() |
| MODIFY | `src/entrepots/entrepot.entity.ts` — ajouter latitude/longitude |
| MODIFY | `src/entrepots/dto/create-entrepot.dto.ts` — ajouter lat/lng optionnels |
| CREATE | `src/courses/dto/create-course.dto.ts` |
| CREATE | `src/courses/dto/update-course.dto.ts` |
| CREATE | `src/courses/dto/accept-course.dto.ts` |
| MODIFY | `src/courses/courses.service.ts` — CRUD complet + findNearby + accept + findPending |
| CREATE | `src/courses/courses.service.spec.ts` — tests unitaires |
| MODIFY | `src/courses/courses.controller.ts` — 6 routes |
| CREATE | `src/courses/course.gateway.ts` — WebSocket + cron |
| MODIFY | `src/courses/courses.module.ts` — CourseGateway + ScheduleModule |

---

## Task 1: Installer @nestjs/schedule

**Files:**
- Modify: `package.json`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Installer @nestjs/schedule**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm add @nestjs/schedule
```

- [ ] **Step 2: Ajouter `ScheduleModule.forRoot()` dans `src/app.module.ts`**

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { Entrepot } from './entrepots/entrepot.entity';
import { Course } from './courses/course.entity';
import { Incident } from './incidents/incident.entity';
import { UsersModule } from './users/users.module';
import { EntrepotsModule } from './entrepots/entrepots.module';
import { CoursesModule } from './courses/courses.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Entrepot, Course, Incident],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    EntrepotsModule,
    CoursesModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
  }
}
```

- [ ] **Step 3: Vérifier compilation**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1 | grep -v "src/auth"
```

Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/app.module.ts
git commit -m "chore: add @nestjs/schedule and configure ScheduleModule"
```

---

## Task 2: Mettre à jour Entrepot entity + DTO

**Files:**
- Modify: `src/entrepots/entrepot.entity.ts`
- Modify: `src/entrepots/dto/create-entrepot.dto.ts`

- [ ] **Step 1: Remplacer `src/entrepots/entrepot.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Course } from '../courses/course.entity';

@Entity()
export class Entrepot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  addresse: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'entrepot')
  courses: Course[];
}
```

- [ ] **Step 2: Remplacer `src/entrepots/dto/create-entrepot.dto.ts`**

```typescript
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
```

- [ ] **Step 3: Vérifier compilation**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1 | grep -v "src/auth"
```

- [ ] **Step 4: Commit**

```bash
git add src/entrepots/entrepot.entity.ts src/entrepots/dto/create-entrepot.dto.ts
git commit -m "feat: add latitude/longitude to Entrepot entity"
```

---

## Task 3: Créer les DTOs Course

**Files:**
- Create: `src/courses/dto/create-course.dto.ts`
- Create: `src/courses/dto/update-course.dto.ts`
- Create: `src/courses/dto/accept-course.dto.ts`

- [ ] **Step 1: Créer `src/courses/dto/create-course.dto.ts`**

```typescript
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @IsDateString()
  dateHeureDebut: string;

  @IsNumber()
  prix: number;

  @IsNotEmpty()
  adresseLivraison: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  entrepotId: string;

  @IsOptional()
  @IsUUID()
  delivererId?: string;
}
```

- [ ] **Step 2: Créer `src/courses/dto/update-course.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
```

- [ ] **Step 3: Créer `src/courses/dto/accept-course.dto.ts`**

```typescript
import { IsUUID } from 'class-validator';

export class AcceptCourseDto {
  @IsUUID()
  delivererId: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/courses/dto/
git commit -m "feat: add Course DTOs with validation"
```

---

## Task 4: Implémenter CoursesService (TDD)

**Files:**
- Modify: `src/courses/courses.service.ts`
- Create: `src/courses/courses.service.spec.ts`

- [ ] **Step 1: Créer `src/courses/courses.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';

const mockCourse = {
  id: 'course-1',
  dateHeureDebut: new Date(),
  dateHeureArrivee: null,
  prix: 15.5,
  adresseLivraison: '1 rue de Paris',
  customerId: 'customer-1',
  delivererId: null,
  entrepotId: 'entrepot-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: null,
  deliverer: null,
  entrepot: null,
  incidents: [],
};

const mockRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a course', async () => {
      mockRepository.create.mockReturnValue(mockCourse);
      mockRepository.save.mockResolvedValue(mockCourse);
      const result = await service.create({
        dateHeureDebut: new Date().toISOString(),
        prix: 15.5,
        adresseLivraison: '1 rue de Paris',
        customerId: 'customer-1',
        entrepotId: 'entrepot-1',
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return course with relations', async () => {
      mockRepository.findOne.mockResolvedValue(mockCourse);
      const result = await service.findOne('course-1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('accept', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.accept('bad-id', 'deliverer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already accepted', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockCourse, delivererId: 'existing-deliverer' });
      await expect(service.accept('course-1', 'deliverer-1')).rejects.toThrow(ConflictException);
    });

    it('should set delivererId and save', async () => {
      const course = { ...mockCourse, delivererId: null };
      mockRepository.findOne.mockResolvedValue(course);
      mockRepository.save.mockResolvedValue({ ...course, delivererId: 'deliverer-1' });
      const result = await service.accept('course-1', 'deliverer-1');
      expect(result.delivererId).toBe('deliverer-1');
    });
  });

  describe('findPending', () => {
    it('should return courses without deliverer', async () => {
      mockRepository.find.mockResolvedValue([mockCourse]);
      const result = await service.findPending();
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { delivererId: null } });
      expect(result).toEqual([mockCourse]);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should delete course', async () => {
      mockRepository.findOne.mockResolvedValue(mockCourse);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('course-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('course-1');
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test --testPathPattern=courses.service 2>&1 | tail -15
```

Expected: FAIL.

- [ ] **Step 3: Remplacer `src/courses/courses.service.ts`**

```typescript
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
```

- [ ] **Step 4: Lancer les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test --testPathPattern=courses.service 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/courses/courses.service.ts src/courses/courses.service.spec.ts
git commit -m "feat: implement CoursesService with CRUD, accept and findNearby"
```

---

## Task 5: Implémenter CoursesController

**Files:**
- Modify: `src/courses/courses.controller.ts`

- [ ] **Step 1: Remplacer `src/courses/courses.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AcceptCourseDto } from './dto/accept-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.coursesService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptCourseDto) {
    return this.coursesService.accept(id, dto.delivererId);
  }
}
```

- [ ] **Step 2: Vérifier compilation**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1 | grep -v "src/auth"
```

Expected: aucune erreur.

- [ ] **Step 3: Lancer tous les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 4: Commit**

```bash
git add src/courses/courses.controller.ts
git commit -m "feat: add CoursesController with 6 routes"
```

---

## Task 6: Créer CourseGateway + mettre à jour CoursesModule

**Files:**
- Create: `src/courses/course.gateway.ts`
- Modify: `src/courses/courses.module.ts`

- [ ] **Step 1: Créer `src/courses/course.gateway.ts`**

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Cron } from '@nestjs/schedule';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';

interface AcceptCoursePayload {
  courseId: string;
  delivererId: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class CourseGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly coursesService: CoursesService) {}

  proposeCourse(course: Course): void {
    this.server.emit('course-proposed', { course });
  }

  @SubscribeMessage('accept-course')
  async handleAcceptCourse(
    @MessageBody() payload: AcceptCoursePayload,
  ): Promise<void> {
    const course = await this.coursesService.accept(payload.courseId, payload.delivererId);
    this.server.emit('course-accepted', { courseId: course.id, delivererId: course.delivererId });
  }

  @Cron('*/30 * * * * *')
  async handleReproposeUnaccepted(): Promise<void> {
    const pending = await this.coursesService.findPending();
    for (const course of pending) {
      this.server.emit('course-proposed', { course });
    }
  }
}
```

- [ ] **Step 2: Remplacer `src/courses/courses.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseGateway } from './course.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Course])],
  controllers: [CoursesController],
  providers: [CoursesService, CourseGateway],
  exports: [CoursesService, CourseGateway],
})
export class CoursesModule {}
```

- [ ] **Step 3: Mettre à jour `src/courses/courses.controller.ts` pour émettre via gateway à la création**

Remplace la méthode `create` dans le controller pour injecter `CourseGateway` :

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseGateway } from './course.gateway';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AcceptCourseDto } from './dto/accept-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseGateway: CourseGateway,
  ) {}

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const course = await this.coursesService.create(dto);
    this.courseGateway.proposeCourse(course);
    return course;
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.coursesService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptCourseDto) {
    return this.coursesService.accept(id, dto.delivererId);
  }
}
```

- [ ] **Step 4: Vérifier compilation**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1 | grep -v "src/auth"
```

Expected: aucune erreur.

- [ ] **Step 5: Lancer tous les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 6: Commit**

```bash
git add src/courses/course.gateway.ts src/courses/courses.module.ts src/courses/courses.controller.ts
git commit -m "feat: add CourseGateway with WebSocket proposal and 30s cron retry"
```
