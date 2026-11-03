# Make My Marriage

A free wedding-planning workspace for Indian couples. This repository contains the Version 1 application scaffold.

## Setup

1. Install Node.js and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `AUTH_SECRET`, and `AUTH_URL`.
4. Run `npm run dev` and open <http://localhost:3000>.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

The auth service integration tests use `mongodb-memory-server`. On Windows, install the Microsoft Visual C++ Redistributable to run them, then set `RUN_MONGO_MEMORY_TESTS=1` before `npm test`.
