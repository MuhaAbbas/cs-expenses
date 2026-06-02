const SUPABASE_URL = 'https://brxwfnojgvjnttayblva.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHdmbm9qZ3ZqbnR0YXlibHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1NTMyNDksImV4cCI6MTcxODExNTI0OX0.J6W8n1Z2-cZ0zDt5bYx6K-JrZqZ2f2f2f2f2f2f2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, table, data, filters } = req.body;

    if (method === 'INSERT') {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Insert error:', error);
        return res.status(response.status).json({ error });
      }

      return res.status(200).json(await response.json());
    }

    if (method === 'SELECT') {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
      
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          url += `&${key}=eq.${encodeURIComponent(value)}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Select error:', error);
        return res.status(response.status).json({ error });
      }

      return res.status(200).json(await response.json());
    }

    if (method === 'DELETE') {
      let url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${data.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ error });
      }

      return res.status(200).end();
    }

    return res.status(400).json({ error: 'Unknown method' });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
