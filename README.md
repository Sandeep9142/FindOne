# FindOne

FindOne is a full-stack service marketplace built with:

- `client/` - React + Tailwind CSS
- `server/` - Node.js + Express.js + MongoDB/Mongoose
- `database/` - schema design, indexes, and seed data

## Root commands

- `npm run install:all`
- `npm run dev:client`
- `npm run dev:server`
- `npm run build:client`
- `npm run seed:categories`
- `npm run seed:demo`
- `npm run docker:up`
- `npm run docker:down`

## Quick start

1. Install dependencies:
   `npm run install:all`
2. Start MongoDB locally.
3. Seed categories:
   `npm run seed:categories`
4. Seed demo data:
   `npm run seed:demo`
5. Run backend:
   `npm run dev:server`
6. Run frontend:
   `npm run dev:client`

## Demo credentials

After `npm run seed:demo`, the seeded accounts are:

- Client: `demo.client@findone.local` / `secret123`
- Worker: `demo.worker@findone.local` / `secret123`
- Admin: `demo.admin@findone.local` / `secret123`

## Full workflow guide

See [PROJECT_WORKFLOW.md](/x:/FindOne/PROJECT_WORKFLOW.md) for the full end-to-end roadmap to test the project from auth through payments.

## Docker

You can run the stack with Docker:

1. `npm run docker:up`
2. Open frontend at `http://localhost:3000`
3. Backend runs at `http://localhost:8000`
4. MongoDB runs on `mongodb://127.0.0.1:27017`
