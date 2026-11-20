// Tiny static file server that mounts a directory at the site's baseUrl.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain',
};

export function serve({roots, base, port, onRequest}) {
  const server = http.createServer((req, res) => {
    if (onRequest?.(req, res)) return;
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/' || u.pathname === base.replace(/\/$/, '')) {
      res.writeHead(302, {Location: base}).end();
      return;
    }
    if (!u.pathname.startsWith(base)) {
      res.writeHead(404).end(`Not found. The site lives at ${base}`);
      return;
    }
    const rel = decodeURIComponent(u.pathname.slice(base.length));
    for (const root of roots) {
      let file = path.join(root, rel);
      if (!file.startsWith(root)) break;
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        if (!u.pathname.endsWith('/')) {
          res.writeHead(301, {Location: u.pathname + '/' + u.search}).end();
          return;
        }
        file = path.join(file, 'index.html');
      }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(req, res, file);
    }
    const notFound = path.join(roots[0], '404.html');
    res.writeHead(404, {'Content-Type': TYPES['.html']});
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
  });
  server.listen(port);
  return server;
}

function sendFile(req, res, file) {
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const {size} = fs.statSync(file);
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    // Videos need range requests to seek.
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, {'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1});
    fs.createReadStream(file, {start, end}).pipe(res);
    return;
  }
  res.writeHead(200, {'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'});
  fs.createReadStream(file).pipe(res);
}
