# Make My Marriage | System Design v1.0

Companion to PRD v1.1. Scope: Version 1 only. Later-list features are noted where they affect today's design.

> If this document conflicts with `DATABASE_AND_API_DESIGN.md`, the Database and API Design document wins.

## 1. Goals and constraints

- Simple monolith: one codebase, one deploy.
- Free to run: Vercel plus MongoDB Atlas M0.
- Correct money and dates; strict permissions (bride and groom edit, family views).
- Small enough for one developer to build and maintain.

## 2. Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js (App Router) with Route Handlers as the backend, running on Node.js |
| Language | TypeScript (strict) |
| Database | MongoDB Atlas (M0 to start) |
| ODM and validation | Mongoose and Zod (one Zod schema shared by form and API) |
| Authentication | Auth.js, credentials provider (email and password), JWT session |
| Password hashing | bcryptjs, cost 12 (pure JS, safe on Vercel) |
| Email | Resend free tier, password reset only in V1 |
| Styling | Tailwind CSS with design tokens from `docs/ui/` |
| UI components | shadcn/ui, only the components that are needed (dialog, drawer, select, tabs) |
| Fonts | Newsreader (headings) and Inter (body), loaded with next/font |
| Hosting | Vercel |
| Monitoring | Sentry free tier |
| Tests | Vitest, mongodb-memory-server, optional Playwright for the core flow |

There is no separate Express server. Route Handlers are the API.

## 3. Architecture

A layered monolith. Every request follows the same path:

| Layer | Responsibility |
|---|---|
| Page or UI component | Renders forms and lists. Calls the API. Shows server errors. |
| Route Handler (thin) | Parses input with Zod, builds the access context, calls a service, returns JSON. |
| Access context | Resolves who is calling: an editor (from the session) or a family viewer (from the link token). Gives back weddingId and role. |
| Service (business logic) | Checks the role, applies rules, talks to the database. The only layer allowed to touch models. |
| Model (Mongoose) | Collections, indexes, and types. |

Key rule: weddingId is never taken from the client. It always comes from the access context, so one wedding can never read or write another.

## 4. Folder structure

```
make-my-marriage/
├─ AGENTS.md
├─ README.md
├─ .env.example
├─ docs/
│  ├─ PRD.md
│  ├─ SYSTEM_DESIGN.md
│  ├─ DATABASE_AND_API_DESIGN.md
│  └─ ui/                              Stitch exports per screen
└─ src/
   ├─ app/
   │  ├─ (marketing)/page.tsx          landing page
   │  ├─ (auth)/                       login, register, forgot-password, reset-password
   │  ├─ (onboarding)/setup            guided wedding setup
   │  ├─ (app)/                        sidebar layout for editors
   │  │   ├─ layout.tsx
   │  │   └─ dashboard, expenses, functions, tasks, guests, settings
   │  ├─ family/[token]/               read-only pages for family
   │  ├─ invite/[token]/               partner accepts invite
   │  └─ api/                          route handlers (mutations only)
   ├─ modules/
   │  └─ auth/ wedding/ functions/ expenses/ tasks/ guests/ dashboard/ family/
   │       ├─ model.ts                 Mongoose model
   │       ├─ schema.ts                Zod schemas
   │       ├─ service.ts               business logic with access checks
   │       └─ components/              module UI
   ├─ components/
   │  ├─ ui/                           buttons, inputs, dialogs, drawer, pills
   │  └─ layout/                       sidebar, top bar, app shell
   ├─ lib/
   │  ├─ db.ts                         cached Mongo connection
   │  ├─ env.ts                        Zod-validated environment variables
   │  ├─ access.ts                     builds the access context
   │  ├─ money.ts                      rupees <-> paise, INR formatting
   │  ├─ dates.ts                      IST today, countdown, overdue
   │  ├─ tokens.ts                     random token and hash helpers
   │  └─ errors.ts                     app error types and responses
   └─ types/
```

Notes:

- Every module has the same files, so a new module is a copy of an existing one.
- Unit tests are colocated as `*.test.ts` next to the code they test.
- Family pages reuse the same module components with a `readOnly` prop. The server builds a viewer access context from the token.

## 5. Modules

| # | Module | Notes |
|---|---|---|
| 0 | Foundation (lib and shared UI) | DB, access, money, dates, errors, validation |
| 1 | Auth | Register, login, logout, password reset |
| 2 | Wedding setup and settings | Guided setup, edit details, partner invite |
| 3 | Functions | CRUD |
| 4 | Expenses and budget | CRUD, totals, overrun warning |
| 5 | Tasks | CRUD, complete and reopen, pending and overdue |
| 6 | Guests | CRUD, invitation status |
| 7 | Dashboard | Summaries and quick actions |
| 8 | Family view | Link generate and regenerate, read-only pages |

## 6. Data model

All collections except users carry weddingId. Money is stored in paise (integer).

### users

| Field | Type | Notes |
|---|---|---|
| email | string | Lowercased, unique |
| passwordHash | string | bcrypt |
| name | string | |
| createdAt | date | UTC timestamp |

### weddings

| Field | Type | Notes |
|---|---|---|
| name | string | Required |
| coupleNames | string | Required |
| weddingDate | string | YYYY-MM-DD |
| totalBudgetPaise | integer | Required, positive |
| editorIds | ObjectId[] | Maximum 2 |
| familyTokenHash | string or null | Hash of the family link token |
| partnerInvite | object or null | tokenHash, expiresAt, usedAt |
| createdAt, updatedAt | date | UTC |

Indexes: unique multikey index on editorIds (a user can belong to only one wedding, which enforces one account, one wedding); unique sparse index on familyTokenHash.

### functions

| Field | Type | Notes |
|---|---|---|
| weddingId | ObjectId | Required |
| name | string | Required |
| date | string | YYYY-MM-DD, required |
| venue | string | Optional |

Index: weddingId + date.

### expenses

| Field | Type | Notes |
|---|---|---|
| weddingId | ObjectId | Required |
| amountPaise | integer | Positive, required |
| category | enum | Venue, Catering, Decoration, Photography, Clothing and Jewellery, Other |
| description | string | Required |
| expenseDate | string | YYYY-MM-DD, required |
| functionId | ObjectId or null | Optional link |

Index: weddingId + expenseDate.

### tasks

| Field | Type | Notes |
|---|---|---|
| weddingId | ObjectId | Required |
| title | string | Required |
| dueDate | string | YYYY-MM-DD, required |
| completed | boolean | Default false |
| completedAt | date or null | Set when completed |
| functionId | ObjectId or null | Optional link |

Index: weddingId + dueDate. Pending and overdue are never stored; they are computed from dueDate, completed, and today in IST.

### guests

| Field | Type | Notes |
|---|---|---|
| weddingId | ObjectId | Required |
| name | string | Required |
| phone | string | Required |
| group | string | Required (family or group) |
| invitationStatus | enum | Not invited, Invited, Confirmed |
| functionIds | ObjectId[] | Empty in V1, reserved for event-level guests later |

Index: weddingId.

### passwordResets

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | |
| tokenHash | string | |
| expiresAt | date | TTL index removes expired rows |

## 7. Access control

The access context has two shapes:

- Editor: weddingId from the user's wedding, role editor. Full read and write.
- Viewer: weddingId from the family token, role viewer. Read only.

Rules:

- Every service function receives the context. Write functions throw a forbidden error unless role is editor.
- Every query includes weddingId from the context.
- Family pages are rendered on the server from the token and have no API routes. Services reject every write for a viewer.
- Settings (wedding details, partner invite, family link) are editor-only.
- Unit tests cover every write function with a viewer context and a context from a different wedding.

## 8. Key flows

### Register and setup

1. User registers, then logs in.
2. If the user has no wedding, they are sent to guided setup. Creating the wedding adds the user to editorIds.
3. If a wedding exists, the dashboard loads.

### Partner invite

1. Editor generates an invite link. A random 32-byte token is created; only its hash is stored, with a 7-day expiry.
2. The editor copies the link and shares it.
3. The partner opens the link, registers or logs in, and accepts. The user is added to editorIds if there is a free slot and the user has no other wedding. The token is marked used.

### Family link

1. Editor generates the link. A random 32-byte token is created; only its hash is stored.
2. The full link is shown once, with a copy button. It is not recoverable afterwards.
3. Regenerating replaces the hash, so the old link stops working immediately.
4. Family opens /family/[token]. The server hashes the token and looks up the wedding. No match gives a not-found page.

### Delete a function

Run in a database transaction: set functionId to null on linked expenses and tasks, then delete the function. Atlas M0 supports transactions.

## 9. Money and dates

- Money is stored as integer paise. Form input is parsed as a string into paise with integer arithmetic, never through floating point. Maximum amount is capped (for example, 100 crore rupees).
- Display uses Indian grouping (12,50,000) with the rupee sign.
- Remaining budget = totalBudgetPaise minus the sum of expense amountPaise, computed on every request. Totals are never stored.
- Date-only fields (wedding date, due date, function date, expense date) are stored as YYYY-MM-DD strings, with no time and no timezone. Today is computed in IST. This refines the earlier plan of UTC storage, and it removes timezone bugs for date-only values. Real timestamps (createdAt and similar) stay in UTC.
- Overdue means completed is false and dueDate is earlier than today (IST).
- Countdown is the number of days from today (IST) to the wedding date.

## 10. API list

All routes return JSON. Mutations check the Origin header and the session.

| Area | Routes |
|---|---|
| Auth | Auth.js handlers at /api/auth/[...nextauth]; POST /api/auth/register; POST /api/auth/forgot-password; POST /api/auth/reset-password |
| Wedding | POST and PATCH /api/wedding |
| Invite | POST /api/wedding/partner-invite; POST /api/invite/accept |
| Family link | POST /api/wedding/family-link (generate or regenerate) |
| Functions | POST /api/functions; PATCH and DELETE /api/functions/[id] |
| Expenses | POST /api/expenses; PATCH and DELETE /api/expenses/[id] |
| Tasks | POST /api/tasks; PATCH and DELETE /api/tasks/[id]; completion is a PATCH of completed |
| Guests | POST /api/guests; PATCH and DELETE /api/guests/[id] |
| Dashboard | No API route. The page reads through the dashboard service on the server. |
| Family (read only) | No API routes. /family/[token] pages read through the same services with a viewer access context. |

Lists are read on the server and return every record for the wedding (hundreds at most). Add pagination only if needed. Full request and response details are in the Database and API Design doc.

### Dashboard response

The dashboard service returns: wedding name, couple names, date, countdown, total budget, total expenses, remaining budget, amount exceeded (if any), the next 5 upcoming functions, the next 5 incomplete tasks with overdue ones first, and counts of pending and overdue tasks. Expense total comes from one aggregation (sum grouped by weddingId).

## 11. Validation and errors

- Every request body is parsed with Zod. Only known fields are accepted, so extra fields such as weddingId from the client are ignored.
- Zod string types also prevent query operator injection into Mongo.
- Error shape: an error object with a code, a human message, and optional field errors.
- The UI updates only after the server confirms success. No optimistic updates in V1, so a failed save never looks like success.
- Unexpected errors go to Sentry and show a generic message to the user.

## 12. Security checklist

- Passwords: bcryptjs cost 12. Password rules: minimum length, no composition tricks.
- Session cookie: httpOnly, secure, SameSite Lax.
- Tokens (family, invite, reset): 32 random bytes, stored only as SHA-256 hashes, with expiry for invite and reset.
- Family pages: send a no-referrer policy and noindex so the link does not leak or get indexed.
- Rate limiting on login, register, forgot-password, and family token lookups. Needs a shared store such as Upstash Redis free tier or Vercel firewall rules, because in-memory counters do not work on serverless.
- Atlas: a dedicated database user with least privilege and a strong password. Vercel uses changing IP addresses, so Atlas network access will be open to all IPs; the strong credentials are the protection.
- Secrets only in environment variables, never committed.

## 13. Deployment and environments

| Item | Plan |
|---|---|
| Hosting | Vercel, deployed from GitHub on every push to main |
| Database | Atlas M0. Separate databases for development and production. |
| Env variables | MONGODB_URI, AUTH_SECRET, AUTH_URL, RESEND_API_KEY, SENTRY_DSN |
| Connection | Mongo client cached on the global object to avoid a new connection per request |
| Backups | M0 has no automatic backups. Before launch, add a scheduled mongodump (for example a weekly GitHub Action) stored outside Atlas. |
| Note | Vercel Hobby is for non-commercial use. This is fine for a free product with no revenue; revisit if that changes. |

## 14. Testing plan

- Unit tests: money parsing and formatting, date helpers (IST today, countdown, overdue), token helpers.
- Service tests with an in-memory MongoDB: expense totals after add, edit, and delete; function delete clears links and keeps records; one account one wedding; editor limit of two.
- Permission tests: viewer cannot write; wrong-wedding access returns nothing; expired or reused invite fails; regenerated family link kills the old one.
- One end-to-end test of the main journey: register, setup, add records, check dashboard, open the family link.
- Manual check on a real phone for layouts.

## 15. Build plan

| Phase | Work |
|---|---|
| 1 | Project setup, Atlas connection, Vercel deploy, Sentry |
| 2 | Foundation and Auth (modules 0 and 1) |
| 3 | Wedding setup and settings (module 2) |
| 4 | Functions (module 3) |
| 5 | Expenses, Tasks, Guests (modules 4, 5, 6) |
| 6 | Dashboard (module 7) |
| 7 | Family view (module 8) |
| 8 | Testing, mobile polish, backup job, launch checklist |

## 16. Design choices that keep the Later list easy

| Later feature | Already prepared by |
|---|---|
| Event-level guests | guests.functionIds field exists, empty in V1 |
| More roles (organizer, more family permissions) | The access context already has a role value; add roles without changing the services' shape |
| Digital invitation and RSVP | Same token pattern as the family link, one token per guest; invitationStatus already exists |
| Photo gallery | Files go to object storage (for example Cloudinary or Cloudflare R2), never into MongoDB; the module follows the same file structure |
| Wedding website | A public slug on the wedding plus a public read-only page |
| Export and reminders | Read from the same services; a scheduled job can be added later |

## 17. Open decisions

- Rate-limit store: Upstash Redis free tier or Vercel firewall rules.
- Phone number validation: Indian 10-digit mobile only, or international.
- Whether the wedding date can change after setup (PRD open item).
- Behavior when the wedding date is in the past.
- Which backup destination to use for mongodump.
