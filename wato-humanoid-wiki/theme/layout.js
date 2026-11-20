// Page templates. Plain functions returning HTML strings, so the whole look of the
// site lives in this file + theme/css + theme/js. Change anything you like.

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

const isExternal = (href) => /^(https?:|mailto:)/.test(href);

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const icon = {
  external: `<svg class="icon-external" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"/></svg>`,
  chevron: `<svg class="chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>`,
  menu: `<svg viewBox="0 0 30 30" width="26" height="26" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M4 7h22M4 15h22M4 23h22"/></svg>`,
  crumb: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  search: `<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m14.4 14.4 4.1 4.1M16.5 8.8a7.7 7.7 0 1 1-15.4 0 7.7 7.7 0 0 1 15.4 0Z"/></svg>`,
  sun: `<svg class="i-light" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
  moon: `<svg class="i-dark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M9.37 5.51c-.18.64-.27 1.31-.27 1.99 0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`,
  system: `<svg class="i-system" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="m12 21c4.971 0 9-4.029 9-9s-4.029-9-9-9-9 4.029-9 9 4.029 9 9 9zm4.95-13.95c1.313 1.313 2.05 3.093 2.05 4.95s-0.738 3.637-2.05 4.95c-1.313 1.313-3.093 2.05-4.95 2.05v-14c1.857 0 3.637 0.737 4.95 2.05z"/></svg>`,
};

// ---------------------------------------------------------------------------
// Shell: <head>, navbar, footer
// ---------------------------------------------------------------------------

function navLink(ctx, item, extraClass = '') {
  const href = item.href ?? ctx.url(item.to);
  const ext = isExternal(href);
  return `<a class="nav-link ${extraClass}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(item.label)}${ext ? icon.external : ''}</a>`;
}

function navbar(ctx, section) {
  const {navbar: nav} = ctx.config;
  return `
<header class="navbar">
  <div class="navbar-inner">
    <button class="navbar-toggle" type="button" aria-label="Open navigation" data-drawer-open>${icon.menu}</button>
    <a class="brand" href="${ctx.url('/')}"><span class="brand-text">${esc(nav.title)}</span></a>
    <nav class="nav-left">${nav.left.map((i) => navLink(ctx, i, i.activeFor === section ? 'active' : '')).join('')}</nav>
    <div class="nav-spacer"></div>
    <nav class="nav-right">${nav.right.map((i) => navLink(ctx, i)).join('')}</nav>
    <button class="search-button" type="button" data-search-open aria-label="Search">${icon.search}<span>Search</span><kbd>/</kbd></button>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour mode" title="Switch colour mode">${icon.sun}${icon.moon}</button>
  </div>
</header>`;
}

function footer(ctx) {
  const {footer: f} = ctx.config;
  return `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-cols">
      ${f.columns
        .map(
          (col) => `<div class="footer-col"><div class="footer-title">${esc(col.title)}</div><ul>${col.items
            .map((i) => `<li>${navLink(ctx, i, 'footer-link')}</li>`)
            .join('')}</ul></div>`,
        )
        .join('')}
    </div>
    <div class="footer-copy">${esc(f.copyright)}</div>
  </div>
</footer>`;
}

// Light by default; dark only if the visitor picked it (saved in localStorage).
const themeScript = `(function(){try{var d=localStorage.getItem('theme')==='dark';document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(_){}})();`;

export function page(ctx, {route, title, description, section, body, ogType = 'website', extraHead = '', needs = {}}) {
  const c = ctx.config;
  // Background: the site's ASCII art (site.config.js sceneBackground), or a page's own scene
  // chosen in its front matter (`ascii: rocket`).
  const rocketBg = needs.ascii === 'rocket';
  const sceneBg = !!c.sceneBackground && !rocketBg;
  const fullTitle = title && title !== c.title ? `${title} | ${c.title}` : c.title;
  const desc = description || c.description;
  const canonical = ctx.absUrl(route);
  const image = ctx.absUrl('/' + c.socialImage, {file: true});
  return `<!doctype html>
<html lang="en" data-theme="light" data-base="${c.baseUrl}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(c.keywords)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:locale" content="en">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="google-site-verification" content="${esc(c.googleSiteVerification)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="${ctx.asset(c.favicon)}">
<link rel="alternate" type="application/rss+xml" href="${ctx.asset('blog/rss.xml')}" title="${esc(c.title)} RSS Feed">
<link rel="alternate" type="application/atom+xml" href="${ctx.asset('blog/atom.xml')}" title="${esc(c.title)} Atom Feed">
<link rel="stylesheet" href="${ctx.asset(ctx.assets.css)}">
${needs.math ? `<link rel="stylesheet" href="${ctx.asset('assets/katex/katex.min.css')}">` : ''}
<script>${themeScript}</script>
<script type="application/ld+json">${JSON.stringify(c.jsonLd).replace(/</g, '\\u003c')}</script>
${extraHead}
<script defer src="${ctx.asset(ctx.assets.js)}" data-base="${c.baseUrl}" data-mermaid="${ctx.asset(ctx.assets.mermaid)}"></script>
${ctx.dev ? `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>` : ''}
</head>
<body class="section-${section || 'page'}${rocketBg ? ' has-pioneer-bg' : ''}${sceneBg ? ' has-scene-bg' : ''}">
<a class="skip-link" href="#main">Skip to content</a>
${navbar(ctx, section)}
${rocketBg ? `<canvas class="pioneer-bg rocket-bg" data-ascii-rocket aria-hidden="true"></canvas><script defer src="${ctx.asset(ctx.assets.rocket)}"></script>` : ''}${sceneBg ? `<div class="scene-bg" aria-hidden="true" style="background-image:url('${ctx.asset(c.sceneBackground)}')"></div>` : ''}
<div class="drawer-backdrop" data-drawer-close></div>
${body}
${footer(ctx)}
${sceneBg ? '<div class="scene-reveal" aria-hidden="true"></div>' : ''}
<div class="search-modal" data-search-modal hidden>
  <div class="search-backdrop" data-search-close></div>
  <div class="search-panel" role="dialog" aria-label="Search">
    <div class="search-input-row">${icon.search}<input type="search" placeholder="Search docs and blog…" autocomplete="off" spellcheck="false" data-search-input><kbd>esc</kbd></div>
    <ul class="search-results" data-search-results></ul>
  </div>
</div>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------

function sidebarItems(ctx, items, route, depth = 0) {
  return `<ul class="menu-list${depth ? ' menu-sub' : ''}">${items
    .map((item) => {
      if (item.type === 'doc') {
        const active = item.doc.route === route;
        return `<li><a class="menu-link${active ? ' active' : ''}" href="${ctx.url(item.doc.route)}"${active ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`;
      }
      const linkRoute = item.link?.doc?.route ?? item.link?.generated?.route;
      const selfActive = linkRoute === route;
      if (!item.items.length) {
        return `<li><a class="menu-link${selfActive ? ' active' : ''}" href="${ctx.url(linkRoute)}">${esc(item.label)}</a></li>`;
      }
      const containsActive = selfActive || containsRoute(item, route);
      const open = containsActive || item.collapsed === false;
      const label = linkRoute
        ? `<a class="menu-link menu-cat-link${selfActive ? ' active' : ''}" href="${ctx.url(linkRoute)}">${esc(item.label)}</a>`
        : `<span class="menu-link menu-cat-link">${esc(item.label)}</span>`;
      return `<li><details class="menu-cat${containsActive ? ' has-active' : ''}"${open ? ' open' : ''}><summary>${label}<span class="menu-caret" aria-label="Toggle category">${icon.chevron}</span></summary>${sidebarItems(ctx, item.items, route, depth + 1)}</details></li>`;
    })
    .join('')}</ul>`;
}

function containsRoute(category, route) {
  return category.items.some((i) =>
    i.type === 'doc' ? i.doc.route === route : (i.link?.doc?.route ?? i.link?.generated?.route) === route || containsRoute(i, route),
  );
}

function sidebar(ctx, items, route) {
  return `<aside class="sidebar" data-drawer><div class="drawer-head"><span class="brand-text">Docs</span><button type="button" class="drawer-close" data-drawer-close aria-label="Close navigation">${icon.close}</button></div><nav class="menu" aria-label="Docs">${sidebarItems(ctx, items, route)}</nav><div class="drawer-extra">${ctx.config.navbar.left.concat(ctx.config.navbar.right).map((i) => navLink(ctx, i, 'menu-link')).join('')}</div></aside>`;
}

// Right-hand column: the page's headings, then an "Edit this page" link to its file on GitHub.
function tocHtml(toc, {mobile = false, edit = ''} = {}) {
  const list = toc?.length
    ? `<ul class="toc-list">${toc.map((t) => `<li class="toc-d${t.depth}"><a href="#${esc(t.id)}">${t.html}</a></li>`).join('')}</ul>`
    : '';
  if (mobile) return list ? `<details class="toc-mobile"><summary>On this page</summary>${list}</details>` : '';
  if (!list && !edit) return '';
  return `<aside class="toc" aria-label="On this page"><div class="toc-inner">${list}${edit ? `<div class="toc-edit">${edit}</div>` : ''}</div></aside>`;
}

function breadcrumbs(ctx, page) {
  const crumbs = (page.parents || []).map((cat) => {
    const r = cat.link?.doc?.route ?? cat.link?.generated?.route;
    return r ? `<a href="${ctx.url(r)}">${esc(cat.label)}</a>` : `<span>${esc(cat.label)}</span>`;
  });
  const label = page.category?.label ?? page.sidebarLabel ?? page.title;
  return `<nav class="breadcrumbs" aria-label="Breadcrumbs"><a class="crumb-home" href="${ctx.url('/')}" aria-label="Home">${icon.home}</a>${crumbs
    .map((c) => `<span class="crumb-sep">${icon.crumb}</span>${c}`)
    .join('')}<span class="crumb-sep">${icon.crumb}</span><span class="crumb-current">${esc(label)}</span></nav>`;
}

function pager(ctx, prev, next, {prevLabel = 'Previous', nextLabel = 'Next'} = {}) {
  if (!prev && !next) return '';
  const card = (p, label, cls) =>
    p
      ? `<a class="pager-link ${cls}" href="${ctx.url(p.route)}"><span class="pager-sub">${label}</span><span class="pager-title">${esc(p.sidebarLabel ?? p.title)}</span></a>`
      : '<span></span>';
  return `<nav class="pager" aria-label="Pages">${card(prev, `← ${prevLabel}`, 'prev')}${card(next, `${nextLabel} →`, 'next')}</nav>`;
}

function editLink(ctx, relPath) {
  if (!ctx.config.editUrl || !relPath) return '';
  return `<a class="edit-link" href="${esc(ctx.config.editUrl + relPath)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 40 40" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"/></svg>Edit this page</a>`;
}

export function docPage(ctx, {doc, sidebar: sidebarTree, rendered}) {
  const showTitle = !rendered.h1;
  const body = `
<div class="layout layout-docs">
  ${sidebar(ctx, sidebarTree, doc.route)}
  <main class="main" id="main">
    <div class="doc-row">
      <article class="doc">
        ${breadcrumbs(ctx, doc)}
        ${tocHtml(rendered.toc, {mobile: true})}
        <div class="markdown">
          ${showTitle ? `<h1>${esc(doc.title)}</h1>` : ''}
          ${rendered.html}
        </div>
        <footer class="doc-footer">${editLink(ctx, 'docs/' + doc.relFile)}</footer>
        ${pager(ctx, doc.prev, doc.next)}
      </article>
      ${tocHtml(rendered.toc, {edit: editLink(ctx, 'docs/' + doc.relFile)})}
    </div>
  </main>
</div>`;
  return page(ctx, {
    route: doc.route,
    title: doc.title,
    description: doc.description || rendered.firstParagraph,
    section: 'docs',
    body,
    needs: {...rendered.needs, ascii: doc.frontMatter.ascii},
  });
}

export function generatedIndexPage(ctx, {gen, sidebar: sidebarTree}) {
  const cards = gen.category.items
    .map((item) => {
      const target = item.type === 'doc' ? item.doc : item.link?.doc ?? item.link?.generated;
      if (!target) return '';
      const desc = target.description ?? (item.type === 'category' ? `${item.items.length || 1} item${item.items.length === 1 ? '' : 's'}` : '');
      return `<a class="card" href="${ctx.url(target.route)}"><span class="card-title">${item.type === 'category' && item.items.length ? '🗃️' : '📄'} ${esc(item.label)}</span>${desc ? `<span class="card-desc">${esc(desc)}</span>` : ''}</a>`;
    })
    .join('');
  const body = `
<div class="layout layout-docs">
  ${sidebar(ctx, sidebarTree, gen.route)}
  <main class="main" id="main">
    <div class="doc-row">
      <article class="doc">
        ${breadcrumbs(ctx, {...gen, sidebarLabel: gen.title})}
        <div class="markdown">
          <h1>${esc(gen.title)}</h1>
          ${gen.description ? `<p>${esc(gen.description)}</p>` : ''}
          <div class="card-grid">${cards}</div>
        </div>
        ${pager(ctx, gen.prev, gen.next)}
      </article>
    </div>
  </main>
</div>`;
  return page(ctx, {route: gen.route, title: gen.title, description: gen.description, section: 'docs', body});
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

const fmtDate = (d) => d.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});

function blogSidebar(ctx, posts, route) {
  const byYear = new Map();
  for (const p of posts) {
    const y = p.date.getUTCFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(p);
  }
  const groups = [...byYear]
    .map(
      ([y, ps]) =>
        `<div class="blog-side-year">${y}</div><ul>${ps
          .map((p) => `<li><a class="${p.route === route ? 'active' : ''}" href="${ctx.url(p.route)}">${esc(p.title)}</a></li>`)
          .join('')}</ul>`,
    )
    .join('');
  return `<aside class="blog-sidebar" data-drawer><div class="drawer-head"><span class="brand-text">Recent posts</span><button type="button" class="drawer-close" data-drawer-close aria-label="Close navigation">${icon.close}</button></div><nav aria-label="Recent posts"><div class="blog-side-title">Recent posts</div>${groups}</nav><div class="drawer-extra">${ctx.config.navbar.left.concat(ctx.config.navbar.right).map((i) => navLink(ctx, i, 'menu-link')).join('')}</div></aside>`;
}

function postMeta(post) {
  return `<div class="post-meta"><time datetime="${post.date.toISOString()}">${fmtDate(post.date)}</time> · ${post.readingTime} min read</div>${
    post.authors.length
      ? `<div class="post-authors">${post.authors
          .map((a) => {
            const name = esc(a.name);
            const inner = a.image_url ? `<img src="${esc(a.image_url)}" alt="" class="avatar">${name}` : name;
            return `<span class="post-author">${a.url ? `<a href="${esc(a.url)}">${inner}</a>` : inner}${a.title ? `<small>${esc(a.title)}</small>` : ''}</span>`;
          })
          .join('')}</div>`
      : ''
  }`;
}

function tagList(ctx, tags) {
  if (!tags.length) return '';
  return `<div class="post-tags"><b>Tags:</b>${tags.map((t) => `<a class="tag" href="${ctx.url(t.route)}">${esc(t.label)}</a>`).join('')}</div>`;
}

function blogShell(ctx, {posts, route, main, toc, edit}) {
  return `
<div class="layout layout-blog">
  ${blogSidebar(ctx, posts, route)}
  <main class="main" id="main">
    <div class="doc-row">
      <div class="blog-main">${main}</div>
      ${toc || edit ? tocHtml(toc, {edit}) : ''}
    </div>
  </main>
</div>`;
}

function postCard(ctx, post) {
  return `<article class="post-card">
  <h2 class="post-card-title"><a href="${ctx.url(post.route)}">${esc(post.title)}</a></h2>
  ${postMeta(post)}
  <div class="markdown">${post.excerptHtml}</div>
  <footer class="post-card-foot">${tagList(ctx, post.tags)}${post.truncated ? `<a class="read-more" href="${ctx.url(post.route)}" aria-label="Read more about ${esc(post.title)}">Read more</a>` : ''}</footer>
</article>`;
}

export function blogListPage(ctx, {posts, route = '/blog', title, description, heading}) {
  const allPosts = ctx.blog.posts;
  const main = `${heading || ''}<div class="post-list">${posts.map((p) => postCard(ctx, p)).join('')}</div>`;
  return page(ctx, {
    route,
    title: title ?? ctx.config.blog.title,
    description: description ?? ctx.config.blog.description,
    section: 'blog',
    body: blogShell(ctx, {posts: allPosts, route, main}),
    needs: {math: posts.some((p) => p.needs.math)},
  });
}

export function blogPostPage(ctx, {post}) {
  const main = `<article class="post">
  <header>
    <h1 class="post-title">${esc(post.title)}</h1>
    ${postMeta(post)}
  </header>
  ${tocHtml(post.rendered.toc, {mobile: true})}
  <div class="markdown">${post.rendered.html}</div>
  <footer class="post-foot">${tagList(ctx, post.tags)}${editLink(ctx, 'blog/' + post.relFile)}</footer>
  ${pager(ctx, post.newer, post.older, {prevLabel: 'Newer post', nextLabel: 'Older post'})}
</article>`;
  return page(ctx, {
    route: post.route,
    title: post.title,
    description: post.description,
    section: 'blog',
    ogType: 'article',
    extraHead: `<meta property="article:published_time" content="${post.date.toISOString()}">${post.tags
      .map((t) => `<meta property="article:tag" content="${esc(t.label)}">`)
      .join('')}`,
    body: blogShell(ctx, {posts: ctx.blog.posts, route: post.route, main, toc: post.rendered.toc, edit: editLink(ctx, 'blog/' + post.relFile)}),
    needs: {...post.needs, ascii: post.frontMatter.ascii},
  });
}

export function tagsIndexPage(ctx, {tags}) {
  const groups = new Map();
  for (const t of tags) {
    const letter = t.label[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(t);
  }
  const main = `<div class="markdown"><h1>Tags</h1>${[...groups]
    .map(
      ([letter, ts]) =>
        `<section class="tag-group"><h2 id="${esc(letter)}">${esc(letter)}</h2><div class="tag-row">${ts
          .map((t) => `<a class="tag" href="${ctx.url(t.route)}">${esc(t.label)}<span class="tag-count">${t.posts.length}</span></a>`)
          .join('')}</div></section>`,
    )
    .join('')}</div>`;
  return page(ctx, {route: '/blog/tags', title: 'Tags', section: 'blog', body: blogShell(ctx, {posts: ctx.blog.posts, route: '/blog/tags', main})});
}

export function tagPage(ctx, {tag}) {
  const n = tag.posts.length;
  const heading = `<header class="list-header"><h1>${n} post${n === 1 ? '' : 's'} tagged with “${esc(tag.label)}”</h1>${
    tag.description ? `<p>${esc(tag.description)}</p>` : ''
  }<a href="${ctx.url('/blog/tags')}">View all tags</a></header>`;
  return blogListPage(ctx, {
    posts: tag.posts,
    route: tag.route,
    title: `${n} post${n === 1 ? '' : 's'} tagged with "${tag.label}"`,
    description: tag.description,
    heading,
  });
}

export function archivePage(ctx, {posts}) {
  const byYear = new Map();
  for (const p of posts) {
    const y = p.date.getUTCFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(p);
  }
  const main = `<div class="markdown"><h1>Archive</h1>${[...byYear]
    .map(
      ([y, ps]) =>
        `<h2 id="${y}">${y}</h2><ul class="archive-list">${ps
          .map((p) => `<li><time>${fmtDate(p.date)}</time> <a href="${ctx.url(p.route)}">${esc(p.title)}</a></li>`)
          .join('')}</ul>`,
    )
    .join('')}</div>`;
  return page(ctx, {route: '/blog/archive', title: 'Archive', section: 'blog', body: blogShell(ctx, {posts, route: '/blog/archive', main})});
}

export function authorsPage(ctx, {authors, posts}) {
  const counts = new Map();
  for (const p of posts) for (const a of p.authors) counts.set(a.key, (counts.get(a.key) || 0) + 1);
  const main = `<div class="markdown"><h1>Authors</h1><ul class="author-list">${Object.entries(authors)
    .map(([key, a]) => `<li><b>${esc(a.name)}</b>${a.title ? ` · ${esc(a.title)}` : ''} <span class="muted">(${counts.get(key) || 0} posts)</span></li>`)
    .join('')}</ul></div>`;
  return page(ctx, {route: '/blog/authors', title: 'Authors', section: 'blog', body: blogShell(ctx, {posts, route: '/blog/authors', main})});
}

// ---------------------------------------------------------------------------

export function notFoundPage(ctx) {
  const body = `<main class="main not-found" id="main"><h1>Page Not Found</h1><p>We could not find what you were looking for. Try the <a href="${ctx.url('/')}">docs home</a>, the <a href="${ctx.url('/blog')}">blog</a>, or <button type="button" class="link-button" data-search-open>search</button>.</p></main>`;
  return page(ctx, {route: '/404', title: 'Page Not Found', section: 'page', body});
}
