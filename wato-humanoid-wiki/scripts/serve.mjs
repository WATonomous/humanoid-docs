#!/usr/bin/env node
// npm run serve  ->  preview the production build in build/
import path from 'node:path';
import {ROOT} from './lib/build.js';
import {serve} from './lib/server.js';
import config from '../site.config.js';

const port = Number(process.env.PORT || 3000);
serve({roots: [path.join(ROOT, 'build')], base: config.baseUrl, port});
console.log(`Serving build/ at http://localhost:${port}${config.baseUrl}`);
