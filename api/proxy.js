// Vercel Serverless Function - Proxy API for Supabase
// File: api/proxy.js
// FIXED VERSION - Better error handling

const SUPABASE_URL = 'https://mymbzwukcnuojkeglwcn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bWJ6d3VrY251b2prZWdsd2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjEyMTAsImV4cCI6MjA5NDY5NzIxMH0.cRjSQG5CglrExGk3q7BRoqR-NR_lOYyeqLFOUBoyE7o';

export default async function handler(req, res) {
  // CORS headers
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

    // Build URL
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    
    // Add query parameters
    const queryArray = [];
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle filter syntax like "col=eq.value" vs "col" "value"
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

    // Prepare fetch options
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

    // Make request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Read response
    const responseText = await response.text();
    let responseData;

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error(`[Proxy] JSON parse error:`, e.message);
      responseData = { error: 'Invalid JSON response from Supabase' };
    }

    // Log response
    console.log(`[Proxy] Status ${response.status}:`, responseData);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: responseData.error || responseData.message || 'Supabase error',
        details: responseData
      });
    }

    // Return data
    res.status(response.status).json(responseData);

  } catch (error) {
    console.error('[Proxy] Error:', error.message, error.stack);
    
    // Distinguish between different error types
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
