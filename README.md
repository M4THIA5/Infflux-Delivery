# Infflux Delivery API

API REST NestJS pour la gestion de livraisons, livreurs, entrepots et incidents.

## Stack

- **Framework** : NestJS 11
- **Base de données** : PostgreSQL 16 (TypeORM, synchronize)
- **Auth** : JWT (Passport)
- **Validation** : class-validator

## Installation

```bash
pnpm install
```

## Variables d'environnement

Crée un fichier `.env` à la racine :

```env
PORT=3000
DATABASE_URL="postgresql://admin:password@localhost:5432/mydb?schema=public"
JWT_SECRET="change_this_secret_in_production"
```

## Base de données

Lancer PostgreSQL avec Docker :

```bash
docker-compose up -d
```

## Démarrage

```bash
# développement
pnpm start:dev

# production
pnpm start:prod
```

Le serveur démarre sur `http://localhost:3000`.

## Base de données — scripts

```bash
pnpm db:seed    # insère les données initiales (idempotent)
pnpm db:reset   # vide toutes les tables
pnpm db:fresh   # reset + seed en une commande
```

## Tests

```bash
pnpm test           # tests unitaires
pnpm test:e2e       # tests end-to-end
pnpm test:cov       # couverture de code
```

## Authentification

Toutes les routes (sauf `POST /auth/login`) nécessitent un token JWT.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@infflux.dev",
  "password": "admin123"
}
```

Réponse :

```json
{
  "access_token": "<jwt>",
  "user": { ... }
}
```

### Utilisation du token

```http
Authorization: Bearer <access_token>
```

### Utilisateur connecté

```http
GET /auth/me
```

## Routes

### Users `/users`

> Toutes les routes sont protégées par JWT. Création, modification et suppression réservées aux `ADMIN`.

| Méthode | Route | Description |
| ------- | ----- | ----------- |
| `POST` | `/users` | Créer un utilisateur |
| `GET` | `/users` | Lister les utilisateurs (`?role=ADMIN`, `DELIVER` ou `CUSTOMER`) |
| `GET` | `/users/:id` | Récupérer un utilisateur |
| `PATCH` | `/users/:id` | Modifier un utilisateur |
| `DELETE` | `/users/:id` | Supprimer un utilisateur |

### Entrepots `/entrepots`

| Méthode | Route | Description |
| ------- | ----- | ----------- |
| `POST` | `/entrepots` | Créer un entrepot |
| `GET` | `/entrepots` | Lister les entrepots |
| `GET` | `/entrepots/:id` | Récupérer un entrepot |
| `PATCH` | `/entrepots/:id` | Modifier un entrepot |
| `DELETE` | `/entrepots/:id` | Supprimer un entrepot |

### Incidents `/incidents`

| Méthode | Route | Description |
| ------- | ----- | ----------- |
| `POST` | `/incidents` | Créer un incident |
| `GET` | `/incidents` | Lister les incidents |
| `GET` | `/incidents/:id` | Récupérer un incident |
| `GET` | `/incidents/course/:courseId` | Incidents d'une course |
| `PATCH` | `/incidents/:id` | Modifier un incident |
| `DELETE` | `/incidents/:id` | Supprimer un incident |

Types d'incident : `ROUTIER`, `CASSE`, `PERTE`, `PAUSE_CAFE`, `DOUANE`

## Données de test (seed)

| Email | Rôle | Mot de passe |
| ----- | ---- | ------------ |
| `admin@infflux.dev` | ADMIN | `admin123` |
| `lina.martin@infflux.dev` | DELIVER | `deliver123` |
| `samir.diallo@infflux.dev` | DELIVER | `deliver123` |
| `claire.dubois@infflux.dev` | CUSTOMER | `customer123` |
| `yassine.benali@infflux.dev` | CUSTOMER | `customer123` |
