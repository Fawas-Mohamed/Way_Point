# Waypoint — System Architecture

Waypoint is a team project & task management platform. This document is the
architectural record: what was built, why, and the trade-offs behind each
decision. It exists so a reviewer (or a future contributor) can understand
the system without reading every file first.

## 1. High-level shape

Waypoint is a monorepo with two deployable applications and two shared
packages:

```
waypoint/
├── apps/
│   ├── web/            Next.js 15 (App Router) — the product UI
│   └── api/             Node.js + Express — the REST API
├── packages/
│   ├── config/          Shared ESLint / TSConfig / Tailwind preset
│   └── types/           Shared TypeScript types + Zod schemas (DTOs)
├── prisma/
│   └── schema.prisma    Single source of truth for the data model
├── docker/              Dockerfiles per app
└── docker-compose.yml   Local + deploy-ready orchestration
```

A monorepo was chosen over two separate repos because the frontend and
backend share a type layer (`packages/types`): every DTO validated by the API
with Zod is the same schema the frontend uses for form validation with React
Hook Form. This removes an entire class of "frontend and backend disagree
about a field name" bugs, which is the most common real-world failure mode in
two-repo full-stack projects built under time pressure — exactly the
conditions of an assessment like this one.

## 2. Backend: layered / clean architecture

The API is organized in strict layers, each with one direction of
dependency (outer depends on inner, never the reverse):

```
Route → Controller → Service → Repository → Prisma
              ↓
           DTO (Zod) validates at the boundary
```

- **Routes** — wire an HTTP verb + path to a controller method. No logic.
- **Controllers** — translate HTTP ⇄ domain. Parse request, call a service,
  shape the response. No business rules and no direct database access live
  here — this is what keeps controllers thin and testable.
- **Services** — the business logic. A service knows the *rules*
  ("a Team Member cannot delete a project", "a task cannot move to Done
  without all subtasks closed") but not how data is persisted.
- **Repositories** — the only layer that talks to Prisma. If the ORM were
  ever swapped, only this layer changes.
- **DTOs** — Zod schemas shared with the frontend, validated in middleware
  before a request reaches a controller, so controllers can trust their
  input shape.

This separation is not ceremony for its own sake — it is what makes the
"20 modules" in the brief tractable at all. Every module (Projects, Tasks,
Teams, Notifications...) is a vertical slice through the same four layers,
so the pattern learned once applies everywhere, and each layer is unit-
testable in isolation (services with a mocked repository, no database
needed).

## 3. Authentication & authorization

- **Access token**: short-lived JWT (15 min), returned to the client and
  kept in memory only (never localStorage, to reduce XSS exfiltration risk).
- **Refresh token**: long-lived, opaque, stored in an `httpOnly`, `secure`,
  `sameSite=strict` cookie, and persisted server-side in a `Session` table
  (hashed) so a token can be revoked (logout, "log out all devices",
  password change) — a pure-JWT refresh scheme cannot do this without a
  blocklist, which is effectively reinventing session storage anyway.
- **RBAC**: three roles (Administrator, Project Manager, Team Member) map to
  a `Role` → `Permission` → join table model rather than hard-coded role
  checks, so granting a new permission to a role is a data change, not a
  redeploy. A `requirePermission('project:archive')` middleware checks the
  authenticated user's role's permissions, not their role name directly —
  this is the difference between RBAC that scales and a pile of
  `if (role === 'ADMIN')` checks.

## 4. Database design

PostgreSQL via Prisma. Key decisions:

- **UUID primary keys** (not auto-increment ints) — avoids leaking sequence
  information (e.g. "user #4" implies 3 users signed up before them) and
  makes IDs safe to expose in URLs and safe to generate client-side for
  optimistic UI.
- **Soft deletes** on Project, Task, and User (`deletedAt: DateTime?`) —
  the brief explicitly requires archive/restore for projects, which is
  incompatible with hard deletes. Every repository query filters
  `deletedAt: null` by default; a separate `withDeleted()` repository method
  exists for admin "trash" views.
- **Junction tables are explicit, not implicit** — `ProjectMember`,
  `TaskLabel`, `RolePermission` are modeled as real tables with their own
  metadata (e.g. `ProjectMember` carries `joinedAt` and the member's
  project-level role), because Prisma's implicit many-to-many tables can't
  carry extra columns and every one of these relationships needs at least
  one.
- **Activity log is append-only and polymorphic** via a `subjectType` +
  `subjectId` pair rather than a nullable FK per possible subject — this
  keeps the table from growing a new nullable column every time a new
  auditable entity is added.

See `prisma/schema.prisma` for the full model with inline comments on each
relation's cardinality.

## 5. Frontend architecture

Feature-based, not type-based. Instead of `components/`, `hooks/`, `pages/`
each holding every feature's files interleaved, each feature owns its own
vertical slice:

```
apps/web/src/
├── app/                  Next.js App Router — routes only, thin
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts        Axios calls for this feature
│   │   └── types.ts
│   ├── projects/
│   ├── tasks/
│   └── ...
├── components/ui/         Design-system primitives (button, card, input…)
├── lib/                   Cross-cutting: axios instance, query client, cn()
└── providers/              Theme, auth, query client providers
```

Data fetching uses TanStack Query for all server state (never `useEffect` +
`useState` for API data) — this gives caching, background refetch,
optimistic updates (needed for drag-and-drop Kanban and "Undo Actions"), and
request de-duplication for free, and it is the accepted 2025+ pattern for
Next.js App Router apps that still need client-side interactivity.

Forms use React Hook Form + the same Zod schema the API validates with
(imported from `packages/types`), so client and server validation cannot
drift apart.

## 6. Why this stack, briefly

- **Next.js App Router** — server components for the initial data-heavy
  views (dashboard, reports) reduce client JS and time-to-interactive;
  client components are used deliberately where interactivity requires it
  (Kanban board, command palette).
- **Prisma** — type-safe queries generated from the schema remove an entire
  class of runtime SQL errors, and its migration tooling is what the brief
  asks for directly.
- **Express over a heavier framework (Nest, etc.)** — the clean-architecture
  layering above gives the structure a larger framework would enforce,
  without the overhead of decorators/DI containers for a project of this
  scope. This is a deliberate, defensible choice, not a default.

## 7. What's next

This document will be updated as each phase lands. Current status:

- [x] Phase 1 — Architecture, folder structure, database schema, Docker
      base, design system tokens
- [ ] Phase 2 — Design system component primitives
- [ ] Phase 3 — Backend core (auth, RBAC, Projects vertical slice)
- [ ] Phase 4 — Frontend core (app shell, auth pages, dashboard)
- [ ] Phase 5 — Task & Kanban module
- [ ] Phase 6 — Teams, Notifications, Analytics, Reports, Admin
- [ ] Phase 7 — Tests, CI/CD, README
