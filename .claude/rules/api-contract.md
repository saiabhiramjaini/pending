---
paths:
  - "server/packages/api-contract/**"
---

# Working in `server/packages/api-contract/`

This package is the **source of truth** for HTTP. If a handler and this package disagree, this package wins, so fix the handler.

**Change schemas here before handlers or hooks.** Server `validate()` and client `unwrapSuccess()` / `unwrapApiResponse()` use these same schemas, so changing them first makes both sides fail typecheck where they need updating.

- Export Zod schemas and `z.infer` types. Never use `as` on wire JSON.
- Generate OpenAPI from Zod: register a new path in [`openapi.ts`](../../server/packages/api-contract/src/openapi.ts) so `/api/v1/docs` stays accurate. Do not maintain a separate YAML.
- Amounts use `amountRupeesSchema`.
- Shared limits live in [`constants.ts`](../../server/packages/api-contract/src/constants.ts). Do not copy `50` into a feature.

## One envelope

Success:

```json
{ "success": true, "message": "…", "data": {} }
```

Error, always:

```json
{ "success": false, "code": "NOT_FOUND", "message": "…", "details": [] }
```

Codes in use: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.
