// Vercel Serverless Function - Proxy API for Supabase
// File: api/proxy.js

const SUPABASE_URL = 'https://mymbzwukcnuojkeglwcn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bWJ6d3VrY251b2prZWdsd2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjEyMTAsImV4cCI6MjA5NDY5NzIxMH0.cRjSQG5CglrExGk3q7BRoqR-NR_lOYyeqLFOUBoyE7o';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { table, method = 'GET', query = {}, data: bodyData } = req.body;

    if (!table) {
      return res.status(400).json({ error: 'Missing table parameter' });
    }

    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }

    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      }
    };

    if (method !== 'GET' && bodyData) {
      options.body = JSON.stringify(bodyData);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(responseData);
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: error.message,
      details: error.toString()
    });
  }
}
