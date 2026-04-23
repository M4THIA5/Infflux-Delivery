# User Routes Design

**Date:** 2026-04-23
**Projet:** Infflux Delivery (NestJS + TypeORM)

## Contexte

Le module `users` existe avec son entité TypeORM et un service minimal. On ajoute les routes CRUD REST complètes avec validation, gestion d'erreurs, hachage du password, et exclusion du password dans les réponses.

---

## 1. Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/users` | Créer un user |
| GET | `/users` | Lister tous les users (filtre optionnel `?role=ADMIN\|DELIVER\|CUSTOMER`) |
| GET | `/users/:id` | Voir un user |
| PATCH | `/users/:id` | Modifier partiellement un user |
| DELETE | `/users/:id` | Supprimer un user |

Pas de guards pour l'instant — l'authentification sera ajoutée dans une prochaine itération.

---

## 2. DTOs

### `dto/create-user.dto.ts`
- `role` : `UserRole` (enum, obligatoire)
- `name` : string, non vide (`@IsNotEmpty`)
- `email` : string, format email valide (`@IsEmail`)
- `password` : string, min 6 caractères (`@MinLength(6)`)
- `isActive` : boolean, optionnel (`@IsOptional`), défaut `true`

### `dto/update-user.dto.ts`
- `PartialType(CreateUserDto)` — tous les champs de CreateUserDto rendus optionnels

---

## 3. Service

Méthodes ajoutées à `UsersService` :

| Méthode | Comportement |
|---------|-------------|
| `create(dto)` | Hash le password avec bcrypt, crée le user. Lève `ConflictException` si l'email existe déjà |
| `findAll(role?)` | Retourne tous les users, filtrés par rôle si fourni |
| `findOne(id)` | Retourne le user ou lève `NotFoundException` |
| `update(id, dto)` | Modifie partiellement. Si `password` fourni, le re-hashe. Lève `NotFoundException` |
| `remove(id)` | Supprime le user. Lève `NotFoundException` |

---

## 4. Sécurité des réponses

Le champ `password` n'est **jamais** retourné dans les réponses HTTP :
- `@Exclude()` sur la propriété `password` de l'entité `User`
- `ClassSerializerInterceptor` activé globalement dans `main.ts`

---

## 5. Dépendances à ajouter

- `bcrypt` + `@types/bcrypt` — hachage du password
- `class-validator` + `class-transformer` — validation des DTOs
- `ValidationPipe` global dans `main.ts`

---

## 6. Fichiers créés / modifiés

| Action | Fichier |
|--------|---------|
| CREATE | `src/users/dto/create-user.dto.ts` |
| CREATE | `src/users/dto/update-user.dto.ts` |
| MODIFY | `src/users/users.service.ts` |
| MODIFY | `src/users/users.controller.ts` |
| MODIFY | `src/users/user.entity.ts` (ajouter `@Exclude()` sur password) |
| MODIFY | `src/main.ts` (ValidationPipe + ClassSerializerInterceptor) |
| MODIFY | `package.json` (ajouter bcrypt, class-validator, class-transformer) |
