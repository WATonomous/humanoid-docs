#!/usr/bin/env node
// npm start  ->  build, serve, and rebuild + reload the browser whenever a file changes.
// Each rebuild runs in a fresh process so edits to the theme/components/config are picked up.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT} from './lib/build.js';
import {serve} from './lib/server.js';
import config from '../site.config.js';

const port = Number(process.env.PORT || 3000);
const out = path.join(ROOT, '.dev-build');
const clients = new Set();
let building = false;
let queued = false;

function rebuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--dev', '--out', out], {stdio: 'inherit'});
  child.on('exit', (code) => {
    building = false;
    if (code === 0) for (const res of clients) res.write('data: reload\n\n');
    if (queued) {
      queued = false;
      rebuild();
    }
  });
}

let timer;
for (const dir of ['docs', 'blog', 'components', 'theme', 'scripts', 'site.config.js']) {
  fs.watch(path.join(ROOT, dir), {recursive: true}, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
}

serve({
  roots: [out, path.join(ROOT, 'static')],
  base: config.baseUrl,
  port,
  onRequest(req, res) {
    if (req.url !== '/__reload') return false;
    res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'});
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return true;
  },
});
console.log(`Dev server: http://localhost:${port}${config.baseUrl}  (edits rebuild and reload automatically)`);
rebuild();
