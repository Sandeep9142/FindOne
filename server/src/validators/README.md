# Validation Conventions

Validation will be added for request bodies, params, and query values.

Planned rule:

- validate at route level before controller logic
- return consistent `400` responses using the shared API error format
