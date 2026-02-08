import type { VercelRequest, VercelResponse } from '@vercel/node';
import { friendlyName, getSQL } from '../../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const sql = getSQL();

    const dauResult = await sql`
      SELECT mod_id, COUNT(DISTINCT instance_id)::int as dau
      FROM pings
      WHERE created_at::date = ${dateStr}::date
      GROUP BY mod_id
      ORDER BY dau DESC
    `;

    const versionResult = await sql`
      SELECT mod_id, mod_version, COUNT(DISTINCT instance_id)::int as users
      FROM pings
      WHERE created_at::date = ${dateStr}::date
      GROUP BY mod_id, mod_version
      ORDER BY mod_id, users DESC
    `;

    const totalResult = await sql`
      SELECT COUNT(DISTINCT instance_id)::int as total
      FROM pings
      WHERE created_at::date = ${dateStr}::date
    `;

    const totalUsers = totalResult.rows[0]?.total ?? 0;

    function versionBreakdown(modId: string): string {
      return versionResult.rows
        .filter((r) => r.mod_id === modId)
        .map((r) => `v${r.mod_version}: ${r.users}`)
        .join('\n');
    }

    const fields = dauResult.rows.map((row) => ({
      name: friendlyName(row.mod_id as string),
      value: `**${row.dau}** unique users\n${versionBreakdown(row.mod_id as string)}`,
      inline: true,
    }));

    if (fields.length === 0) {
      fields.push({
        name: 'No data',
        value: 'No pings were received yesterday.',
        inline: false,
      });
    }

    const embed = {
      title: `Daily Analytics Report - ${dateStr}`,
      color: 0x5865f2,
      fields,
      footer: { text: `Total unique users: ${totalUsers}` },
      timestamp: new Date().toISOString(),
    };

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not set');
      res.status(500).json({ error: 'Webhook not configured' });
      return;
    }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      console.error('Discord webhook failed:', discordRes.status, await discordRes.text());
    }

    res.status(200).json({ ok: true, date: dateStr, totalUsers });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
