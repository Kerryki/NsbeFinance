const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbx50E1kGmyxAR9nq5LV47Npo5No7yCQYunCcgAuVI0h9DHwGtt0Vn0gehU1E4u_ySMpcQ/exec';
const GAS_PASSWORD = process.env.GAS_PASSWORD || 'nsbe2025';

const MAX_BODY_BYTES = 65536;
const TIMEOUT_MS = 15000;
const ALLOWED_ACTIONS = ['create', 'update', 'delete'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(GAS_URL);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({ error: 'GAS returned non-JSON', status: response.status, body: text.slice(0, 500) });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const raw = await new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
          size += chunk.length;
          if (size > MAX_BODY_BYTES) return reject(new Error('Payload too large'));
          body += chunk;
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
      });

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }

      const { action, sheet, data, id } = parsed;
      if (!ALLOWED_ACTIONS.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const payload = { action, sheet, data, id, password: GAS_PASSWORD };

      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain' },
      });
      const result = await response.json();
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
