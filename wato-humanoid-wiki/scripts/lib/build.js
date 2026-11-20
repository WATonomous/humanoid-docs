// Builds the whole site into build/. Used by `npm run build` and the dev server.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRenderer, splitExcerpt} from './markdown.js';
import {loadDocs, loadBlog} from './content.js';
import {feeds} from './feeds.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const r = (...p) => path.join(ROOT, ...p);

async function load(rel) {
  return (await import(pathToFileURL(r(rel)).href)).default;
}

function hashOf(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, content);
}

function copyDir(from, to, filter = () => true) {
  fs.cpSync(from, to, {recursive: true, filter});
}

export async function build({dev = false, outDir = r('build'), log = console.log} = {}) {
  const t0 = Date.now();
  const config = await load('site.config.js');
  const layout = await import(pathToFileURL(r('theme/layout.js')).href);
  const components = await load('components/index.js');
  const base = config.baseUrl;

  const {docs, sidebar, generatedPages} = loadDocs(r('docs'));
  const blog = loadBlog(r('blog'));

  // ---- routes & link resolution -----------------------------------------
  const url = (route) => base + (route === '/' ? '' : route.replace(/^\//, '') + '/');
  const routes = new Map();
  const fileToRoute = new Map();
  for (const d of docs) {
    routes.set(d.route, d);
    fileToRoute.set(d.file, d.route);
  }
  for (const g of generatedPages) routes.set(g.route, g);
  for (const p of blog.posts) {
    routes.set(p.route, p);
    fileToRoute.set(p.file, p.route);
  }
  for (const t of blog.tags) routes.set(t.route, t);
  for (const extra of ['/blog', '/blog/tags', '/blog/archive', '/blog/authors']) routes.set(extra, {});

  const warnings = [];
  const staticDir = r('static');
  function resolveUrl(raw, fromFile) {
    if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(raw)) return raw;
    const m = raw.match(/^([^?#]*)(.*)$/);
    let [, p, rest] = m;
    const rel = path.relative(ROOT, fromFile);
    if (p.startsWith('/')) {
      if (p === base.replace(/\/$/, '') || p.startsWith(base)) p = '/' + p.slice(base.length);
      if (p !== '/' && fs.existsSync(path.join(staticDir, decodeURIComponent(p)))) return base + p.slice(1) + rest;
      const route = p.replace(/\/+$/, '') || '/';
      if (routes.has(route)) return url(route) + rest;
      warnings.push(`${rel}: broken link ${raw}`);
      return base + p.slice(1) + rest;
    }
    if (!p) return raw;
    const abs = path.resolve(path.dirname(fromFile), decodeURIComponent(p));
    for (const c of [abs, `${abs}.md`, `${abs}.mdx`, path.join(abs, 'index.md'), path.join(abs, 'index.mdx')]) {
      if (fileToRoute.has(c)) return url(fileToRoute.get(c)) + rest;
    }
    warnings.push(`${rel}: unresolved relative link ${raw}`);
    return raw;
  }

  const renderMarkdown = createRenderer({
    components,
    resolveUrl,
    codeThemes: {light: config.code.lightTheme, dark: config.code.darkTheme},
  });

  const needsOf = (rendered) => ({math: rendered.html.includes('class="katex'), mermaid: !!rendered.hasMermaid});

  // ---- render content ---------------------------------------------------
  for (const d of docs) {
    d.rendered = await renderMarkdown(d.body, d.file);
    d.rendered.needs = needsOf(d.rendered);
  }
  for (const p of blog.posts) {
    const {excerpt, body} = splitExcerpt(p.body);
    p.rendered = await renderMarkdown(body, p.file);
    p.needs = needsOf(p.rendered);
    p.truncated = excerpt !== null;
    const ex = excerpt !== null ? await renderMarkdown(excerpt, p.file) : p.rendered;
    p.excerptHtml = ex.html;
    p.description ??= ex.firstParagraph;
    const words = p.body.split(/\s+/).filter(Boolean).length;
    p.readingTime = Math.max(1, Math.ceil(words / config.blog.wordsPerMinute));
  }

  // ---- assets -----------------------------------------------------------
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});

  const cssFiles = [
    ...fs.readdirSync(r('theme/css')).filter((f) => f.endsWith('.css')).sort().map((f) => r('theme/css', f)),
    ...fs.readdirSync(r('components')).filter((f) => f.endsWith('.css')).sort().map((f) => r('components', f)),
  ];
  const css = cssFiles.map((f) => `/* ${path.relative(ROOT, f)} */\n${fs.readFileSync(f, 'utf8')}`).join('\n');
  const js = fs.readFileSync(r('theme/js/site.js'), 'utf8');
  const assets = {
    css: `assets/site.${hashOf(css)}.css`,
    js: `assets/site.${hashOf(js)}.js`,
    mermaid: 'assets/vendor/mermaid/mermaid.esm.min.mjs',
  };
  write(path.join(outDir, assets.css), css);
  write(path.join(outDir, assets.js), js);

  const nm = r('node_modules');
  copyDir(path.join(nm, 'katex/dist/fonts'), path.join(outDir, 'assets/katex/fonts'));
  fs.copyFileSync(path.join(nm, 'katex/dist/katex.min.css'), path.join(outDir, 'assets/katex/katex.min.css'));
  const mermaidSrc = path.join(nm, 'mermaid/dist');
  const mermaidOut = path.join(outDir, 'assets/vendor/mermaid');
  fs.mkdirSync(mermaidOut, {recursive: true});
  fs.copyFileSync(path.join(mermaidSrc, 'mermaid.esm.min.mjs'), path.join(mermaidOut, 'mermaid.esm.min.mjs'));
  copyDir(path.join(mermaidSrc, 'chunks/mermaid.esm.min'), path.join(mermaidOut, 'chunks/mermaid.esm.min'), (src) =>
    fs.statSync(src).isDirectory() || src.endsWith('.mjs'),
  );
  // In dev the server falls back to static/ directly; copying ~100 MB each rebuild is slow.
  if (!dev) copyDir(staticDir, outDir);

  // ---- pages ------------------------------------------------------------
  const ctx = {
    config,
    dev,
    assets,
    blog,
    url,
    asset: (p) => base + p.replace(/^\//, ''),
    absUrl: (route, {file = false} = {}) => config.url + (file ? base + route.replace(/^\//, '') : url(route)),
  };
  const pageFile = (route) => path.join(outDir, route === '/' ? '' : route, 'index.html');

  for (const doc of docs) write(pageFile(doc.route), layout.docPage(ctx, {doc, sidebar, rendered: doc.rendered}));
  for (const gen of generatedPages) write(pageFile(gen.route), layout.generatedIndexPage(ctx, {gen, sidebar}));
  write(pageFile('/blog'), layout.blogListPage(ctx, {posts: blog.posts}));
  for (const post of blog.posts) write(pageFile(post.route), layout.blogPostPage(ctx, {post}));
  write(pageFile('/blog/tags'), layout.tagsIndexPage(ctx, {tags: blog.tags}));
  for (const tag of blog.tags) write(pageFile(tag.route), layout.tagPage(ctx, {tag}));
  write(pageFile('/blog/archive'), layout.archivePage(ctx, {posts: blog.posts}));
  write(pageFile('/blog/authors'), layout.authorsPage(ctx, {authors: blog.authors, posts: blog.posts}));
  write(path.join(outDir, '404.html'), layout.notFoundPage(ctx));

  // ---- search index, feeds, sitemap ---------------------------------------
  const index = [];
  const addToIndex = (pageTitle, route, kind, sections) => {
    for (const s of sections) {
      index.push({p: pageTitle, u: url(route) + (s.id ? `#${s.id}` : ''), k: kind, h: s.heading, x: s.text.slice(0, 1500)});
    }
  };
  for (const d of docs) addToIndex(d.title, d.route, 'Docs', d.rendered.sections);
  for (const p of blog.posts) addToIndex(p.title, p.route, 'Blog', p.rendered.sections);
  write(path.join(outDir, 'search-index.json'), JSON.stringify(index));

  const {rss, atom} = feeds({config, posts: blog.posts, url, base});
  write(path.join(outDir, 'blog/rss.xml'), rss);
  write(path.join(outDir, 'blog/atom.xml'), atom);

  const sitemapRoutes = [...routes.keys()].sort();
  write(
    path.join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes
      .map((rt) => `  <url><loc>${config.url}${url(rt)}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
      .join('\n')}\n</urlset>\n`,
  );

  const pages = docs.length + generatedPages.length + blog.posts.length + blog.tags.length + 5;
  for (const w of [...new Set(warnings)]) log(`  warning: ${w}`);
  log(`Built ${pages} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${path.relative(process.cwd(), outDir) || '.'}`);
  return {warnings};
}
