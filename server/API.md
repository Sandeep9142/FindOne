# FindOne Backend API

Base URL:

- `http://127.0.0.1:8000/api/v1`

Authentication:

- protected routes require `Authorization: Bearer <token>`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Categories

- `GET /categories`

## Users and Profiles

- `GET /users/me`
- `PUT /users/me`
- `POST /users/me/avatar`
- `GET /workers`
- `GET /workers/search`
- `GET /workers/:id`
- `GET /workers/:id/reviews`
- `GET /workers/profile/me`
- `PUT /workers/profile`
- `POST /workers/avatar`
- `POST /workers/portfolio`
- `GET /clients/profile`
- `PUT /clients/profile`

## Jobs

- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs`
- `PUT /jobs/:id`
- `DELETE /jobs/:id`
- `POST /jobs/:id/apply`
- `GET /jobs/:id/applications`
- `GET /jobs/my/posted`
- `GET /jobs/my/applied`

## Bookings

- `GET /bookings`
- `GET /bookings/:id`
- `POST /bookings`
- `PUT /bookings/:id`
- `PATCH /bookings/:id/status`
- `PATCH /bookings/:id/cancel`
- `POST /bookings/:id/reviews`

## Conversations

- `GET /conversations`
- `POST /conversations`
- `GET /conversations/:id`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`
- `PATCH /conversations/:id/read`

## Payments

- `GET /payments`
- `GET /payments/:id`
- `POST /payments`
- `PATCH /payments/:id/status`

## Response format

Success:

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Human-readable error summary",
  "errors": []
}
```

## Security and validation

- `helmet` is enabled
- rate limiting is enabled globally for `/api`
- stricter rate limiting is enabled on auth routes
- request validation is enforced on critical write flows using `zod`
