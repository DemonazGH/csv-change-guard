'use strict';
// Optional localhost-only fallback when a managed browser blocks direct HTML files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
const file = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(file)) throw new Error('Build first: npm run build');
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  if (!['/', '/index.html'].includes(req.url.split('?')[0])) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
});
server.on('error', err => { console.error('Server error:', err.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`CSV Change Guard: http://127.0.0.1:${port}\nPress Ctrl+C to stop. This server does not accept file uploads.`));
process.on('SIGINT', () => server.close());
