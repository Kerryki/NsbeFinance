const GAS_URL = 'https://script.google.com/macros/s/AKfycbzi9ALKksiZ8XMVmlqyOrGFdZF-1-Mh4zrzQoERxnY34uyvIWf0xbytk5CfllaGUkncuw/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const options = { method: req.method };
    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
      options.headers = { 'Content-Type': 'text/plain' };
    }

    const response = await fetch(GAS_URL, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
