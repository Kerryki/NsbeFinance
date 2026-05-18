const GAS_URL = 'https://script.google.com/macros/s/AKfycbzi9ALKksiZ8XMVmlqyOrGFdZF-1-Mh4zrzQoERxnY34uyvIWf0xbytk5CfllaGUkncuw/exec';
const GAS_PASSWORD = process.env.GAS_PASSWORD || 'nsbe2025';
const MAX_BODY_BYTES = 65536;
const TIMEOUT_MS = 15000;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

      const payload = JSON.parse(raw);
      payload.password = GAS_PASSWORD;

      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain' },
        signal,
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
