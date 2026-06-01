const SUPABASE_URL = 'https://brxwfnojgvjnttayblva.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qT-YSjbqf00FWBUI7QUoCA_noOT1WzU';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');

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
    
    const queryArray = [];
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key.includes('=eq')) {
          queryArray.push(`${key}=${encodeURIComponent(value)}`);
        } else {
          queryArray.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
    });

    if (queryArray.length > 0) {
      url += '?' + queryArray.join('&');
    }

    console.log(`[Proxy] ${method} ${url}`);

    const fetchOptions = {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      }
    };

    if (method !== 'GET' && bodyData) {
      fetchOptions.body = JSON.stringify(bodyData);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error(`[Proxy] JSON parse error:`, e.message);
      responseData = { error: 'Invalid JSON response from Supabase' };
    }

    console.log(`[Proxy] Status ${response.status}:`, responseData);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: responseData.error || responseData.message || 'Supabase error',
        details: responseData
      });
    }

    res.status(response.status).json(responseData);

  } catch (error) {
    console.error('[Proxy] Error:', error.message, error.stack);
    
    let errorMsg = 'Proxy request failed';
    
    if (error.name === 'AbortError') {
      errorMsg = 'Request timeout';
    } else if (error.message.includes('fetch')) {
      errorMsg = 'Network error - cannot reach Supabase';
    }

    res.status(500).json({
      error: errorMsg,
      details: error.message,
      type: error.name
    });
  }
}
