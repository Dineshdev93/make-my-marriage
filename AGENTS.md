# AGENTS.md: Make My Marriage

## What this is
A free wedding-planning web app for Indian couples. Version 1 only. Monolith: one Next.js (App Router, TypeScript) app, MongoDB Atlas via Mongoose, Auth.js (email and password).

## Source of truth
Read these before any task: docs/PRD.md, docs/SYSTEM_DESIGN.md, docs/DATABASE_AND_API_DESIGN.md. If they conflict, DATABASE_AND_API_DESIGN.md wins over SYSTEM_DESIGN.md, and both win over any assumption. UI references are in docs/ui/.

## Scope rules
- Build only Version 1 features from the PRD. Never add Later-list features (invitations, RSVP, photo gallery, live stream, event-level guests, vendors, payment status, category budgets, headcount). , we will add later . 
- English only. Currency is INR with Indian grouping (₹15,00,000).

## Architecture rules
- Layers: UI -> Route Handler (thin) -> access context -> service -> Mongoose model. Only services touch models.
- Pages read data on the server through services. Route handlers are used for mutations (POST, PATCH, DELETE) only. Family pages are server-rendered from a token and have no API routes.
- weddingId is never taken from a request. It comes from the access context. Every query filters by weddingId.
- Roles: editor (bride or groom, full access) and viewer (family via link, read only). Every write service function must reject a viewer, on the server.
- Validate every request body with Zod. Return { data } on success and { error: { code, message, fields } } on failure, with the status codes in the API design doc.
- Money is stored and sent as integer paise (amountPaise). Never use floating point for money.
- Date-only fields are YYYY-MM-DD strings. "Today" is computed in IST. Timestamps are UTC.
- Deletes are hard deletes. Deleting a function clears functionId on linked expenses and tasks in a transaction.
- Totals, remaining budget, overdue and countdown are computed, never stored.
- Tokens (family, invite, reset) are random, and only their SHA-256 hash is stored.

## Code rules
- TypeScript strict. No any. Named exports (default exports only where Next.js requires).
- Keep route handlers thin. Put logic in services. Put pure helpers in src/lib with unit tests.
- Never commit secrets. Use .env.local and keep .env.example updated.
- No new dependencies without a one-line reason.

## UI rules
- Follow the design tokens in docs/ui/ (ivory background, wine primary, charcoal text, Newsreader headings, Inter body).
- No red, yellow, orange, pink, gold. No emoji, stock photos, or floral decoration.
- Buttons and pills never wrap text.

## Workflow
- Work in small steps. Before coding, state a short plan.
- After changes run: npm run lint, npm run typecheck, npm test. Fix failures before finishing.
- At the end, list files changed and anything unfinished or assumed.