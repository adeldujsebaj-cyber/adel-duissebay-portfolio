# Adel Duissebay — academic portfolio

Public portfolio for Adel Duissebay, AI Business, Astana IT University, Group 2603 AIB.

## Production

The Vercel Node.js server renders independent portfolio pages. Supabase Postgres stores the editable profile, records and document metadata. Supabase Storage preserves the original documents and two portraits. Public visitors can browse and download without signing in. Supabase Auth protects the owner dashboard at `/admin`; only the verified owner email is authorized by both the server and database RLS.

File uploads go directly from the owner’s browser to signed Supabase Storage URLs. They do not pass through the Vercel request body limit. Current limits are 50 MiB for MOV/MP4, 20 MiB for other supported documents, and 8 MiB for photographs. The existing Assignment 2 MOV is preserved.

## Open in VS Code

Use Node.js 24, then run `npm ci` and `npm run dev`. The local snapshot runner listens only on http://127.0.0.1:3000 and uses SQLite and local files. With the full backup ZIP, it restores the bundled `backup/` directory. The Git repository excludes that directory and all credentials; production originals are in Supabase Storage.

Local snapshot administrator access is provided only on the loopback development server. Production uses verified Supabase Auth sessions and never trusts client-supplied identity headers.

## Vercel and Supabase configuration

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel. `PUBLIC_ORIGIN` defaults to https://adel-duissebay-portfolio-adel-8924.vercel.app. Secrets belong in protected environment settings, never in Git. The runtime uses public keys plus the authenticated owner’s JWT; it does not require a service-role key for public reads or administrator uploads.

Database schema and RLS are recorded in `supabase/migrations/`. All tables have RLS enabled. The private authorization function checks the verified email in `auth.users`, rather than user-editable metadata. The first visitor cannot claim ownership.

`npm run build` validates the Vercel server. `npm test` runs the portfolio regression suite. `node --env-file=.env.local --test scripts/migration.test.mjs` runs an integration check against a configured Supabase project, including a temporary test upload that is deleted. That check additionally requires a server-only Supabase secret key.

The original Sites build remains available as `npm run build:sites` for archival compatibility.
