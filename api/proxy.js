const GAS_URL = process.env.GAS_URL;
const GAS_PASSWORD = process.env.GAS_PASSWORD;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://nsbe-finance.vercel.app';

if (!GAS_URL) throw new Error('GAS_URL env var is required');
if (!GAS_PASSWORD) throw new Error('GAS_PASSWORD env var is required');

const MAX_BODY_BYTES = 65536;
const TIMEOUT_MS = 15000;
const ALLOWED_ACTIONS = ['create', 'update', 'delete'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    if (req.method === 'GET') {
      const response = await fetch(GAS_URL, { signal });
      const data = await response.json();
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
        signal,
      });
      const result = await response.json();
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
