const GAS_URL = 'https://script.google.com/macros/s/AKfycbzi9ALKksiZ8XMVmlqyOrGFdZF-1-Mh4zrzQoERxnY34uyvIWf0xbytk5CfllaGUkncuw/exec';

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
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = await new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => resolve(raw));
        req.on('error', reject);
      });

      const response = await fetch(GAS_URL, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'text/plain' },
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
