---
title: "Prisma vs. Drizzle: Why I Reach for the Lighter ORM"
description: "A practical comparison of Prisma and Drizzle, and why Drizzle's thin, SQL-shaped layer wins for most of the TypeScript backends I build."
date: 2026-10-19
featured: false
tags: ["database", "postgres", "typescript", "orm"]
---



We've maybe picked an ORM the same way: whatever the last tutorial used.  
For a long time, in TypeScript, that meant Prisma.  
Write a schema, run `prisma generate`, get a beautifully typed client. Done.

Now imagine this: a 750-seat venue, a World Cup final, and a registration page that opens to a crowd.  
Two people tap "Register" for the last seat at the same millisecond.  
Only one of them gets it.  
The database decides who, not the browser.

That was [Stone Watch Party](/projects/stone-watch-party), and I built its data layer with Drizzle; it wasn't a coin toss.  
Here's how the two ORMs compare, where Prisma still wins, and why Drizzle is my default now.

## Two Philosophies

Both give you type-safe database access.  
They get there from opposite directions.

**Prisma abstracts SQL away.**  
You describe your data in its own schema language (`schema.prisma`), Prisma generates a client from it, and you query with objects: `findMany`, `include`, nested `create`.  
You rarely think in joins.

**Drizzle _is_ SQL, typed.**  
Your schema is plain TypeScript. Queries read like the SQL they produce: `select`, `from`, `where`, `innerJoin`.  
There's nothing to generate; the types come straight from your table definitions.

> Prisma asks you to learn Prisma. Drizzle asks you to know SQL.

Which one you prefer depends on which of those sentences sounds like a cost to you.

## The Schema

The same two tables in each. First, Prisma:

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

Then Drizzle:

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

I'll be honest: the Prisma schema is easier to read. It's compact, and a new teammate can scan it in seconds.

But the Drizzle schema is _just code_.  
I can import it, compose it, share column helpers between tables, and derive Zod validators from it with `drizzle-zod`.  
No extension needed for syntax highlighting, no separate language in the repo, and the TypeScript compiler is the only tool that has to understand it.

## Querying: Where the Difference Shows

Back to the last seat.  
The safe way to claim it is a single conditional update: decrement only if a seat is left, and insert the registration in the same transaction.

In Drizzle:

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

If you know SQL, you already know what this runs.  
`UPDATE events SET seats_left = seats_left - 1 WHERE id = $1 AND seats_left > 0 RETURNING seats_left`.  
No guessing.

Prisma can do it too:

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

Perfectly correct.  
But notice the detour: to make the update conditional I reach for `updateMany` on a single row, because `update` needs a unique `where`.  
That's the Prisma tax in a nutshell.  
The abstraction is lovely until you need the exact query you had in mind, and then you're translating SQL into Prisma and hoping it translates back.

For the 10% of queries that don't fit either API, Drizzle's `sql` template drops in anywhere, typed and parameterized.   
Prisma has `$queryRaw` and TypedSQL, which work, but they feel like stepping outside the ORM rather than through it.

And when you _do_ want the nested, Prisma-style read, Drizzle has a relational query API:

```typescript
const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
  with: { registrations: true },
});
```

One SQL statement, typed result, `registrations` included.  
You define the relations once with `relations()`, and you get most of what made Prisma pleasant.

## Lightweight Is the Point

This is the part that sold me.

**Drizzle is a thin layer over your driver.**  
The core is around 7.4 KB minified and gzipped, with zero dependencies.  
It sits on top of `postgres`, `pg`, Neon's HTTP driver, Cloudflare D1, libSQL, and others.  
What you install is what runs.

**There's no generate step.**  
Change a column, save the file, and the types update. No `prisma generate` in your build script, no stale client after a `git pull`, no "why is this field missing?" until you remember to regenerate.

**It runs anywhere JavaScript runs.**  
Serverless functions, edge runtimes, Bun, Deno.  
Cold starts stay small because there's very little to load.

To be fair to Prisma: the "Prisma ships a giant Rust binary" complaint is out of date.  
Prisma 7 removed the Rust query engine, moved to driver adapters, and cut its footprint dramatically.  
If that was your only objection, look again.

But lighter isn't the same as light.  
Prisma still has a code generator, a generated client to keep in sync, and an abstraction between you and the query.  
Drizzle has none of those, by design.

## Migrations

Both handle migrations, with different instincts.

**Prisma Migrate** is the more guided experience.  
`prisma migrate dev` diffs your schema, writes SQL, applies it against a shadow database, and warns you about drift.  
For teams that want rails, it's excellent.

**Drizzle Kit** gives you the same building blocks with fewer opinions:

```bash
bunx drizzle-kit generate  # Diff the schema, write a SQL migration file
bunx drizzle-kit migrate   # Apply pending migrations
bunx drizzle-kit push      # Sync the schema directly (prototyping only)
bunx drizzle-kit pull      # Introspect an existing database into a schema
```

The generated migrations are plain SQL files you commit and review.  
`push` is brilliant for a weekend prototype and dangerous anywhere near production; treat it like `--force`.

## Where Prisma Still Wins

I'm not here to dunk on Prisma. It's the better choice when:

- **Your team doesn't know SQL well.** Prisma's API protects people from footguns that Drizzle happily hands them.
- **You want the most mature docs and ecosystem.** Years of guides, Stack Overflow answers, and integrations add up.
- **You lean on nested writes.** Creating a user with their profile and three posts in one call is genuinely nice in Prisma.
- **You want guardrails over control.** Prisma Migrate's drift detection and shadow database catch mistakes before production does.

And Drizzle has real trade-offs.  
You need to be comfortable with SQL.  
The API has moved quickly, and the relational query API changed shape on the way to 1.0, so pin your versions and read the changelog before upgrading.

## The Quick Comparison

| | Prisma | Drizzle |
|---|---|---|
| Schema | `schema.prisma` (own DSL) | TypeScript |
| Types | Generated (`prisma generate`) | Inferred, no build step |
| Query style | Object API | SQL-like builder + relational API |
| Raw SQL | `$queryRaw`, TypedSQL | `sql` template, composable anywhere |
| Footprint | Much smaller since v7, still has a generated client | ~7.4 KB core, zero dependencies |
| Migrations | Prisma Migrate (guided) | Drizzle Kit (plain SQL files) |
| Best for | Teams that want an abstraction | Developers who think in SQL |

## What I'd Do Differently

- **Write the concurrency test first.** On Stone Watch Party, the integration tests that fire simultaneous registrations at the last seat caught more than any code review. Whichever ORM you pick, the database is the authority, so test against a real one.
- **Pin Drizzle and Drizzle Kit together.** They version separately, and a mismatched pair produces confusing migration diffs.

## The Takeaway

Prisma is a great product built on a bet: that most developers would rather not write SQL.  
For a lot of teams, that bet pays off.

My bet is the opposite.  
SQL is the one database skill that never goes out of date, and I want an ORM that types it, not one that hides it. Drizzle gives me type safety, a tiny footprint, no code generation, and queries I can read straight off the page.

If you're starting a new TypeScript backend and you're comfortable with SQL, start with Drizzle.  
If your team isn't, Prisma is still a great choice.

> The best ORM is the one that gets out of the way. Drizzle mostly does.
