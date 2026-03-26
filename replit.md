# NexusLink - Personal CRM & AI Memory Assistant

## Overview

A premium full-stack SaaS Personal CRM application for founders, freelancers, and creators. Built with a dark luxury design featuring electric indigo/violet accents.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React 19 + Vite + Tailwind CSS + Framer Motion
- **AI**: OpenAI via Replit AI Integrations (no API key needed)
- **Auth**: JWT (Bearer token stored in localStorage)

## Structure

```text
workspace/
├── artifacts/
│   ├── api-server/         # Express API server (backend)
│   └── nexuslink/          # React + Vite frontend (serves at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
└── ...
```

## Application Pages

**Public Routes:**
- `/` — Landing page with hero, features, pricing
- `/login` — Login form (email + password)
- `/signup` — Signup form

**Protected Routes (require auth):**
- `/dashboard` — Stats, activity feed, charts, today's focus
- `/contacts` — Contacts list (grid/table view), search, filter
- `/contacts/new` — Add new contact form
- `/contacts/:id` — Contact detail with timeline, tasks, AI brief
- `/ai-assistant` — AI chat assistant with context panel
- `/timeline` — Global activity timeline (placeholder)
- `/tasks` — Tasks management (placeholder)
- `/reminders` — Reminders calendar (placeholder)
- `/settings` — User settings (placeholder)

## API Endpoints

All routes prefixed with `/api`:
- `POST /auth/signup` — Create account
- `POST /auth/login` — Login (returns JWT)
- `POST /auth/logout` — Logout
- `GET /auth/me` — Get current user
- `PUT /auth/me/update` — Update profile
- `GET/POST /contacts` — List/Create contacts
- `GET/PUT/DELETE /contacts/:id` — Contact CRUD
- `POST /contacts/:id/tags` — Add tag
- `DELETE /contacts/:id/tags/:tagId` — Remove tag
- `GET/POST /interactions` — List/Create interactions
- `PUT/DELETE /interactions/:id` — Interaction CRUD
- `GET/POST /tasks` — List/Create tasks
- `PUT/DELETE /tasks/:id` — Task CRUD
- `GET/POST /reminders` — List/Create reminders
- `PUT/DELETE /reminders/:id` — Reminder CRUD
- `POST /ai/brief` — Generate AI contact brief
- `POST /ai/draft-email` — Draft follow-up email
- `POST /ai/chat` — AI assistant chat
- `GET /dashboard/stats` — Dashboard aggregate stats
- `GET /export/csv` — Export contacts as CSV
- `POST /import/csv` — Import contacts from CSV

## Database Schema

- `users` — User accounts (id, name, email, password, plan, timezone)
- `contacts` — CRM contacts with all profile fields
- `contact_tags` — Tags associated with contacts
- `interactions` — Interaction history (calls, meetings, emails, notes)
- `tasks` — Tasks linked to contacts
- `reminders` — Reminders linked to contacts/tasks

## Authentication

- JWT-based authentication stored in localStorage
- `setAuthTokenGetter` configured in `use-auth.ts` to auto-attach tokens
- All protected routes redirect to `/login` when no token exists

## Demo Account

- Email: `demo@nexuslink.app`
- Password: `demo1234`
- Pre-seeded with 12 realistic contacts, interactions, tasks, and reminders

## Seed Data

Run `pnpm --filter @workspace/scripts run seed` to reseed the database.

## Design

- Dark luxury theme: `#0A0A0F` backgrounds, `#6C63FF` electric indigo accents
- Fonts: Syne (display), DM Sans (body), JetBrains Mono (mono)
- Framer Motion animations throughout
- Responsive design with mobile-first approach

## AI Features

- Contact brief generation (pre-meeting summary)
- Follow-up email drafting
- Conversational AI assistant with contact context
- Powered by OpenAI via Replit AI Integrations (no API key required, billed to credits)
