# Migration Prisma → TypeORM

**Date:** 2026-04-23  
**Projet:** Infflux Delivery (NestJS + PostgreSQL)

## Contexte

Le projet utilise actuellement Prisma 7 avec `@prisma/adapter-pg`. On migre vers TypeORM avec `@nestjs/typeorm` en mode `synchronize: true` et une architecture en modules NestJS feature.

---

## 1. Dépendances

### Supprimer
- `@prisma/client`
- `@prisma/adapter-pg`
- `prisma` (devDependency)
- `prisma.config.ts`
- Champ `"prisma"` dans `package.json`
- Dossier `prisma/` entier (schema, migrations, seed)
- `src/prisma.service.ts`

### Ajouter
- `typeorm`
- `@nestjs/typeorm`
- `pg`
- `@types/pg`

---

## 2. Structure en modules

```
src/
  users/
    user.entity.ts
    users.module.ts
    users.service.ts
    users.controller.ts
  entrepots/
    entrepot.entity.ts
    entrepots.module.ts
    entrepots.service.ts
    entrepots.controller.ts
  courses/
    course.entity.ts
    courses.module.ts
    courses.service.ts
    courses.controller.ts
  incidents/
    incident.entity.ts
    incidents.module.ts
    incidents.service.ts
    incidents.controller.ts
  app.module.ts
  main.ts
```

Chaque module :
- Déclare son entité via `TypeOrmModule.forFeature([Entity])`
- Expose un service avec le repository injecté via `@InjectRepository()`
- Expose un controller (vide pour l'instant, prêt pour les routes)

---

## 3. Entités TypeORM

### Enums
```typescript
// users/user.entity.ts
export enum UserRole { ADMIN = 'ADMIN', DELIVER = 'DELIVER', CUSTOMER = 'CUSTOMER' }

// incidents/incident.entity.ts
export enum IncidentType { ROUTIER = 'ROUTIER', CASSE = 'CASSE', PERTE = 'PERTE', PAUSE_CAFE = 'PAUSE_CAFE', DOUANE = 'DOUANE' }
```

### User
- `id` : uuid (`@PrimaryGeneratedColumn('uuid')`)
- `role` : enum `UserRole`
- `name`, `email` (unique), `password` : string
- `isActive` : boolean, default `true`
- `createdAt`, `updatedAt` : timestamps auto
- Relations : `customerCourses` (1-N Course), `deliveredCourses` (1-N Course), `incidents` (1-N Incident)

### Entrepot
- `id` : uuid
- `addresse` : string
- `createdAt`, `updatedAt` : timestamps auto
- Relation : `courses` (1-N Course)

### Course
- `id` : uuid
- `dateHeureDebut` : Date
- `dateHeureArrivee` : Date (nullable)
- `prix` : decimal(10,2)
- `adresseLivraison` : string
- `createdAt`, `updatedAt` : timestamps auto
- Relations : `customer` (N-1 User), `deliverer` (N-1 User, nullable), `entrepot` (N-1 Entrepot), `incidents` (1-N Incident)

### Incident
- `id` : uuid
- `type` : enum `IncidentType`
- `commentaire` : string
- `createdAt` : timestamp auto
- Relations : `course` (N-1 Course), `user` (N-1 User)

---

## 4. AppModule

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Entrepot, Course, Incident],
  synchronize: true,
})
```

Importe : `UsersModule`, `EntrepotsModule`, `CoursesModule`, `IncidentsModule`.

---

## 5. Seed

```
database/
  seeds/
    seed.ts          ← DataSource + appel des seeders
    user.seed.ts     ← upsert des users par email
  data/
    user.json        ← données existantes (inchangées)
```

`seed.ts` instancie un `DataSource` TypeORM directement (sans NestJS), initialise la connexion, appelle `seedUsers`, puis détruit la connexion.

Script dans `package.json` : `"seed": "tsx database/seeds/seed.ts"`

---

## 6. Ce qui ne change pas
- `docker-compose.yml`
- `database/data/user.json` (données de seed)
- Configuration Jest
- `tsconfig.json`
