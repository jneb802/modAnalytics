// Database utilities for mod analytics
// Uses @neondatabase/serverless for Neon Postgres (Vercel Postgres successor).
// Reads DATABASE_URL from environment. The `neon()` function returns a sql template tag.

import { neon } from '@neondatabase/serverless';

export function getSQL() {
  return neon(process.env.DATABASE_URL!, { fullResults: true });
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pings (
    id            BIGSERIAL PRIMARY KEY,
    instance_id   VARCHAR(50) NOT NULL,
    mod_id        VARCHAR(100) NOT NULL,
    mod_version   VARCHAR(20) NOT NULL,
    ping_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ping_per_day UNIQUE (instance_id, mod_id, ping_date)
);

CREATE INDEX IF NOT EXISTS idx_pings_mod_date ON pings (mod_id, ping_date);
`;

// Friendly display names for Discord reports
export const MOD_DISPLAY_NAMES: Record<string, string> = {
  'warpalicious.More_World_Locations_AIO': 'MWL AIO',
  'warpalicious.More_World_Traders': 'More World Traders',
  'warpalicious.Forbidden_Catacombs': 'Forbidden Catacombs',
  'warpalicious.Underground_Ruins': 'Underground Ruins',
};

export function friendlyName(modId: string): string {
  return MOD_DISPLAY_NAMES[modId] ?? modId;
}
