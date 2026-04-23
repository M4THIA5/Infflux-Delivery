# Courses CRUD Design

**Date:** 2026-04-23
**Projet:** Infflux Delivery (NestJS + TypeORM + PostGIS)

## Contexte

Le module `courses` existe avec son entité TypeORM et un service/controller vides. On ajoute le CRUD complet, la proposition WebSocket aux livreurs, l'acceptation, et un cron de re-proposition toutes les 30s.

---

## 1. Entrepot entity — ajout lat/lng

Deux nouvelles colonnes nullable sur `Entrepot` :

```typescript
@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
latitude: number | null;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
longitude: number | null;
```

Nouveau `CreateEntrepotDto` et `UpdateEntrepotDto` avec `@IsNumber()` optionnels sur lat/lng.

---

## 2. Routes Course

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/courses` | Créer une course → déclenche proposition WebSocket |
| GET | `/courses/nearby` | Courses proches sans livreur (`?lat=X&lng=Y&radius=5000`) |
| GET | `/courses/:id` | Voir une course avec ses relations |
| PATCH | `/courses/:id` | Modifier une course |
| DELETE | `/courses/:id` | Supprimer (admin) |
| POST | `/courses/:id/accept` | Accepter une course (set delivererId) |

### DTOs

**`CreateCourseDto`:**
- `dateHeureDebut` : string ISO date (`@IsDateString`)
- `prix` : number (`@IsNumber`)
- `adresseLivraison` : string (`@IsNotEmpty`)
- `customerId` : string uuid (`@IsUUID`)
- `entrepotId` : string uuid (`@IsUUID`)
- `delivererId` : string uuid optionnel (`@IsOptional @IsUUID`)

**`UpdateCourseDto`:** `PartialType(CreateCourseDto)`

**`AcceptCourseDto`:**
- `delivererId` : string uuid (`@IsUUID`)

### GET /courses/nearby
- Filtre : `delivererId IS NULL`
- Utilise PostGIS `ST_DWithin` sur la position de l'entrepôt (lat/lng) et les coordonnées passées en query
- Rayon par défaut : 5000 mètres
- Query params : `lat` (number), `lng` (number), `radius` (number, optionnel)

---

## 3. CourseGateway WebSocket

Fichier : `src/courses/course.gateway.ts`, déclaré dans `CoursesModule`.

| Direction | Event | Payload |
|-----------|-------|---------|
| Serveur → Client | `course-proposed` | `{ course }` |
| Client → Serveur | `accept-course` | `{ courseId: string, delivererId: string }` |
| Serveur → Client | `course-accepted` | `{ courseId: string, delivererId: string }` |

**Flux création :**
1. `POST /courses` → `CoursesService.create()` → émet `course-proposed` à tous

**Flux acceptation WebSocket :**
1. Client émet `accept-course`
2. Gateway appelle `CoursesService.accept(courseId, delivererId)`
3. Gateway émet `course-accepted` à tous

---

## 4. Cron re-proposition

`@Cron('*/30 * * * * *')` dans `CourseGateway` (ou service dédié).
Toutes les 30 secondes : cherche toutes les courses avec `delivererId IS NULL` → re-émet `course-proposed` pour chacune.

---

## 5. CoursesService

Méthodes :
- `create(dto)` — crée la course, vérifie que `customerId` et `entrepotId` existent, retourne la course
- `findNearby(lat, lng, radius)` — requête PostGIS `ST_DWithin` sur entrepot lat/lng
- `findOne(id)` — avec relations (customer, deliverer, entrepot), lève `NotFoundException`
- `update(id, dto)` — modifie, lève `NotFoundException`
- `remove(id)` — supprime, lève `NotFoundException`
- `accept(id, delivererId)` — set `delivererId`, lève `NotFoundException` si course ou livreur absent, lève `ConflictException` si déjà acceptée
- `findPending()` — courses avec `delivererId IS NULL` (pour le cron)

---

## 6. Dépendances à ajouter

- `@nestjs/schedule` — cron jobs

---

## 7. Fichiers créés / modifiés

| Action | Fichier |
|--------|---------|
| MODIFY | `src/entrepots/entrepot.entity.ts` — ajouter latitude/longitude |
| CREATE | `src/entrepots/dto/create-entrepot.dto.ts` |
| CREATE | `src/entrepots/dto/update-entrepot.dto.ts` |
| MODIFY | `src/entrepots/entrepots.service.ts` — ajouter create/update/remove |
| MODIFY | `src/entrepots/entrepots.controller.ts` — ajouter routes CRUD |
| MODIFY | `src/entrepots/entrepots.module.ts` — exporter service |
| CREATE | `src/courses/dto/create-course.dto.ts` |
| CREATE | `src/courses/dto/update-course.dto.ts` |
| CREATE | `src/courses/dto/accept-course.dto.ts` |
| MODIFY | `src/courses/courses.service.ts` — CRUD + accept + findNearby + findPending |
| MODIFY | `src/courses/courses.controller.ts` — 6 routes |
| CREATE | `src/courses/course.gateway.ts` — WebSocket + cron |
| MODIFY | `src/courses/courses.module.ts` — déclarer CourseGateway + ScheduleModule |
| MODIFY | `src/app.module.ts` — importer ScheduleModule.forRoot() |
| MODIFY | `package.json` — ajouter @nestjs/schedule |
