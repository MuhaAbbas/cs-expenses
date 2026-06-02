const SUPABASE_URL = 'https://brxwfnojgvjnttayblva.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qT-YSjbqf00FWBUI7QUoCA_noOT1WzU';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { method, table, data, query } = req.body;

    // ── SELECT (GET) ──
    if (method === 'GET') {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (key === 'select') continue; // already added
          url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      }
      const r = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json(await r.json());
    }

    // ── INSERT (POST) ──
    if (method === 'POST') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json(await r.json());
    }

    // ── UPDATE (PATCH) ──
    if (method === 'PATCH') {
      let url = `${SUPABASE_URL}/rest/v1/${table}?`;
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          url += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        }
      }
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json(await r.json());
    }

    // ── DELETE ──
    if (method === 'DELETE') {
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${data.id}`;
      const r = await fetch(url, { method: 'DELETE', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).end();
    }

    return res.status(400).json({ error: 'Unknown method' });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
