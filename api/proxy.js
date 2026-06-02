// ═══════════════════════════════════════════════════════════════
// api/proxy.js — FIXED (paste into GitHub as api/proxy.js)
// Fixes: method name mismatch + filter encoding + PATCH support
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://brxwfnojgvjnttayblva.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHdmbm9qZ3ZqbnR0YXlibHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1NTMyNDksImV4cCI6MTcxODExNTI0OX0.J6W8n1Z2-cZ0zDt5bYx6K-JrZqZ2f2f2f2f2f2f2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, table, data, query } = req.body;

    function buildParams(query) {
      const params = new URLSearchParams();
      if (!query) return params;
      for (const [key, value] of Object.entries(query)) {
        if (key === 'select') continue;
        if (key.endsWith('=eq')) {
          const col = key.replace('=eq', '');
          params.append(col, `eq.${value}`);
        } else {
          params.append(key, value);
        }
      }
      return params;
    }

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };

    // ── GET (SELECT) ──
    if (method === 'GET') {
      const params = buildParams(query);
      const paramStr = params.toString();
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=*${paramStr ? '&' + paramStr : ''}`;
      const r = await fetch(url, { headers });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).json(await r.json());
    }

    // ── POST (INSERT) ──
    if (method === 'POST') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const text = await r.text();
      return res.status(200).json(text ? JSON.parse(text) : []);
    }

    // ── PATCH (UPDATE) ──
    if (method === 'PATCH') {
      const params = buildParams(query);
      const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      const text = await r.text();
      return res.status(200).json(text ? JSON.parse(text) : []);
    }

    // ── DELETE ──
    if (method === 'DELETE') {
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${data.id}`;
      const r = await fetch(url, { method: 'DELETE', headers });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() });
      return res.status(200).end();
    }

    return res.status(400).json({ error: 'Unknown method' });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
