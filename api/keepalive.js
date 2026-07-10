// Vercel Cron target: keeps the Supabase free-tier project awake.
//
// Supabase pauses a free project after ~7 days of inactivity. A single trivial
// query per day resets that idle clock, so the project never pauses.
//
// Scheduled by the "crons" entry in vercel.json (once/day on Hobby).
// Reads the same Supabase env vars the app uses. Set these in the Vercel
// dashboard (Project → Settings → Environment Variables):
//   VITE_SUPABASE_URL        (or SUPABASE_URL)
//   VITE_SUPABASE_ANON_KEY   (or SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const url =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res
      .status(500)
      .json({ ok: false, error: 'Supabase env vars not configured' });
  }

  try {
    // A cheap read against PostgREST. `HEAD` + limit=0 touches the DB (which
    // is what resets the idle timer) without transferring any rows.
    const resp = await fetch(`${url}/rest/v1/rooms?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        // Ask PostgREST for just the count, not the rows.
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });

    // 200/206 (partial content) both mean the DB responded — success.
    const ok = resp.ok || resp.status === 206;
    return res.status(ok ? 200 : 502).json({
      ok,
      status: resp.status,
      pingedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) });
  }
}
