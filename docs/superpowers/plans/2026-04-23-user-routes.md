# User Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter les routes CRUD REST pour les users avec validation, hachage bcrypt du password, et exclusion du password dans les réponses.

**Architecture:** DTOs validés avec `class-validator`, service enrichi avec 5 méthodes CRUD, controller avec routes REST. Le password est hashé avec bcrypt à la création/modification et exclu des réponses via `@Exclude()` + `ClassSerializerInterceptor`.

**Tech Stack:** NestJS 11, TypeORM, class-validator, class-transformer, bcrypt

---

## File Map

| Action | Fichier |
|--------|---------|
| MODIFY | `package.json` — ajouter bcrypt, class-validator, class-transformer |
| MODIFY | `src/main.ts` — ValidationPipe global + ClassSerializerInterceptor global |
| MODIFY | `src/users/user.entity.ts` — ajouter `@Exclude()` sur password |
| CREATE | `src/users/dto/create-user.dto.ts` |
| CREATE | `src/users/dto/update-user.dto.ts` |
| MODIFY | `src/users/users.service.ts` — méthodes create, findAll(role?), findOne, update, remove |
| MODIFY | `src/users/users.controller.ts` — 5 routes |
| CREATE | `src/users/users.service.spec.ts` — tests unitaires |

---

## Task 1: Installer les dépendances

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer bcrypt, class-validator, class-transformer, @nestjs/mapped-types**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm add bcrypt class-validator class-transformer @nestjs/mapped-types && pnpm add -D @types/bcrypt
```

Expected: packages dans `node_modules/bcrypt`, `node_modules/class-validator`, `node_modules/class-transformer`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add bcrypt, class-validator, class-transformer"
```

---

## Task 2: Configurer main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Remplacer `src/main.ts`**

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 2: Vérifier que les tests passent toujours**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test 2>&1 | tail -10
```

Expected: 1 test passe.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: add global ValidationPipe and ClassSerializerInterceptor"
```

---

## Task 3: Créer les DTOs

**Files:**
- Create: `src/users/dto/create-user.dto.ts`
- Create: `src/users/dto/update-user.dto.ts`

- [ ] **Step 1: Créer `src/users/dto/create-user.dto.ts`**

```typescript
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
```

- [ ] **Step 2: Créer `src/users/dto/update-user.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

- [ ] **Step 3: Commit**

```bash
git add src/users/dto/
git commit -m "feat: add CreateUserDto and UpdateUserDto with validation"
```

---

## Task 4: Mettre à jour l'entité User

**Files:**
- Modify: `src/users/user.entity.ts`

- [ ] **Step 1: Ajouter `@Exclude()` sur le champ password**

Remplacer `src/users/user.entity.ts` :

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import type { Course } from '../courses/course.entity';
import type { Incident } from '../incidents/incident.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  DELIVER = 'DELIVER',
  CUSTOMER = 'CUSTOMER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'customer')
  customerCourses: Course[];

  @OneToMany('Course', 'deliverer')
  deliveredCourses: Course[];

  @OneToMany('Incident', 'user')
  incidents: Incident[];
}
```

- [ ] **Step 2: Vérifier compilation TypeScript**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/users/user.entity.ts
git commit -m "feat: exclude password from User serialization"
```

---

## Task 5: Implémenter UsersService

**Files:**
- Modify: `src/users/users.service.ts`
- Create: `src/users/users.service.spec.ts`

- [ ] **Step 1: Écrire les tests unitaires dans `src/users/users.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

const mockUser: User = {
  id: 'uuid-1',
  role: UserRole.ADMIN,
  name: 'Admin',
  email: 'admin@test.com',
  password: 'hashed',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  customerCourses: [],
  deliveredCourses: [],
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
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      await expect(
        service.create({ role: UserRole.ADMIN, name: 'Admin', email: 'admin@test.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return a user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      const result = await service.create({
        role: UserRole.ADMIN,
        name: 'Admin',
        email: 'admin@test.com',
        password: '123456',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users when no role filter', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockUser]);
    });

    it('should filter by role when provided', async () => {
      mockRepository.find.mockResolvedValue([mockUser]);
      await service.findAll(UserRole.ADMIN);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { role: UserRole.ADMIN } });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should delete user if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('uuid-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test users.service 2>&1 | tail -20
```

Expected: FAIL — méthodes `create`, `findAll` (avec filtre), `remove` non implémentées.

- [ ] **Step 3: Remplacer `src/users/users.service.ts`**

```typescript
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
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
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

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test users.service 2>&1 | tail -20
```

Expected: tous les tests passent (PASS).

- [ ] **Step 5: Commit**

```bash
git add src/users/users.service.ts src/users/users.service.spec.ts
git commit -m "feat: implement UsersService with CRUD and bcrypt"
```

---

## Task 6: Implémenter UsersController

**Files:**
- Modify: `src/users/users.controller.ts`

- [ ] **Step 1: Remplacer `src/users/users.controller.ts`**

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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

- [ ] **Step 2: Vérifier compilation TypeScript**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1
```

Expected: aucune erreur.

- [ ] **Step 3: Lancer tous les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 4: Commit**

```bash
git add src/users/users.controller.ts
git commit -m "feat: add UsersController with CRUD routes"
```
