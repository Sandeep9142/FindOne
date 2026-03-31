# Backend Conventions

Phase 1 backend conventions for FindOne:

- Controllers use `asyncHandler`
- Success responses use `sendSuccess`
- Errors flow through centralized middleware
- Route-level validation will be added before controller logic
- API base path is `/api/v1`
