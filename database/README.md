# SYNORA Revenue Center — Free D1 foundation

This branch contains a database schema draft only. It does **not** create a Cloudflare D1 database, deploy a Worker, enable customer access, activate billing, or make any of the eight offerings commercially available.

## Included

Migration `database/migrations/0001_revenue_center.sql` provides tables for:
- organizations and the eight-offering catalogue
- API clients (stores SHA-256 key hashes only; never store raw API keys)
- daily API usage counters
- one-time licence records
- reseller applications
- template submissions
- business-plan requests
- developer projects
- setup/training/support requests
- audit events

The initial status values intentionally default to draft, pending, disabled, or planned. No payment-card, bank, government-ID, student, or other highly sensitive data is part of this schema.

## Apply only after creating a free D1 database

1. In the Cloudflare dashboard, create a D1 database on the Free plan. Do not enable paid services or add payment details.
2. Add a Worker binding named `SYNORA_DB` pointing to that database.
3. Apply the migration with Wrangler from a trusted local environment:
   `npx wrangler d1 execute <DATABASE_NAME> --remote --file=database/migrations/0001_revenue_center.sql`
4. Verify the tables using a read-only query before connecting any application routes.

Do not paste Cloudflare API tokens, database secrets, or raw API keys into chat or commit them to GitHub. The D1 binding must remain server-side in a Worker; browser code must never receive database credentials.

## Security and release gates

- No public CRUD endpoint is included in this schema-only foundation.
- Before any live API access, implement per-client authentication, hashed-key verification, rate limiting, daily quota enforcement, origin/CSRF protections for browser sessions, input validation, and audit logging in a server-side Worker.
- API keys should be shown only once when created and stored as a one-way hash. Revoke compromised keys.
- Keep the eight offerings marked planned until each workflow is implemented and tested end-to-end.
- Use fake test records only until an authorised adult has reviewed privacy, security, and any commercial/legal requirements.
- This branch is isolated from `main` and the existing backup branch. Do not merge or deploy it to Production without explicit approval.
