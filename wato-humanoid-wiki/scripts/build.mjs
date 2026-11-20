#!/usr/bin/env node
// npm run build  ->  static site in build/
import {build} from './lib/build.js';

const dev = process.argv.includes('--dev');
const outIdx = process.argv.indexOf('--out');
const outDir = outIdx > 0 ? process.argv[outIdx + 1] : undefined;

build({dev, outDir}).catch((err) => {
  console.error(`\nBuild failed: ${process.env.DEBUG ? err.stack : err.message}`);
  process.exit(1);
});
