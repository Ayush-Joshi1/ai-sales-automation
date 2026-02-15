// Simple proxy server to forward webhook POSTs to n8n endpoints to avoid CORS during local testing.
// Usage: node proxy-server.js

const http = require('http');
const https = require('https');
const url = require('url');

// Target webhook endpoints (the real external endpoints)
const TARGET_ORDER = 'https://techy.app.n8n.cloud/webhook/tally-sales-order';
const TARGET_QUOTE = 'https://techy.app.n8n.cloud/webhook/generate-invoice';
const TARGET_REVIEW = 'https://techy.app.n8n.cloud/webhook/submit-your-review';

const PORT = 5000;

function forwardRequest(target, req, res) {
  const parsed = url.parse(target);
  const options = {
    hostname: parsed.hostname,
    path: parsed.path,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: parsed.hostname })
  };

  const proxyReq = (parsed.protocol === 'https:' ? https : http).request(options, (proxyRes) => {
    // collect response body for logging
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      console.log(`Proxy response from ${target}:`, proxyRes.statusCode, body.substring(0, 1000));
      // set CORS so browser can read response
      const headers = Object.assign({}, proxyRes.headers, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.writeHead(proxyRes.statusCode, headers);
      res.end(body);
    });
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy request error:', e);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    // simple CORS preflight
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  if (req.url === '/webhook/order' && req.method === 'POST') {
    console.log('Proxying order webhook to', TARGET_ORDER);
    forwardRequest(TARGET_ORDER, req, res);
    return;
  }

  if (req.url === '/webhook/quotation' && req.method === 'POST') {
    console.log('Proxying quotation webhook to', TARGET_QUOTE);
    forwardRequest(TARGET_QUOTE, req, res);
    return;
  }

  if (req.url === '/webhook/review' && req.method === 'POST') {
    console.log('Proxying review webhook to', TARGET_REVIEW);
    forwardRequest(TARGET_REVIEW, req, res);
    return;
  }

  // Default: simple status
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
  console.log('Endpoints: POST /webhook/order ->', TARGET_ORDER);
  console.log('           POST /webhook/quotation ->', TARGET_QUOTE);
  console.log('           POST /webhook/review ->', TARGET_REVIEW);
});
