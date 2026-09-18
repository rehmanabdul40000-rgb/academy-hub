# Academy Hub — Scalable Data Mode

Academy Hub currently keeps its working browser data in local storage so the existing localhost workflow remains stable.

For a real academy deployment with many computers, many staff users, and millions of student records, use the Supabase/PostgreSQL mode prepared in this repository.

## What is already prepared

- PostgreSQL tables for workspaces, staff members, shifts, students, payments, and settings.
- Workspace-level Row Level Security.
- Granular permission checks at the database policy layer.
- Indexed student ID, name, course, gender, shift, and payment queries.
- PostgreSQL full-text search index.
- Paginated student reads (the browser never needs to load the whole database).
- Bulk upsert API for import batches.
- A Settings status card that reports whether the server-side database is connected.
- Bulk local Excel/CSV import now writes the local student list once per import instead of once per row.

## Activation

1. Create/connect the Academy Hub Supabase project.
2. Run supabase/migrations/20260918_academy_hub_scalable_core.sql in the Supabase SQL Editor.
3. Configure server environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
4. Configure browser variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
5. Move the Students, Payments, Users, Shifts, Dashboard metrics, and Excel/report queries to the paginated server data functions.
6. Import existing Excel data in controlled batches and verify counts before switching the workspace to cloud mode.

## Important capacity note

The database design is intended for high-volume operation, but “10 million+ students” is not a promise about every Supabase plan or hardware configuration. Actual capacity depends on database compute, disk, indexes, query patterns, backups, and import strategy. Large production imports should use PostgreSQL bulk loading/COPY or another controlled batch process rather than repeatedly writing one browser record at a time.

Do not expose SUPABASE_SERVICE_ROLE_KEY in browser code or Vercel VITE_* variables. It must remain server-side only.
