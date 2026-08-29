-- ---------- donation reliability: idempotent inserts ----------
-- Problem: on a flaky connection, the browser can send an "add donation"
-- request, the insert can succeed on the server, but the response never
-- makes it back (timeout / dropped Wi-Fi / phone locks). Without this,
-- the app has no way to tell "did that save?" from "did that fail?", and
-- a retry (automatic or the user tapping Save again) creates a *second*
-- donation row for the same money.
--
-- Fix: every donation the client creates carries a client-generated
-- `client_id` (a UUID made in the browser before the network call). The
-- client always retries with the *same* client_id, and upserts on it
-- instead of inserting blind. Two requests with the same client_id can
-- only ever produce one row, no matter how many times they're sent.

alter table donations
  add column if not exists client_id uuid;

create unique index if not exists donations_client_id_key
  on donations (client_id)
  where client_id is not null;

-- Older rows (created before this migration, or via the admin dashboard
-- directly) have no client_id and are unaffected — the partial unique
-- index only applies where client_id is not null, so it never blocks
-- normal historical data.
