# Prisma → TypeORM Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer Prisma par TypeORM (`@nestjs/typeorm` + `synchronize: true`) en architecture NestJS feature modules, avec un système de seed standalone.

**Architecture:** 4 modules NestJS feature (`users`, `entrepots`, `courses`, `incidents`), chacun avec son entité TypeORM, service et controller. `AppModule` configure `TypeOrmModule.forRoot()`. Le seed utilise un `DataSource` TypeORM standalone sans NestJS.

**Tech Stack:** NestJS 11, TypeORM, `@nestjs/typeorm`, `pg`, PostgreSQL, tsx

---

## File Map

| Action | Fichier |
|--------|---------|
| DELETE | `prisma.config.ts` |
| DELETE | `src/prisma.service.ts` |
| DELETE | `prisma/` (dossier entier) |
| MODIFY | `package.json` |
| MODIFY | `src/app.module.ts` |
| CREATE | `src/users/user.entity.ts` |
| CREATE | `src/users/users.module.ts` |
| CREATE | `src/users/users.service.ts` |
| CREATE | `src/users/users.controller.ts` |
| CREATE | `src/entrepots/entrepot.entity.ts` |
| CREATE | `src/entrepots/entrepots.module.ts` |
| CREATE | `src/entrepots/entrepots.service.ts` |
| CREATE | `src/entrepots/entrepots.controller.ts` |
| CREATE | `src/courses/course.entity.ts` |
| CREATE | `src/courses/courses.module.ts` |
| CREATE | `src/courses/courses.service.ts` |
| CREATE | `src/courses/courses.controller.ts` |
| CREATE | `src/incidents/incident.entity.ts` |
| CREATE | `src/incidents/incidents.module.ts` |
| CREATE | `src/incidents/incidents.service.ts` |
| CREATE | `src/incidents/incidents.controller.ts` |
| CREATE | `database/seeds/seed.ts` |
| CREATE | `database/seeds/user.seed.ts` |
| CREATE | `database/data/user.json` |

---

## Task 1: Nettoyer Prisma

**Files:**
- Delete: `prisma.config.ts`
- Delete: `src/prisma.service.ts`
- Delete: `prisma/` (dossier entier)
- Modify: `package.json`

- [ ] **Step 1: Supprimer les fichiers Prisma**

```bash
rm -rf prisma prisma.config.ts src/prisma.service.ts
```

- [ ] **Step 2: Mettre à jour `package.json`**

Remplacer le contenu de `package.json` — retirer `@prisma/adapter-pg`, `@prisma/client`, `prisma`, le champ `"prisma"`, et mettre à jour le script seed :

```json
{
  "name": "infflux-delivery",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "seed": "tsx database/seeds/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/typeorm": "^11.0.0",
    "pg": "^8.13.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.20"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/pg": "^8.11.0",
    "@types/supertest": "^7.0.0",
    "dotenv": "^17.4.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^17.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Installer les nouvelles dépendances**

```bash
pnpm install
```

Expected: packages installés sans erreur, `node_modules/typeorm` et `node_modules/@nestjs/typeorm` présents.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: replace Prisma with TypeORM dependencies"
```

---

## Task 2: Créer le module Users

**Files:**
- Create: `src/users/user.entity.ts`
- Create: `src/users/users.module.ts`
- Create: `src/users/users.service.ts`
- Create: `src/users/users.controller.ts`

- [ ] **Step 1: Créer `src/users/user.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

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

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'customer')
  customerCourses: unknown[];

  @OneToMany('Course', 'deliverer')
  deliveredCourses: unknown[];

  @OneToMany('Incident', 'user')
  incidents: unknown[];
}
```

> Note: Les relations utilisent des strings pour éviter les imports circulaires. TypeORM résout les références au runtime.

- [ ] **Step 2: Créer `src/users/users.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
}
```

- [ ] **Step 3: Créer `src/users/users.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
```

- [ ] **Step 4: Créer `src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Commit**

```bash
git add src/users/
git commit -m "feat: add Users module with TypeORM entity"
```

---

## Task 3: Créer le module Entrepots

**Files:**
- Create: `src/entrepots/entrepot.entity.ts`
- Create: `src/entrepots/entrepots.module.ts`
- Create: `src/entrepots/entrepots.service.ts`
- Create: `src/entrepots/entrepots.controller.ts`

- [ ] **Step 1: Créer `src/entrepots/entrepot.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Entrepot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  addresse: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Course', 'entrepot')
  courses: unknown[];
}
```

- [ ] **Step 2: Créer `src/entrepots/entrepots.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrepot } from './entrepot.entity';

@Injectable()
export class EntrepotsService {
  constructor(
    @InjectRepository(Entrepot)
    private readonly entrepotsRepository: Repository<Entrepot>,
  ) {}

  findAll(): Promise<Entrepot[]> {
    return this.entrepotsRepository.find();
  }

  findOne(id: string): Promise<Entrepot | null> {
    return this.entrepotsRepository.findOneBy({ id });
  }
}
```

- [ ] **Step 3: Créer `src/entrepots/entrepots.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { EntrepotsService } from './entrepots.service';

@Controller('entrepots')
export class EntrepotsController {
  constructor(private readonly entrepotsService: EntrepotsService) {}
}
```

- [ ] **Step 4: Créer `src/entrepots/entrepots.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entrepot } from './entrepot.entity';
import { EntrepotsService } from './entrepots.service';
import { EntrepotsController } from './entrepots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entrepot])],
  controllers: [EntrepotsController],
  providers: [EntrepotsService],
  exports: [EntrepotsService],
})
export class EntrepotsModule {}
```

- [ ] **Step 5: Commit**

```bash
git add src/entrepots/
git commit -m "feat: add Entrepots module with TypeORM entity"
```

---

## Task 4: Créer le module Courses

**Files:**
- Create: `src/courses/course.entity.ts`
- Create: `src/courses/courses.module.ts`
- Create: `src/courses/courses.service.ts`
- Create: `src/courses/courses.controller.ts`

- [ ] **Step 1: Créer `src/courses/course.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Entrepot } from '../entrepots/entrepot.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dateHeureDebut: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateHeureArrivee: Date | null;

  @Column('decimal', { precision: 10, scale: 2 })
  prix: number;

  @Column()
  adresseLivraison: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  delivererId: string | null;

  @Column()
  entrepotId: string;

  @ManyToOne(() => User, (user) => user.customerCourses)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User, (user) => user.deliveredCourses, { nullable: true })
  @JoinColumn({ name: 'delivererId' })
  deliverer: User | null;

  @ManyToOne(() => Entrepot, (entrepot) => entrepot.courses)
  @JoinColumn({ name: 'entrepotId' })
  entrepot: Entrepot;

  @OneToMany('Incident', 'course')
  incidents: unknown[];
}
```

- [ ] **Step 2: Créer `src/courses/courses.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  findAll(): Promise<Course[]> {
    return this.coursesRepository.find();
  }

  findOne(id: string): Promise<Course | null> {
    return this.coursesRepository.findOneBy({ id });
  }
}
```

- [ ] **Step 3: Créer `src/courses/courses.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}
}
```

- [ ] **Step 4: Créer `src/courses/courses.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Course])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
```

- [ ] **Step 5: Commit**

```bash
git add src/courses/
git commit -m "feat: add Courses module with TypeORM entity"
```

---

## Task 5: Créer le module Incidents

**Files:**
- Create: `src/incidents/incident.entity.ts`
- Create: `src/incidents/incidents.module.ts`
- Create: `src/incidents/incidents.service.ts`
- Create: `src/incidents/incidents.controller.ts`

- [ ] **Step 1: Créer `src/incidents/incident.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../courses/course.entity';
import { User } from '../users/user.entity';

export enum IncidentType {
  ROUTIER = 'ROUTIER',
  CASSE = 'CASSE',
  PERTE = 'PERTE',
  PAUSE_CAFE = 'PAUSE_CAFE',
  DOUANE = 'DOUANE',
}

@Entity()
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column()
  commentaire: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  courseId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Course, (course) => course.incidents)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => User, (user) => user.incidents)
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

- [ ] **Step 2: Créer `src/incidents/incidents.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
  ) {}

  findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find();
  }

  findOne(id: string): Promise<Incident | null> {
    return this.incidentsRepository.findOneBy({ id });
  }
}
```

- [ ] **Step 3: Créer `src/incidents/incidents.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}
}
```

- [ ] **Step 4: Créer `src/incidents/incidents.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './incident.entity';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
```

- [ ] **Step 5: Commit**

```bash
git add src/incidents/
git commit -m "feat: add Incidents module with TypeORM entity"
```

---

## Task 6: Mettre à jour AppModule

**Files:**
- Modify: `src/app.module.ts`

- [ ] **Step 1: Remplacer le contenu de `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    UsersModule,
    EntrepotsModule,
    CoursesModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 2: Vérifier que les tests existants compilent**

```bash
pnpm test
```

Expected: le test `AppController should return "Hello World!"` passe. (Note: ce test ne monte pas TypeORM, il ne nécessite pas de DB.)

- [ ] **Step 3: Commit**

```bash
git add src/app.module.ts
git commit -m "feat: configure TypeOrmModule in AppModule with all feature modules"
```

---

## Task 7: Créer le système de seed

**Files:**
- Create: `database/seeds/seed.ts`
- Create: `database/seeds/user.seed.ts`
- Create: `database/data/user.json`

- [ ] **Step 1: Créer le dossier et déplacer les données**

```bash
mkdir -p database/seeds database/data
```

Créer `database/data/user.json` :

```json
[
  {
    "role": "ADMIN",
    "name": "Admin Infflux",
    "email": "admin@infflux.dev",
    "password": "admin123",
    "isActive": true
  },
  {
    "role": "DELIVER",
    "name": "Lina Martin",
    "email": "lina.martin@infflux.dev",
    "password": "deliver123",
    "isActive": true
  },
  {
    "role": "DELIVER",
    "name": "Samir Diallo",
    "email": "samir.diallo@infflux.dev",
    "password": "deliver123",
    "isActive": true
  },
  {
    "role": "CUSTOMER",
    "name": "Claire Dubois",
    "email": "claire.dubois@infflux.dev",
    "password": "customer123",
    "isActive": true
  },
  {
    "role": "CUSTOMER",
    "name": "Yassine Benali",
    "email": "yassine.benali@infflux.dev",
    "password": "customer123",
    "isActive": false
  }
]
```

- [ ] **Step 2: Créer `database/seeds/user.seed.ts`**

```typescript
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { User, UserRole } from '../../src/users/user.entity';

interface UserSeedData {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
}

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const users: UserSeedData[] = JSON.parse(
    readFileSync(join(__dirname, '../data/user.json'), 'utf-8'),
  ) as UserSeedData[];

  const repo = dataSource.getRepository(User);

  for (const user of users) {
    await repo.upsert(user, ['email']);
  }

  console.log(`  ✅ ${users.length} utilisateurs seedés`);
}
```

- [ ] **Step 3: Créer `database/seeds/seed.ts`**

```typescript
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../src/users/user.entity';
import { Entrepot } from '../../src/entrepots/entrepot.entity';
import { Course } from '../../src/courses/course.entity';
import { Incident } from '../../src/incidents/incident.entity';
import { seedUsers } from './user.seed';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Entrepot, Course, Incident],
  synchronize: false,
});

async function main(): Promise<void> {
  console.log('🌱 Seeding...');
  await dataSource.initialize();

  await seedUsers(dataSource);

  console.log('✅ Seed terminé');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
```

- [ ] **Step 4: Commit**

```bash
git add database/
git commit -m "feat: add TypeORM seed system with user data"
```

---

## Task 8: Vérification finale

- [ ] **Step 1: S'assurer que la DB tourne**

```bash
docker compose up -d
```

Expected: conteneur PostgreSQL démarré.

- [ ] **Step 2: Démarrer l'application**

```bash
pnpm start:dev
```

Expected: NestJS démarre sans erreur, TypeORM synchronise les tables, logs du type :
```
[TypeOrmModule] Database connected
[NestApplication] Nest application successfully started
```

- [ ] **Step 3: Lancer le seed**

```bash
pnpm seed
```

Expected:
```
🌱 Seeding...
  ✅ 5 utilisateurs seedés
✅ Seed terminé
```

- [ ] **Step 4: Lancer les tests**

```bash
pnpm test
```

Expected: 1 test passe (`AppController should return "Hello World!"`).

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: complete Prisma to TypeORM migration"
```
