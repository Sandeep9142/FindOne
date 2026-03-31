# FindOne Project Workflow

This is the recommended end-to-end roadmap to check the whole project.

## 1. Setup

1. Install dependencies:
   `npm run install:all`
2. Make sure MongoDB is running locally on:
   `mongodb://127.0.0.1:27017/findone`
3. Seed base categories:
   `npm run seed:categories`
4. Seed demo accounts and workflow data:
   `npm run seed:demo`

## 2. Start the project

1. Start backend:
   `npm run dev:server`
2. Start frontend:
   `npm run dev:client`
3. Open frontend:
   `http://localhost:3000`
4. Optional backend health check:
   `http://127.0.0.1:8000/health`

## 3. Demo accounts

- Client
  `demo.client@findone.local`
  `secret123`
- Worker
  `demo.worker@findone.local`
  `secret123`
- Admin
  `demo.admin@findone.local`
  `secret123`

## 4. Backend workflow check

### Auth

1. Register a new user or use a demo account.
2. Login and capture the JWT token.
3. Call `GET /api/v1/auth/me`.

### Profiles

1. Login as worker.
2. Check `GET /api/v1/workers/profile/me`.
3. Update worker profile with `PUT /api/v1/workers/profile`.
4. Upload avatar with `POST /api/v1/workers/avatar`.
5. Upload portfolio images with `POST /api/v1/workers/portfolio`.

1. Login as client.
2. Check `GET /api/v1/clients/profile`.
3. Update client profile with `PUT /api/v1/clients/profile`.

### Worker discovery

1. Call `GET /api/v1/workers`.
2. Call `GET /api/v1/workers/search?q=repair`.
3. Open a specific worker with `GET /api/v1/workers/:id`.
4. Check worker reviews with `GET /api/v1/workers/:id/reviews`.

### Jobs

1. Login as client.
2. Create a job with `POST /api/v1/jobs`.
3. Check public jobs with `GET /api/v1/jobs`.
4. Check own jobs with `GET /api/v1/jobs/my/posted`.

1. Login as worker.
2. Apply using `POST /api/v1/jobs/:id/apply`.
3. Check own applied jobs with `GET /api/v1/jobs/my/applied`.

1. Login back as client.
2. Check job applications with `GET /api/v1/jobs/:id/applications`.

### Bookings

1. Login as client.
2. Create a booking with `POST /api/v1/bookings`.
3. Check `GET /api/v1/bookings`.
4. Update booking status using `PATCH /api/v1/bookings/:id/status`.
5. Cancel with `PATCH /api/v1/bookings/:id/cancel` if needed.

### Reviews

1. Mark a booking as `completed`.
2. Create review with `POST /api/v1/bookings/:id/reviews`.
3. Confirm worker ratings and reviews update.

### Messaging

1. Create a conversation with `POST /api/v1/conversations`.
2. Send a message with `POST /api/v1/conversations/:id/messages`.
3. Fetch history with `GET /api/v1/conversations/:id/messages`.
4. Mark as read with `PATCH /api/v1/conversations/:id/read`.

### Payments

1. Create payment for a booking or job with `POST /api/v1/payments`.
2. Update payment state with `PATCH /api/v1/payments/:id/status`.
3. Verify target booking/job payment status updates.

## 5. Frontend workflow check

Use the frontend to verify:

1. Landing page loads correctly.
2. Auth pages render.
3. Dashboard routes render without crashes.
4. API-backed pages can be integrated one by one with the backend endpoints above.

Current note:

- Backend is much more complete than frontend integration.
- Some frontend pages are still placeholder screens and need wiring to live APIs.

## 6. Tests and docs

1. Run backend tests:
   `npm.cmd --prefix server test`
2. Review backend API documentation:
   [API.md](/x:/FindOne/server/API.md)

## 7. Docker workflow

1. Start everything:
   `npm run docker:up`
2. Frontend:
   `http://localhost:3000`
3. Backend:
   `http://localhost:8000`
4. Stop everything:
   `npm run docker:down`

## 8. What is still left after final phase

The core platform foundation is complete, but these are still good next improvements:

- wire the frontend pages fully to backend APIs
- add realtime messaging with Socket.IO
- integrate a real payment gateway
- move uploads to cloud storage
- expand automated tests
- prepare production deployment secrets and CI/CD
