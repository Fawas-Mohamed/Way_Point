# Waypoint

Waypoint is a production-oriented team project and task management platform.
It is built as a monorepo with a Next.js frontend, an Express REST API, a
shared type layer, and a Prisma/PostgreSQL data model.

The product is designed around one core idea: projects are routes, milestones
are waypoints, and progress is shown as a route line rather than a generic
progress bar.

## What Waypoint Includes

- Authentication with access + refresh token flow
- Role-based authorization with permissions
- Dashboard with summary, focus work, activity, and project shelf views
- Projects module with list, detail, create, edit, archive, delete, members,
  files, timeline, and activity
- Tasks module with list, board, detail drawer, comments, dependencies, and
  assigned-task views
- Calendar, reports, analytics, notifications, settings, profile, and admin
  screens
- Shared validation schemas across the API and web app
- Docker-based local and production deployment support

## Stack

- Frontend: Next.js 15, React 18, TanStack Query, React Hook Form, Zod
- Backend: Node.js, Express, Prisma, PostgreSQL
- Shared package: TypeScript DTOs and Zod schemas in `packages/types`
- Styling: Tailwind CSS with a custom design system
- Dev/ops: npm workspaces, Docker Compose, Prisma migrations

## Repository Layout

```
.
├── apps/
│   ├── api/              Express API
│   └── web/              Next.js application
├── packages/
│   ├── config/           Shared config package
│   └── types/            Shared DTOs and Zod schemas
├── prisma/
│   ├── schema.prisma     Database schema
│   ├── seed.ts           Development seed data
│   └── migrations/       Prisma migrations
├── docker/               Dockerfiles for api and web
├── docker-compose.yml    Local or production composition
├── ARCHITECTURE.md       System architecture notes
├── DESIGN_SYSTEM.md      Design system reference
└── design-system/style-guide.html
```

## Current Module Coverage

### Authentication

- Register, login, refresh, logout, forgot password, reset password, and
  change password
- HttpOnly refresh cookie plus in-memory access token handling on the client

### Projects

- Project list with search, filters, sort, and pagination
- Project details with members, milestones, files, budget, status, priority,
  progress, and activity
- Create, edit, archive, restore, remove, and member management

### Tasks

- Assigned tasks view
- Kanban board with drag-and-drop movement
- List view and calendar view
- Task detail drawer with subtasks, labels, attachments, comments, history,
  and dependencies

### Dashboard

- Focus panel
- Activity strip
- Task summary
- Project shelf

### Notifications

- Notification inbox
- Mark as read
- Mark all as read
- Filter and search

### Analytics and Reports

- Completion trends
- Project health
- Workload and task distribution charts
- Report export views

### Settings, Profile, and Admin

- Profile and workspace settings
- Notification preferences and password change
- Admin user and role management

## Architecture Summary

### Backend

The API follows a layered structure:

`Route -> Controller -> Service -> Repository -> Prisma`

- Routes define HTTP endpoints and middleware
- Controllers translate HTTP requests into application responses
- Services hold business rules and authorization checks
- Repositories perform database access through Prisma
- DTOs are shared Zod schemas from `packages/types`

### Frontend

The web app uses a feature-first structure:

- Route files stay thin and only compose pages
- Feature folders hold API calls, hooks, types, and reusable UI pieces
- TanStack Query manages server state
- React Hook Form + Zod handle form state and validation
- Shared UI primitives live in `apps/web/src/components/ui`

### Shared Validation

The API and frontend import the same DTO schemas from `packages/types`.
That keeps form validation and request validation aligned.

## Design System

Waypoint uses a restrained visual language:

- Indigo Deep for primary actions and active state
- Ink Slate and Slate Mid for readable text
- Emerald Route for progress and success
- Cloud and Paper for surfaces and app chrome
- Route-line progress elements instead of generic progress bars

Open `DESIGN_SYSTEM.md` and `design-system/style-guide.html` for the full
visual reference.

## Prerequisites

- Node.js 20 or newer recommended
- npm 10 or newer
- PostgreSQL 16
- Docker and Docker Compose if you want the containerized workflow

## Environment Variables

Create a local `.env` from `.env.example` and fill in the values below:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`
- `CLIENT_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `STORAGE_DRIVER`
- `STORAGE_LOCAL_PATH`

Example values are documented in `.env.example`.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
copy .env.example .env
```

Update the secrets and connection strings before starting the app.

### 3. Generate Prisma client and apply migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Seed development data

```bash
npm run prisma:seed
```

### 5. Start the apps

Run both services from the repo root:

```bash
npm run dev:api
npm run dev:web
```

Or start them through Docker Compose:

```bash
docker compose up --build
```

## Production Build

### Build locally

```bash
npm run build:api
npm run build:web
```

### Start production containers

```bash
docker compose up -d --build
```

The Compose stack exposes:

- Web at `http://localhost:3000`
- API at `http://localhost:4000`
- PostgreSQL at `localhost:5432`

## Available Scripts

### Root scripts

- `npm run dev:api` - start the API in watch mode
- `npm run dev:web` - start the web app in dev mode
- `npm run build:api` - build the API
- `npm run build:web` - build the web app
- `npm run lint` - lint all workspace packages
- `npm run typecheck` - run TypeScript checks for all workspaces
- `npm run test` - run tests across workspaces
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - apply Prisma migrations locally
- `npm run prisma:seed` - seed the database

### App scripts

#### apps/api

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

#### apps/web

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Key API Areas

- `/api/v1/auth`
- `/api/v1/projects`
- `/api/v1/tasks`
- `/api/v1/teams`
- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/notifications`
- `/api/v1/activity`
- `/api/v1/analytics`
- `/api/v1/dashboard`

## Deployment Notes

- The API expects `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  and `CLIENT_ORIGIN` at runtime.
- The web app expects `NEXT_PUBLIC_API_URL` to point at the API base URL.
- Use Prisma migrations for schema changes. Do not edit the database schema
  manually in production.
- Keep access tokens short-lived and refresh tokens server-revocable.

## Troubleshooting

- If the web app shows a stale chunk or 404 after a route change, restart the
  Next dev server and clear `.next`.
- On Windows, reinstall dependencies if Next reports SWC errors such as
  `next-swc.win32-x64-msvc.node is not a valid Win32 application`.
- If the app cannot download Google Fonts during development, Next falls back
  to local fonts automatically; the app still compiles.
- Make sure the root `.env` exists before running the API, because env
  validation happens at startup.

## Documentation

- Architecture: `ARCHITECTURE.md`
- Design system: `DESIGN_SYSTEM.md`
- Prisma schema: `prisma/schema.prisma`
- UI style guide: `design-system/style-guide.html`

## Development Status

Waypoint is actively built as a full-stack product. The current codebase
includes the core authenticated shell, dashboard, projects, tasks, calendar,
reports, analytics, notifications, settings, profile, and admin views.

The architecture is now stable enough for incremental feature work, API
expansion, and production hardening without changing the repo structure.
