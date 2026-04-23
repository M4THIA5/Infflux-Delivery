# Infflux Delivery API

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
pnpm install
```

## Prisma (migrations, client, seed)

Avant d'executer les commandes Prisma, verifie que `DATABASE_URL` est defini (ex: fichier `.env`).

### 1) Generer le client Prisma

Utilite: regenere le client TypeScript dans `src/generated/prisma` apres un changement de schema.

```bash
pnpm exec prisma generate
```

### 2) Creer et appliquer une migration en developpement

Utilite: cree une nouvelle migration SQL a partir du schema Prisma, puis l'applique a la base locale.

```bash
pnpm exec prisma migrate dev --name nom_de_la_migration
```

Exemple:

```bash
pnpm exec prisma migrate dev --name add_delivery_fields
```

### 3) Appliquer les migrations en environnement de deploiement

Utilite: applique uniquement les migrations deja commitees (commande recommandee en CI/prod).

```bash
pnpm exec prisma migrate deploy
```

### 4) Verifier l'etat des migrations

Utilite: compare l'etat local et l'etat en base pour detecter les migrations manquantes ou le drift.

```bash
pnpm exec prisma migrate status
```

### 5) Reinitialiser la base en developpement

Utilite: supprime/recree la base, reapplique toutes les migrations, puis lance le seed si configure.

```bash
pnpm exec prisma migrate reset
```

### 6) Lancer les seeds

Utilite: injecte des donnees initiales (admin, catalogues, jeux de test, etc.).

```bash
pnpm exec prisma db seed
```

### 7) Ouvrir Prisma Studio

Utilite: interface web locale pour consulter/modifier les donnees de la base.

```bash
pnpm exec prisma studio
```

### 8) Actions Prisma utiles selon le contexte

- Synchroniser rapidement le schema vers la base sans creer de migration (prototype/dev rapide):

```bash
pnpm exec prisma db push
```

- Importer la structure d'une base existante vers `prisma/schema.prisma` (introspection):

```bash
pnpm exec prisma db pull
```

- Formatter le schema Prisma:

```bash
pnpm exec prisma format
```

- Ouvrir les docs CLI Prisma:

```bash
pnpm exec prisma --help
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
