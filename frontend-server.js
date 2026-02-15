const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  const requestedPath = req.url.split('?')[0];
  let filePath = requestedPath === '/' ? 'index.html' : requestedPath;
  // normalize and prevent directory traversal
  const safePath = path.normalize(filePath).replace(/^([\/.\\])+/, '');
  filePath = path.join(__dirname, safePath);
  const resolvedBase = path.resolve(__dirname);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(resolvedBase)) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Frontend server running on http://localhost:${PORT}`);
});
