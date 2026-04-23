# User Position (PostGIS + WebSocket) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une position GPS aux users, mise à jour en temps réel via Socket.io et stockée en PostGIS.

**Architecture:** L'image Docker passe à PostGIS, l'extension est activée via un listener TypeORM. Le champ `position` est une colonne `geography(Point, 4326)` sur `User`. Un `PositionGateway` Socket.io reçoit les events `update-position` et appelle `UsersService.updatePosition()` via une requête SQL brute.

**Tech Stack:** NestJS 11, TypeORM, PostGIS, Socket.io, `@nestjs/websockets`, `@nestjs/platform-socket.io`

---

## File Map

| Action | Fichier |
|--------|---------|
| MODIFY | `docker-compose.yml` — image postgis |
| MODIFY | `package.json` — ajouter socket.io deps |
| MODIFY | `src/app.module.ts` — activer extension PostGIS |
| MODIFY | `src/users/user.entity.ts` — ajouter champ `position` |
| MODIFY | `src/users/users.service.ts` — ajouter `updatePosition()` |
| MODIFY | `src/users/users.module.ts` — déclarer `PositionGateway` |
| CREATE | `src/users/position.gateway.ts` |

---

## Task 1: Infrastructure PostGIS

**Files:**
- Modify: `docker-compose.yml`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Mettre à jour `docker-compose.yml`**

Remplacer `image: postgres:16-alpine` par `image: postgis/postgis:16-alpine` :

```yaml
services:
  postgres:
    image: postgis/postgis:16-alpine
    container_name: postgres_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-mydb}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Activer l'extension PostGIS dans `src/app.module.ts`**

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
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

- [ ] **Step 3: Redémarrer le conteneur Docker avec la nouvelle image**

```bash
docker rm -f postgres_db && docker compose up -d
```

Expected: conteneur redémarré avec l'image PostGIS.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml src/app.module.ts
git commit -m "feat: switch to PostGIS and enable postgis extension"
```

---

## Task 2: Installer les dépendances WebSocket

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer les packages Socket.io**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

Expected: packages dans `node_modules/@nestjs/websockets`, `node_modules/socket.io`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add Socket.io dependencies"
```

---

## Task 3: Ajouter le champ position à User

**Files:**
- Modify: `src/users/user.entity.ts`

- [ ] **Step 1: Ajouter le champ `position` dans l'entité**

Remplace `src/users/user.entity.ts` :

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

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  position: string | null;

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

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/users/user.entity.ts
git commit -m "feat: add PostGIS position field to User entity"
```

---

## Task 4: Implémenter updatePosition dans UsersService

**Files:**
- Modify: `src/users/users.service.ts`

- [ ] **Step 1: Écrire le test pour `updatePosition`**

Ajoute ce bloc `describe('updatePosition', ...)` dans `src/users/users.service.spec.ts`, après le bloc `describe('remove', ...)` :

```typescript
  describe('updatePosition', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.updatePosition('bad-id', 48.8566, 2.3522)).rejects.toThrow(NotFoundException);
    });

    it('should call raw query to update position', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      const queryMock = jest.fn().mockResolvedValue(undefined);
      (service as any).usersRepository.query = queryMock;
      await service.updatePosition('uuid-1', 48.8566, 2.3522);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('ST_SetSRID'),
        [2.3522, 48.8566, 'uuid-1'],
      );
    });
  });
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test --testPathPattern=users.service 2>&1 | tail -15
```

Expected: FAIL — `updatePosition` n'existe pas.

- [ ] **Step 3: Ajouter `updatePosition` dans `src/users/users.service.ts`**

Ajoute cette méthode à la fin de la classe `UsersService` :

```typescript
  async updatePosition(userId: string, latitude: number, longitude: number): Promise<void> {
    await this.findOne(userId);
    await this.usersRepository.query(
      `UPDATE "user" SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      [longitude, latitude, userId],
    );
  }
```

Note: ST_MakePoint prend `(longitude, latitude)` dans cet ordre (convention PostGIS).

- [ ] **Step 4: Lancer les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test --testPathPattern=users.service 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/users/users.service.ts src/users/users.service.spec.ts
git commit -m "feat: add updatePosition method to UsersService"
```

---

## Task 5: Créer le PositionGateway

**Files:**
- Create: `src/users/position.gateway.ts`
- Modify: `src/users/users.module.ts`

- [ ] **Step 1: Créer `src/users/position.gateway.ts`**

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';

interface UpdatePositionPayload {
  userId: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class PositionGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly usersService: UsersService) {}

  @SubscribeMessage('update-position')
  async handleUpdatePosition(
    @MessageBody() payload: UpdatePositionPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.usersService.updatePosition(
      payload.userId,
      payload.latitude,
      payload.longitude,
    );
    client.emit('position-updated', { userId: payload.userId });
  }
}
```

- [ ] **Step 2: Mettre à jour `src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PositionGateway } from './position.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, PositionGateway],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && npx tsc --noEmit 2>&1
```

Expected: aucune erreur.

- [ ] **Step 4: Lancer tous les tests**

```bash
cd /Users/aymeric/Desktop/Infflux-Delivery && pnpm test 2>&1 | tail -15
```

Expected: tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/users/position.gateway.ts src/users/users.module.ts
git commit -m "feat: add PositionGateway for real-time position updates"
```
