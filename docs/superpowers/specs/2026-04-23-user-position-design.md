# User Position (PostGIS + WebSocket) Design

**Date:** 2026-04-23
**Projet:** Infflux Delivery (NestJS + TypeORM + PostGIS)

## Contexte

Les livreurs ont une position GPS qui se met à jour toutes les 10 secondes via WebSocket (Socket.io). Cette position est stockée en PostGIS pour permettre des requêtes de proximité.

---

## 1. Infrastructure

- `docker-compose.yml` : image `postgres:15-alpine` → `postgis/postgis:15-alpine`
- L'extension PostGIS est activée au démarrage de l'app via un listener TypeORM sur l'événement `afterConnect` dans `AppModule`

---

## 2. User entity

Nouveau champ nullable sur `User` :

```typescript
@Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
position: string | null;
```

- `nullable: true` — un user n'a pas forcément de position
- Mise à jour via requête SQL brute : `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`
- `synchronize: true` crée automatiquement la colonne au démarrage

---

## 3. WebSocket Gateway

Fichier : `src/users/position.gateway.ts`

- Déclaré dans `UsersModule`
- Namespace : `/` (default)

**Événements :**

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Serveur | `update-position` | `{ userId: string, latitude: number, longitude: number }` |
| Serveur → Client | `position-updated` | `{ userId: string }` |

**Flux :**
1. Client se connecte via Socket.io
2. Client émet `update-position` toutes les 10s
3. Gateway appelle `UsersService.updatePosition(userId, latitude, longitude)`
4. Gateway émet `position-updated` en retour au client

---

## 4. UsersService

Nouvelle méthode :

```typescript
async updatePosition(userId: string, latitude: number, longitude: number): Promise<void>
```

- Vérifie que le user existe (`findOne`)
- Met à jour via requête SQL brute avec `ST_SetSRID(ST_MakePoint($1, $2), 4326)`

---

## 5. Dépendances à ajouter

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

---

## 6. Fichiers créés / modifiés

| Action | Fichier |
|--------|---------|
| MODIFY | `docker-compose.yml` — image postgis |
| MODIFY | `src/app.module.ts` — activer extension PostGIS afterConnect |
| MODIFY | `src/users/user.entity.ts` — ajouter champ `position` |
| MODIFY | `src/users/users.service.ts` — ajouter `updatePosition()` |
| MODIFY | `src/users/users.module.ts` — déclarer `PositionGateway` |
| CREATE | `src/users/position.gateway.ts` |
| MODIFY | `package.json` — ajouter socket.io deps |
