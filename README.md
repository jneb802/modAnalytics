# Mod Analytics

Lightweight, privacy-respecting telemetry server for Valheim mods. Receives anonymous pings from BepInEx mods and generates daily Discord usage reports.

## Architecture

- **POST /api/ping** -- Receives `{ mod_id, mod_version, instance_id }` from mods
- **GET /api/cron/daily-report** -- Vercel cron job (9 AM UTC) sends Discord embed

## Setup

1. `npm install`
2. `vercel link`
3. Add Neon Postgres: Vercel Dashboard > Storage > Create > Neon Postgres
4. Run the CREATE TABLE SQL from `lib/db.ts` via the Neon dashboard SQL editor
5. Set environment variables:
   - `DATABASE_URL` -- Neon Postgres connection string
   - `DISCORD_WEBHOOK_URL` -- Discord channel webhook URL
   - `CRON_SECRET` -- Vercel cron authentication token
6. `vercel --prod`

## Local Development

```bash
vercel dev
```

## Testing

```bash
curl -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"mod_id":"test.mod","mod_version":"1.0.0","instance_id":"test-uuid-123"}'
```
