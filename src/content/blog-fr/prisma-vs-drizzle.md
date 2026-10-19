---
# Machine-drafted French translation; set `reviewed: true` after native review.
reviewed: false
title: "Prisma ou Drizzle : pourquoi je choisis l’ORM le plus léger"
description: "Une comparaison concrète de Prisma et Drizzle, et pourquoi la couche fine et proche du SQL de Drizzle l’emporte pour la plupart des back-ends TypeScript que je construis."
---

Nous avons peut-être tous choisi un ORM de la même façon : celui du dernier tutoriel suivi.  
Pendant longtemps, en TypeScript, c’était Prisma.  
On écrit un schéma, on lance `prisma generate`, on obtient un client magnifiquement typé. Terminé.

Imaginez maintenant ceci : une salle de 750 places, une finale de Coupe du monde et une page d’inscription qui s’ouvre devant la foule.  
Deux personnes appuient sur « S’inscrire » pour la dernière place à la même milliseconde.  
Une seule l’obtient.  
C’est la base de données qui tranche, pas le navigateur.

C’était [Stone Watch Party](/fr/projects/stone-watch-party), et j’ai construit sa couche de données avec Drizzle ; ce n’était pas un pile ou face.  
Voici comment les deux ORM se comparent, là où Prisma garde l’avantage, et pourquoi Drizzle est désormais mon choix par défaut.

## Deux philosophies

Les deux offrent un accès typé à la base de données.  
Ils y arrivent par des chemins opposés.

**Prisma fait abstraction du SQL.**  
Vous décrivez vos données dans son propre langage de schéma (`schema.prisma`), Prisma en génère un client, et vous interrogez la base avec des objets : `findMany`, `include`, `create` imbriqués.  
Vous pensez rarement en jointures.

**Drizzle, _c’est_ du SQL typé.**  
Votre schéma est du TypeScript ordinaire. Les requêtes se lisent comme le SQL qu’elles produisent : `select`, `from`, `where`, `innerJoin`.  
Il n’y a rien à générer ; les types viennent directement de vos définitions de tables.

> Prisma vous demande d’apprendre Prisma. Drizzle vous demande de connaître le SQL.

Votre préférence dépend de celle de ces deux phrases qui ressemble pour vous à un coût.

## Le schéma

Les deux mêmes tables dans chacun. D’abord Prisma :

```prisma
model Event {
  id            String         @id @default(uuid())
  name          String
  capacity      Int
  seatsLeft     Int            @map("seats_left")
  registrations Registration[]
}

model Registration {
  id      String @id @default(uuid())
  email   String
  eventId String @map("event_id")
  event   Event  @relation(fields: [eventId], references: [id])

  @@unique([eventId, email])
}
```

Puis Drizzle :

```typescript
import { integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  seatsLeft: integer("seats_left").notNull(),
});

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    eventId: uuid("event_id").notNull().references(() => events.id),
  },
  (t) => [unique().on(t.eventId, t.email)],
);
```

Soyons honnêtes : le schéma Prisma est plus facile à lire. Il est compact, et un nouveau coéquipier le parcourt en quelques secondes.

Mais le schéma Drizzle, _c’est juste du code_.  
Je peux l’importer, le composer, partager des helpers de colonnes entre les tables et en dériver des validateurs Zod avec `drizzle-zod`.  
Pas d’extension nécessaire pour la coloration syntaxique, pas de langage à part dans le dépôt, et le compilateur TypeScript est le seul outil qui doit le comprendre.

## Les requêtes : là où la différence se voit

Revenons à la dernière place.  
La façon sûre de la réserver est une seule mise à jour conditionnelle : décrémenter uniquement s’il reste une place, et insérer l’inscription dans la même transaction.

Avec Drizzle :

```typescript
const registration = await db.transaction(async (tx) => {
  const [event] = await tx
    .update(events)
    .set({ seatsLeft: sql`${events.seatsLeft} - 1` })
    .where(and(eq(events.id, eventId), gt(events.seatsLeft, 0)))
    .returning({ seatsLeft: events.seatsLeft });

  if (!event) return null; // Sold out: the WHERE clause matched nothing

  const [row] = await tx
    .insert(registrations)
    .values({ eventId, email })
    .returning();

  return row;
});
```

Si vous connaissez le SQL, vous savez déjà ce que cela exécute.  
`UPDATE events SET seats_left = seats_left - 1 WHERE id = $1 AND seats_left > 0 RETURNING seats_left`.  
Aucune devinette.

Prisma sait le faire aussi :

```typescript
const registration = await prisma.$transaction(async (tx) => {
  const { count } = await tx.event.updateMany({
    where: { id: eventId, seatsLeft: { gt: 0 } },
    data: { seatsLeft: { decrement: 1 } },
  });

  if (count === 0) return null;

  return tx.registration.create({ data: { eventId, email } });
});
```

Parfaitement correct.  
Mais remarquez le détour : pour rendre la mise à jour conditionnelle, je dois utiliser `updateMany` sur une seule ligne, parce que `update` exige un `where` unique.  
Voilà la « taxe Prisma » en résumé.  
L’abstraction est agréable jusqu’au moment où vous avez besoin de la requête exacte que vous aviez en tête ; vous traduisez alors du SQL en Prisma en espérant que la traduction inverse tienne.

Pour les 10 % de requêtes qui n’entrent dans aucune des deux API, le template `sql` de Drizzle s’insère n’importe où, typé et paramétré.  
Prisma propose `$queryRaw` et TypedSQL, qui fonctionnent, mais on a l’impression de sortir de l’ORM plutôt que de passer par lui.

Et quand vous _voulez_ la lecture imbriquée façon Prisma, Drizzle a une API de requêtes relationnelles :

```typescript
const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
  with: { registrations: true },
});
```

Une seule instruction SQL, un résultat typé, `registrations` inclus.  
Vous définissez les relations une fois avec `relations()`, et vous retrouvez l’essentiel de ce qui rendait Prisma agréable.

## La légèreté, c’est tout l’intérêt

C’est ce qui m’a convaincu.

**Drizzle est une couche fine au-dessus de votre driver.**  
Le cœur pèse environ 7,4 Ko minifié et compressé en gzip, sans aucune dépendance.  
Il s’appuie sur `postgres`, `pg`, le driver HTTP de Neon, Cloudflare D1, libSQL et d’autres.  
Ce que vous installez est ce qui s’exécute.

**Il n’y a pas d’étape de génération.**  
Modifiez une colonne, enregistrez le fichier, et les types se mettent à jour. Pas de `prisma generate` dans votre script de build, pas de client périmé après un `git pull`, pas de « pourquoi ce champ manque-t-il ? » jusqu’à ce que vous pensiez à régénérer.

**Il tourne partout où tourne JavaScript.**  
Fonctions serverless, runtimes edge, Bun, Deno.  
Les démarrages à froid restent courts parce qu’il y a très peu à charger.

Pour être juste envers Prisma : le reproche « Prisma embarque un énorme binaire Rust » n’est plus d’actualité.  
Prisma 7 a supprimé le moteur de requêtes Rust, est passé aux driver adapters et a considérablement réduit son empreinte.  
Si c’était votre seule objection, jetez-y un nouveau coup d’œil.

Mais plus léger ne veut pas dire léger.  
Prisma garde un générateur de code, un client généré à maintenir synchronisé et une abstraction entre vous et la requête.  
Drizzle n’a rien de tout cela, par conception.

## Les migrations

Les deux gèrent les migrations, avec des instincts différents.

**Prisma Migrate** offre l’expérience la plus guidée.  
`prisma migrate dev` compare votre schéma, écrit le SQL, l’applique sur une base fantôme et vous avertit en cas de dérive.  
Pour les équipes qui veulent des garde-fous, c’est excellent.

**Drizzle Kit** fournit les mêmes briques avec moins d’opinions :

```bash
bunx drizzle-kit generate  # Diff the schema, write a SQL migration file
bunx drizzle-kit migrate   # Apply pending migrations
bunx drizzle-kit push      # Sync the schema directly (prototyping only)
bunx drizzle-kit pull      # Introspect an existing database into a schema
```

Les migrations générées sont de simples fichiers SQL que vous commitez et relisez.  
`push` est génial pour un prototype du week-end et dangereux près de la production ; traitez-le comme un `--force`.

## Là où Prisma garde l’avantage

Je ne suis pas là pour descendre Prisma. C’est le meilleur choix quand :

- **Votre équipe maîtrise mal le SQL.** L’API de Prisma protège des pièges que Drizzle vous tend volontiers.
- **Vous voulez la documentation et l’écosystème les plus matures.** Des années de guides, de réponses Stack Overflow et d’intégrations, ça compte.
- **Vous comptez sur les écritures imbriquées.** Créer un utilisateur avec son profil et trois articles en un seul appel est vraiment agréable avec Prisma.
- **Vous préférez les garde-fous au contrôle.** La détection de dérive et la base fantôme de Prisma Migrate attrapent les erreurs avant la production.

Et Drizzle a de vrais compromis.  
Il faut être à l’aise avec le SQL.  
L’API a évolué vite, et l’API de requêtes relationnelles a changé de forme en route vers la 1.0 : figez vos versions et lisez le changelog avant de mettre à jour.

## La comparaison rapide

| | Prisma | Drizzle |
|---|---|---|
| Schéma | `schema.prisma` (DSL propre) | TypeScript |
| Types | Générés (`prisma generate`) | Inférés, sans étape de build |
| Style de requête | API objet | Builder proche du SQL + API relationnelle |
| SQL brut | `$queryRaw`, TypedSQL | Template `sql`, composable partout |
| Empreinte | Bien plus légère depuis la v7, mais toujours un client généré | Cœur d’environ 7,4 Ko, aucune dépendance |
| Migrations | Prisma Migrate (guidé) | Drizzle Kit (fichiers SQL simples) |
| Idéal pour | Les équipes qui veulent une abstraction | Les développeurs qui pensent en SQL |

## Ce que je ferais différemment

- **Écrire le test de concurrence en premier.** Sur Stone Watch Party, les tests d’intégration qui envoient des inscriptions simultanées sur la dernière place ont attrapé plus de problèmes que n’importe quelle revue de code. Quel que soit l’ORM choisi, la base de données fait autorité ; testez donc contre une vraie base.
- **Figer Drizzle et Drizzle Kit ensemble.** Leurs versions évoluent séparément, et une paire désaccordée produit des diffs de migration déroutants.

## À retenir

Prisma est un excellent produit construit sur un pari : que la plupart des développeurs préfèrent ne pas écrire de SQL.  
Pour beaucoup d’équipes, ce pari est gagnant.

Mon pari est l’inverse.  
Le SQL est la seule compétence en bases de données qui ne se démode jamais, et je veux un ORM qui le type, pas un ORM qui le cache. Drizzle me donne la sécurité des types, une empreinte minuscule, aucune génération de code et des requêtes que je lis directement sur la page.

Si vous démarrez un nouveau back-end TypeScript et que vous êtes à l’aise avec le SQL, commencez par Drizzle.  
Si votre équipe ne l’est pas, Prisma reste un excellent choix.

> Le meilleur ORM est celui qui se fait oublier. Drizzle y parvient presque toujours.
