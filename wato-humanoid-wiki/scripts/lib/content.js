// Discovers docs and blog posts on disk and works out routes, the docs sidebar,
// and blog metadata. No rendering happens here.
//
// Docs (docs/**.md / .mdx):
//   front matter: title, description, sidebar_label, sidebar_position, slug, id
//   docs/foo/index.md            -> /foo
//   docs/foo/bar.md              -> /foo/bar
//   docs/foo/_category_.json     -> {label, position, link: {type: 'doc', id} | {type: 'generated-index', description}}
// Blog (blog/YYYY-MM-DD-name.md):
//   front matter: title, slug, authors: [key], tags: [key], date, description
//   blog/authors.yml, blog/tags.yml

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {load as loadYaml} from 'js-yaml';
import GithubSlugger from 'github-slugger';

const MD = /\.mdx?$/;

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function readYaml(file) {
  return fs.existsSync(file) ? loadYaml(fs.readFileSync(file, 'utf8')) || {} : {};
}

// Front matter is stripped, but keep its lines blank so MDX errors report real line numbers.
function readMatter(abs) {
  const raw = fs.readFileSync(abs, 'utf8');
  const {data, content} = matter(raw);
  const offset = raw.split('\n').length - content.split('\n').length;
  return {data, content: '\n'.repeat(Math.max(0, offset)) + content};
}

function posix(p) {
  return p.split(path.sep).join('/');
}

// Docs sort like Docusaurus: by position, then unpositioned items by name.
function byPosition(a, b) {
  const pa = a.position ?? Infinity;
  const pb = b.position ?? Infinity;
  if (pa !== pb) return pa - pb;
  return a.sortName.localeCompare(b.sortName);
}

export function loadDocs(docsDir) {
  const docs = [];

  function readDoc(abs) {
    const rel = posix(path.relative(docsDir, abs));
    const {data: fm, content} = readMatter(abs);
    const dir = path.posix.dirname(rel) === '.' ? '' : path.posix.dirname(rel);
    const base = path.posix.basename(rel).replace(MD, '');
    const id = (dir ? `${dir}/` : '') + (fm.id ?? base);
    let route;
    if (fm.slug) route = fm.slug.startsWith('/') ? fm.slug : `/${dir ? `${dir}/` : ''}${fm.slug}`;
    else if (base === 'index') route = `/${dir}`;
    else route = `/${dir ? `${dir}/` : ''}${fm.id ?? base}`;
    route = route.replace(/\/+$/, '') || '/';
    const h1 = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const doc = {
      kind: 'doc',
      id,
      file: abs,
      relFile: rel,
      route,
      frontMatter: fm,
      body: content,
      title: fm.title ?? h1 ?? base,
      sidebarLabel: fm.sidebar_label ?? fm.title ?? h1 ?? base,
      description: fm.description,
      position: fm.sidebar_position,
      sortName: base,
    };
    docs.push(doc);
    return doc;
  }

  // Build the sidebar tree for one directory.
  function walk(absDir, relDir) {
    const items = [];
    const entries = fs.readdirSync(absDir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name));
    const dirDocs = [];
    for (const e of entries) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const abs = path.join(absDir, e.name);
      if (e.isDirectory()) {
        items.push(walkCategory(abs, relDir ? `${relDir}/${e.name}` : e.name));
      } else if (MD.test(e.name)) {
        dirDocs.push(readDoc(abs));
      }
    }
    return {items, dirDocs};
  }

  function walkCategory(abs, rel) {
    const meta = readJson(path.join(abs, '_category_.json')) || {};
    const {items, dirDocs} = walk(abs, rel);
    let linkDoc = null;
    let generated = null;
    const linkId = meta.link?.type === 'doc' ? meta.link.id : null;
    if (linkId) linkDoc = dirDocs.find((d) => d.id === linkId);
    else if (!meta.link) linkDoc = dirDocs.find((d) => /(^|\/)index\.mdx?$/.test(d.relFile)) || null;
    const label = meta.label ?? linkDoc?.sidebarLabel ?? path.basename(abs);
    if (meta.link?.type === 'generated-index') {
      const slugger = new GithubSlugger();
      generated = {
        kind: 'generated-index',
        route: meta.link.slug ?? `/category/${slugger.slug(label)}`,
        title: meta.link.title ?? label,
        description: meta.link.description,
      };
    }
    for (const d of dirDocs) {
      if (d !== linkDoc) items.push({type: 'doc', doc: d, label: d.sidebarLabel, position: d.position, sortName: d.sortName});
    }
    items.sort(byPosition);
    const category = {
      type: 'category',
      label,
      position: meta.position ?? linkDoc?.position,
      sortName: path.basename(abs),
      collapsed: meta.collapsed ?? true,
      link: linkDoc ? {doc: linkDoc} : generated ? {generated} : null,
      items,
    };
    if (generated) generated.category = category;
    if (linkDoc) linkDoc.category = category;
    return category;
  }

  const {items, dirDocs} = walk(docsDir, '');
  for (const d of dirDocs) items.push({type: 'doc', doc: d, label: d.sidebarLabel, position: d.position, sortName: d.sortName});
  items.sort(byPosition);

  // Flatten for prev/next and breadcrumbs.
  const sequence = [];
  const generatedPages = [];
  function flatten(list, parents) {
    for (const item of list) {
      if (item.type === 'doc') {
        item.doc.parents = parents;
        sequence.push(item.doc);
      } else {
        const page = item.link?.doc || item.link?.generated;
        if (page) {
          page.parents = parents;
          sequence.push(page);
          if (item.link.generated) generatedPages.push(item.link.generated);
        }
        flatten(item.items, [...parents, item]);
      }
    }
  }
  flatten(items, []);
  sequence.forEach((page, i) => {
    page.prev = sequence[i - 1] || null;
    page.next = sequence[i + 1] || null;
  });

  return {docs, sidebar: items, generatedPages};
}

// first photo in a post, or the poster of a video if that comes first
function firstPhoto(md) {
  for (const [, src, title = ''] of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g)) {
    if (/\.(jpe?g|png|webp)$/i.test(src)) return src;
    const poster = title.match(/poster=(\S+)/)?.[1];
    if (poster) return poster;
  }
}

export function loadBlog(blogDir) {
  const authors = readYaml(path.join(blogDir, 'authors.yml'));
  const tagDefs = readYaml(path.join(blogDir, 'tags.yml'));
  const slugger = new GithubSlugger();

  const tagFor = (key) => {
    const def = tagDefs[key] || {};
    const permalink = (def.permalink ?? `/${slugger.slug(key)}`).replace(/^\//, '');
    return {key, label: def.label ?? key, permalink, description: def.description, route: `/blog/tags/${permalink}`};
  };

  const posts = fs
    .readdirSync(blogDir)
    .filter((f) => MD.test(f))
    .map((name) => {
      const abs = path.join(blogDir, name);
      const {data: fm, content} = readMatter(abs);
      const m = name.match(/^(\d{4}-\d{2}-\d{2})-?(.*)\.mdx?$/);
      const date = fm.date ? new Date(fm.date) : m ? new Date(`${m[1]}T00:00:00Z`) : fs.statSync(abs).mtime;
      const slug = String(fm.slug ?? (m ? m[2] : name.replace(MD, ''))).replace(/^\/+/, '');
      const authorKeys = [].concat(fm.authors ?? []);
      return {
        kind: 'post',
        file: abs,
        relFile: name,
        route: `/blog/${slug}`,
        frontMatter: fm,
        body: content,
        title: fm.title ?? content.match(/^#\s+(.+)$/m)?.[1] ?? slug,
        description: fm.description,
        // pager thumbnail: front matter `image`, else the post's first photo or video poster
        image: fm.image ?? firstPhoto(content),
        date,
        authors: authorKeys.map((k) => (typeof k === 'string' ? {key: k, ...(authors[k] || {name: k})} : k)),
        tags: [].concat(fm.tags ?? []).map(tagFor),
      };
    })
    .filter((p) => !p.frontMatter.draft)
    .sort((a, b) => b.date - a.date);

  posts.forEach((p, i) => {
    p.newer = posts[i - 1] || null;
    p.older = posts[i + 1] || null;
  });

  const tags = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      if (!tags.has(t.key)) tags.set(t.key, {...t, posts: []});
      tags.get(t.key).posts.push(p);
    }
  }

  return {posts, tags: [...tags.values()].sort((a, b) => a.label.localeCompare(b.label)), authors};
}
