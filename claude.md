# CLAUDE.md — Infflux API

> Guide de travail pour Claude sur le projet **Infflux**. Mode **hackathon** : on privilégie la vitesse et la cohérence, sans sacrifier la lisibilité.

---

## 🚚 Le projet : Infflux

**Pitch** : la logistique collaborative, simple comme un trajet.
Des remorques prêtes, des livreurs disponibles, des livraisons optimisées.

**Le flow produit** :
1. **Préparation à l'entrepôt** — les employés chargent les remorques avec les commandes magasins.
2. **Publication de la livraison** — l'entrepôt publie une annonce (départ, arrivée, remorque, délai, rémunération).
3. **Les livreurs voient l'annonce** — ils consultent les livraisons disponibles sur une carte.
4. **Un livreur accepte** — il prend en charge la livraison et la démarre.

**Les acteurs** :
- **Entrepôt** (expéditeur) — publie les livraisons
- **Livreur partenaire** — accepte et effectue les livraisons
- **Magasin** (destinataire) — reçoit la marchandise
- *(Plateforme)* — orchestre le tout

---

## 🎯 Stack & choix techniques

- **Backend** : NestJS (TypeScript)
- **ORM** : TypeORM
- **DB** : PostgreSQL
- **Architecture** : Modulaire classique NestJS (un module par domaine métier)
- **Objectif** : MVP démontrable en fin de hackathon

> ⚠️ On est en hackathon : **shippé > parfait**. Les refactos peuvent attendre la soutenance.

---

## 🧭 Principes directeurs

1. **Pragmatisme d'abord** — si une solution simple marche, on la garde.
2. **Cohérence > perfection** — suivre les patterns déjà en place dans le repo.
3. **Lisibilité** — le code doit être compréhensible par toute l'équipe en 10 secondes.
4. **Itération rapide** — petits commits, features testables une par une.
5. **Pas de magie cachée** — préférer l'explicite à l'implicite.

---

## 📁 Structure du projet

```
src/
├── modules/
│   ├── auth/             # JWT, login, register (entrepôt vs livreur)
│   ├── users/            # Profils utilisateurs (tous rôles)
│   ├── warehouses/       # Entrepôts expéditeurs
│   ├── stores/           # Magasins destinataires
│   ├── trailers/         # Remorques (type, capacité m³/kg)
│   ├── deliveries/       # 🎯 cœur métier : annonces de livraison
│   └── matching/         # (optionnel) recherche géo des livraisons dispo
│
│   # Structure type d'un module :
│   └── <feature>/
│       ├── dto/
│       ├── entities/            # entités TypeORM
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       └── <feature>.module.ts
│
├── common/
│   ├── decorators/       # @CurrentUser, @Roles
│   ├── filters/
│   ├── guards/           # JwtAuthGuard, RolesGuard
│   └── pipes/
├── database/
│   ├── data-source.ts    # DataSource TypeORM (utilisé par la CLI)
│   ├── migrations/
│   └── seeds/
├── config/
├── app.module.ts
└── main.ts
```

**Règle** : un module = un domaine métier. Le module `deliveries` est le cœur du produit, il mérite le plus de soin.

---

## 🗺️ Modèle de données (entités TypeORM)

À adapter, mais pour cadrer :

```ts
// users/entities/user.entity.ts
export enum UserRole {
  WAREHOUSE = 'WAREHOUSE',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column({ type: 'enum', enum: UserRole }) role: UserRole;
  @Column() fullName: string;
  @Column({ nullable: true }) phone?: string;

  @CreateDateColumn() createdAt: Date;

  @OneToOne(() => Warehouse, (w) => w.owner) warehouse?: Warehouse;
  @OneToMany(() => Delivery, (d) => d.driver) deliveries: Delivery[];
}
```

```ts
// deliveries/entities/delivery.entity.ts
export enum DeliveryStatus {
  PUBLISHED = 'PUBLISHED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PUBLISHED })
  status: DeliveryStatus;

  @ManyToOne(() => Warehouse, (w) => w.deliveries, { eager: true })
  warehouse: Warehouse;

  @ManyToOne(() => Store, (s) => s.deliveries, { eager: true })
  store: Store;

  @ManyToOne(() => Trailer, (t) => t.deliveries, { eager: true })
  trailer: Trailer;

  @ManyToOne(() => User, (u) => u.deliveries, { nullable: true })
  driver?: User;

  @Column({ type: 'timestamptz' }) deadline: Date;
  @Column('float') price: number;

  @CreateDateColumn() publishedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) acceptedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) startedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) deliveredAt?: Date;
}
```

Entités support à créer sur le même modèle : `Warehouse` (name, address, lat/lng, owner), `Store` (name, address, lat/lng), `Trailer` (type, capacityM3, capacityKg).

---

## 🔌 Endpoints prévisionnels

Format REST simple, cohérent, préfixé `/api`.

**Auth**
- `POST /auth/register` — création de compte (role en body)
- `POST /auth/login` — retourne JWT

**Deliveries** (cœur produit)
- `POST /deliveries` — [WAREHOUSE] publier une livraison
- `GET /deliveries` — [DRIVER] lister les livraisons `PUBLISHED` (filtres : proximité, capacité, deadline)
- `GET /deliveries/:id` — détail d'une livraison
- `POST /deliveries/:id/accept` — [DRIVER] accepter
- `POST /deliveries/:id/start` — [DRIVER] démarrer
- `POST /deliveries/:id/complete` — [DRIVER] marquer livrée
- `GET /deliveries/mine` — livraisons de l'utilisateur connecté (selon son rôle)

**Ressources support**
- `GET /warehouses`, `GET /stores`, `GET /trailers` — lectures simples

> Pour le MVP : pas besoin de paiement réel, juste afficher le prix. Pas de notifs push réelles — WebSocket simple ou polling si besoin.

---

## ✅ Conventions de code

### Nommage
- **Fichiers** : `kebab-case` (`delivery.service.ts`, `delivery.entity.ts`)
- **Classes** : `PascalCase` + suffixe (`DeliveriesController`, `DeliveriesService`, `CreateDeliveryDto`)
- **Entités** : nom au singulier (`User`, `Delivery`), table au pluriel (`@Entity('users')`)
- **Variables/fonctions** : `camelCase`
- **Enums** : `PascalCase` pour le type, `SCREAMING_SNAKE_CASE` pour les valeurs

### TypeScript
- Toujours typer les retours des méthodes publiques de service.
- Pas de `any` — `unknown` si vraiment coincé.
- Ne jamais exposer les entités brutes avec des champs sensibles (`password`). Utiliser `select` explicite ou `class-transformer` (`@Exclude`).

### Controllers
- Rôle unique : recevoir, valider (DTO), déléguer au service, retourner.
- **Aucune logique métier** dans les controllers.
- Toujours un DTO validé pour le body.

### Services
- Contiennent la logique métier.
- Injectent les repositories via `@InjectRepository(Entity)`.
- Lancent des exceptions HTTP NestJS (`NotFoundException`, `ForbiddenException`, etc.).
- Les transitions de statut de `Delivery` passent par le service, jamais modifiées depuis le controller.

### DTOs
```ts
// create-delivery.dto.ts
import { IsDateString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID() storeId: string;
  @IsUUID() trailerId: string;
  @IsDateString() deadline: string;
  @IsNumber() @IsPositive() price: number;
}
```

### Pattern service type
```ts
@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  async findPublished() {
    return this.deliveryRepo.find({
      where: { status: DeliveryStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
  }

  async accept(id: string, driver: User) {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== DeliveryStatus.PUBLISHED) {
      throw new BadRequestException('Delivery is not available anymore');
    }
    delivery.status = DeliveryStatus.ACCEPTED;
    delivery.driver = driver;
    delivery.acceptedAt = new Date();
    return this.deliveryRepo.save(delivery);
  }
}
```

---

## 🗄️ TypeORM — bonnes pratiques

- **Un seul `DataSource`** défini dans `src/database/data-source.ts`, utilisé à la fois par l'app et la CLI.
- `synchronize: false` en permanence — **on ne compte pas dessus**, même en dev. Toujours passer par les migrations.
- Chaque module importe ses entités via `TypeOrmModule.forFeature([Entity])`.
- Utiliser le **Repository pattern** standard (`@InjectRepository`) — pas de custom repository sauf nécessité.
- **Relations `eager: true`** uniquement pour les relations quasi-toujours chargées (ex: `Delivery.warehouse` oui, `User.deliveries` non).
- Pour les requêtes complexes : `QueryBuilder` avec alias clairs, éviter les sous-requêtes imbriquées illisibles.
- Toujours `select` les champs sensibles explicitement, ou utiliser `@Column({ select: false })` sur `password`.

### Migrations
```bash
# Générer une migration à partir des entités modifiées
npm run migration:generate -- src/database/migrations/AddXxx

# Créer une migration vide (pour du SQL custom)
npm run migration:create -- src/database/migrations/SeedYyy

# Appliquer
npm run migration:run

# Revenir en arrière (une seule)
npm run migration:revert
```

> Commit `schema` + migrations **ensemble**. Jamais de migration non committée.

### Géo (livreurs proches)
Commencer simple avec un filtre carré (lat/lng ± delta) via `QueryBuilder`. Passer à PostGIS seulement si vraiment nécessaire.

---

## 🔐 Règles métier importantes

À faire respecter **dans les services** (pas dans les controllers) :

1. Seul un user `WAREHOUSE` peut créer une `Delivery`.
2. Seul un user `DRIVER` peut `accept` / `start` / `complete`.
3. Une `Delivery` ne peut être acceptée que si son statut est `PUBLISHED`.
4. Transitions de statut autorisées : `PUBLISHED → ACCEPTED → IN_PROGRESS → DELIVERED`. Toute autre transition = `BadRequestException`.
5. Un livreur ne peut pas accepter ses propres livraisons (si un jour un user est WAREHOUSE + DRIVER).
6. Quand une `Delivery` passe à `ACCEPTED`, renseigner `driver` + `acceptedAt`.

---

## 🔐 Sécurité

- Jamais de `.env` committé. `.env.example` uniquement.
- Passwords hashés (`bcrypt`).
- `ValidationPipe` global avec `whitelist: true` et `forbidNonWhitelisted: true`.
- CORS explicite dans `main.ts`.
- JWT : secret via env, expiration raisonnable (ex: 7j pour la démo).
- Guards `JwtAuthGuard` + `RolesGuard` avec décorateur `@Roles(UserRole.WAREHOUSE)`.
- `password` avec `@Column({ select: false })` pour ne jamais remonter par défaut.

---

## 🛠️ Commandes utiles

```bash
# Dev
npm run start:dev

# Migrations TypeORM (via scripts npm)
npm run migration:generate -- src/database/migrations/<Nom>
npm run migration:run
npm run migration:revert

# Seed de données de démo
npm run seed

# Qualité
npm run lint
npm run format
```

> Les scripts `migration:*` s'appuient sur `data-source.ts`. Exemple dans `package.json` :
> `"migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts"`

---

## 🤖 Instructions pour Claude

Quand tu travailles sur ce projet :

1. **Avant de coder** : regarde un module existant similaire et copie sa structure.
2. **Génération** : utilise `nest g resource <nom>` (choisir REST + pas de CRUD auto) puis adapter.
3. **Modifs d'entité** : toujours proposer `npm run migration:generate` après. Jamais de `synchronize`.
4. **Validation** : tout endpoint public → DTO validé.
5. **Règles métier** : elles vivent dans les services. Jamais dans les controllers.
6. **Transitions de statut** de `Delivery` : toujours vérifier le statut courant avant d'autoriser une transition.
7. **Relations TypeORM** : réfléchir à `eager` vs `lazy` vs chargement explicite par cas d'usage. Par défaut, chargement explicite avec `relations: [...]` dans le service.
8. **Pas de tests unitaires** par défaut (hackathon). Si je les demande, oui.
9. **Réponses concises** : code qui marche, explication brève.
10. **Doute archi** ? Propose 2 options courtes, laisse-moi choisir.
11. **Nouvelles dépendances** : signale-les, ne les ajoute pas en douce.
12. **Cohérence produit** : on parle d'Infflux, d'entrepôts, de livreurs, de remorques, de magasins. Utilise ce vocabulaire dans les noms, commentaires, messages d'erreur.

---

## 📦 Format de réponse API

Simple et uniforme.

**Succès** : la donnée directement.
```json
{ "id": "...", "status": "PUBLISHED", "price": 85 }
```

**Erreur** : format NestJS par défaut.
```json
{ "statusCode": 404, "message": "Delivery not found", "error": "Not Found" }
```

Pas de wrapper `{ success: true, data: ... }` sauf décision explicite.

---

## 🚀 Workflow git

- `main` = ce qui tourne / ce qu'on démontre
- Branches : `feat/<nom-court>` (ex: `feat/delivery-accept`)
- Commits : `feat:`, `fix:`, `chore:`, `refactor:` (convention légère)
- Merge sans drame, relecture rapide, pas besoin de 3 approvals.

---

## 🎤 Checklist avant la démo

- [ ] `.env.example` à jour
- [ ] README : 3 commandes pour lancer (install, migration:run, start)
- [ ] Seed exécutable avec scénario complet :
    - 1 entrepôt "Influx" + son user WAREHOUSE
    - 2-3 magasins (dont un E.Leclerc pour matcher le mockup)
    - 2-3 remorques (12m³/1200kg au moins)
    - 1-2 livreurs DRIVER
    - 3-4 livraisons `PUBLISHED` prêtes à être acceptées
- [ ] Parcours complet testé : register WAREHOUSE → login → POST delivery → register DRIVER → login → GET deliveries → accept → start → complete
- [ ] Logs propres, pas de `console.log` oubliés
- [ ] Le projet démarre from scratch sur la machine de démo (migrations + seed OK)

---

*Ce document vit avec le projet. Si une règle devient gênante, on la change. L'important c'est qu'on soit tous alignés sur Infflux.*