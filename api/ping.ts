import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSQL } from '../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { mod_id, mod_version, instance_id } = req.body ?? {};

    if (!mod_id || !mod_version || !instance_id) {
      res.status(200).json({ ok: true });
      return;
    }

    if (
      typeof mod_id !== 'string' || mod_id.length > 100 ||
      typeof mod_version !== 'string' || mod_version.length > 20 ||
      typeof instance_id !== 'string' || instance_id.length > 50
    ) {
      res.status(200).json({ ok: true });
      return;
    }

    const sql = getSQL();
    await sql`
      INSERT INTO pings (instance_id, mod_id, mod_version, ping_date)
      VALUES (${instance_id}, ${mod_id}, ${mod_version}, CURRENT_DATE)
      ON CONFLICT (instance_id, mod_id, ping_date)
      DO UPDATE SET mod_version = ${mod_version}, updated_at = NOW()
    `;

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Ping error:', error);
    res.status(200).json({ ok: true });
  }
}
