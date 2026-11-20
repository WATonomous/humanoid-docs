// Client-side behaviour. Plain JS, no framework, no build step.
(() => {
  const script = document.currentScript;
  const BASE = script.dataset.base;
  const MERMAID_URL = script.dataset.mermaid;
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // ---- Colour mode: light (default) <-> dark ------------------------------------
  $$('[data-theme-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
      } catch {}
      root.setAttribute('data-theme', next);
      document.dispatchEvent(new CustomEvent('themechange'));
    }),
  );

  // ---- ASCII art past the footer: fades in as it scrolls into view ----------------------
  const art = $('.footer-art');
  if (art) {
    const img = $('.footer-art-img', art);
    const update = () => {
      const top = art.getBoundingClientRect().top;
      const k = Math.min(1, Math.max(0, (innerHeight - top) / (innerHeight * 0.7)));
      art.style.setProperty('--k', k.toFixed(3));
    };
    addEventListener('scroll', () => requestAnimationFrame(update), {passive: true});
    addEventListener('resize', update);
    update();
  }

  // ---- Mobile drawer ------------------------------------------------------
  const setDrawer = (open) => document.body.classList.toggle('drawer-open', open);
  $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => setDrawer(true)));
  $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => setDrawer(false)));

  // Sidebar: the caret toggles a category; the label link navigates.
  $$('.menu-cat > summary').forEach((summary) =>
    summary.addEventListener('click', (e) => {
      if (e.target.closest('a')) e.preventDefault(), (location.href = e.target.closest('a').href);
    }),
  );
  // Bring the current page's sidebar link into view by scrolling the sidebar only, never the page.
  const activeLink = $('.sidebar .menu-link.active');
  const sidebarEl = $('.sidebar');
  if (activeLink && sidebarEl && sidebarEl.scrollHeight > sidebarEl.clientHeight) {
    sidebarEl.scrollTop = activeLink.offsetTop - sidebarEl.clientHeight / 2;
  }

  // ---- TOC scroll-spy -----------------------------------------------------------
  const tocLinks = $$('.toc .toc-list a');
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const update = () => {
      const y = window.scrollY + parseFloat(getComputedStyle(root).scrollPaddingTop || 0) + 10;
      let current = targets[0];
      for (const t of targets) if (t.offsetTop <= y) current = t;
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = targets[targets.length - 1];
      tocLinks.forEach((a) => a.classList.toggle('active', a.hash === `#${current?.id}` || decodeURIComponent(a.hash.slice(1)) === current?.id));
    };
    addEventListener('scroll', () => requestAnimationFrame(update), {passive: true});
    update();
  }

  // ---- Code blocks: copy button + language label -----------------------------------
  $$('.markdown pre.shiki').forEach((pre) => {
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.replaceWith(wrap);
    wrap.append(pre);
    const lang = pre.querySelector('code')?.className.match(/language-(\S+)/)?.[1];
    if (lang && lang !== 'text') {
      const tag = document.createElement('span');
      tag.className = 'code-lang';
      tag.textContent = lang;
      wrap.append(tag);
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = 'copy';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ''));
        btn.textContent = 'copied ✓';
      } catch {
        btn.textContent = 'failed';
      }
      setTimeout(() => (btn.textContent = 'copy'), 1500);
    });
    wrap.append(btn);
  });

  // ---- Image lightbox ------------------------------------------------------------
  $$('.markdown img').forEach((img) => {
    if (img.closest('a') || img.closest('.card')) return;
    img.classList.add('zoomable');
    img.addEventListener('click', () => {
      const box = document.createElement('div');
      box.className = 'lightbox';
      const big = document.createElement('img');
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      box.append(big);
      const close = () => {
        box.remove();
        removeEventListener('keydown', onKey);
      };
      const onKey = (e) => e.key === 'Escape' && close();
      box.addEventListener('click', close);
      addEventListener('keydown', onKey);
      document.body.append(box);
    });
  });

  // ---- Mermaid (loaded only on pages that have diagrams) -------------------------------
  const diagrams = $$('pre.mermaid');
  if (diagrams.length) {
    diagrams.forEach((el) => (el.dataset.source = el.textContent));
    let mermaid;
    const render = async () => {
      mermaid ??= (await import(MERMAID_URL)).default;
      const dark = root.getAttribute('data-theme') === 'dark';
      mermaid.initialize({startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict', flowchart: {useMaxWidth: false}});
      diagrams.forEach((el) => {
        el.removeAttribute('data-processed');
        el.textContent = el.dataset.source;
      });
      await mermaid.run({nodes: diagrams});
    };
    render().catch((err) => console.error('mermaid', err));
    document.addEventListener('themechange', () => render().catch(() => {}));
  }

  // ---- Search ----------------------------------------------------------------------
  const modal = $('[data-search-modal]');
  const input = $('[data-search-input]');
  const results = $('[data-search-results]');
  let index = null;
  let selected = 0;

  async function loadIndex() {
    if (!index) {
      const res = await fetch(`${BASE}search-index.json`);
      index = (await res.json()).map((e) => ({...e, lp: e.p.toLowerCase(), lh: e.h.toLowerCase(), lx: e.x.toLowerCase()}));
    }
    return index;
  }
  function openSearch() {
    modal.hidden = false;
    input.focus();
    input.select();
    loadIndex().then(() => input.value && search());
  }
  function closeSearch() {
    modal.hidden = true;
  }
  const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const highlight = (text, terms) => {
    let html = escHtml(text);
    for (const t of terms) html = html.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
    return html;
  };
  function snippet(text, terms) {
    const lower = text.toLowerCase();
    const i = Math.max(0, Math.min(...terms.map((t) => lower.indexOf(t)).filter((n) => n >= 0)));
    const start = Math.max(0, i - 40);
    return (start > 0 ? '…' : '') + text.slice(start, start + 180);
  }
  function search() {
    const q = input.value.trim().toLowerCase();
    if (!q || !index) {
      results.innerHTML = '';
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const e of index) {
      let score = 0;
      for (const t of terms) {
        const s = (e.lp.includes(t) ? 6 : 0) + (e.lh.includes(t) ? 4 : 0) + (e.lx.includes(t) ? 1 : 0);
        if (!s) {
          score = 0;
          break;
        }
        score += s;
      }
      if (score) {
        if (!e.h) score += 1;
        scored.push({e, score});
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 12);
    selected = 0;
    results.innerHTML = top.length
      ? top
          .map(
            ({e}, i) =>
              `<li><a href="${e.u}" class="${i === 0 ? 'selected' : ''}"><span class="sr-path">${e.k} › ${escHtml(e.p)}</span><span class="sr-title">${highlight(e.h || e.p, terms)}</span>${
                e.x ? `<span class="sr-snip">${highlight(snippet(e.x, terms), terms)}</span>` : ''
              }</a></li>`,
          )
          .join('')
      : `<li class="search-empty">No results for “${escHtml(q)}”</li>`;
  }
  function move(delta) {
    const links = $$('a', results);
    if (!links.length) return;
    links[selected]?.classList.remove('selected');
    selected = (selected + delta + links.length) % links.length;
    links[selected].classList.add('selected');
    links[selected].scrollIntoView({block: 'nearest'});
  }
  if (modal) {
    $$('[data-search-open]').forEach((b) => b.addEventListener('click', openSearch));
    $$('[data-search-close]').forEach((b) => b.addEventListener('click', closeSearch));
    input.addEventListener('input', search);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') move(1), e.preventDefault();
      else if (e.key === 'ArrowUp') move(-1), e.preventDefault();
      else if (e.key === 'Enter') $$('a', results)[selected]?.click();
    });
    results.addEventListener('click', (e) => e.target.closest('a') && closeSearch());
    addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape' && !modal.hidden) {
        closeSearch();
      }
    });
  }
})();
