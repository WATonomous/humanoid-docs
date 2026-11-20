// Markdown (MDX) -> HTML. One function, renderMarkdown(), used for docs and blog posts.
//
// Supported in content files:
//   - GitHub-flavoured Markdown (tables, task lists, footnotes, autolinks)
//   - Math: $inline$ and $$display$$ (KaTeX, rendered at build time)
//   - ```mermaid code blocks (rendered in the browser)
//   - Admonitions: :::note / :::tip / :::info / :::warning / :::danger, with an optional title
//   - Inline HTML/JSX, including style={{...}} objects (it's MDX)
//   - Components from components/ (no import needed, e.g. <ArmJointNaming />)

import {compile, run} from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {VFile} from 'vfile';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import {visit, SKIP} from 'unist-util-visit';
import {toHtml} from 'hast-util-to-html';
import {toString} from 'hast-util-to-string';

const ADMONITION_TYPES = ['note', 'tip', 'info', 'warning', 'danger', 'caution', 'important'];

// ---------------------------------------------------------------------------
// Source preprocessing (string level, before MDX parsing)
// ---------------------------------------------------------------------------

// Turn ":::tip Optional title ... :::" into <Admonition> JSX. Done on the raw text so
// it works the same whether the title is written as ":::tip Title" or ":::tip[Title]".
// Fenced code blocks are left alone.
function preprocess(source) {
  const lines = source.split('\n');
  const out = [];
  let fence = null;
  const stack = [];
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      out.push(line);
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }
    const open = line.match(/^(\s*):::(\w+)(?:\[(.*)\]|\s+(.*))?\s*$/);
    if (open && ADMONITION_TYPES.includes(open[2].toLowerCase())) {
      const title = (open[3] ?? open[4] ?? '').trim();
      stack.push(open[1]);
      out.push(`${open[1]}<Admonition type="${open[2].toLowerCase()}"${title ? ` title={${JSON.stringify(title)}}` : ''}>`, '');
      continue;
    }
    if (/^\s*:::\s*$/.test(line) && stack.length) {
      const indent = stack.pop();
      out.push('', `${indent}</Admonition>`);
      continue;
    }
    // Components are global; drop `import X from '@site/...components/X'` lines.
    if (/^import\s+\w+\s+from\s+['"](@site\/)?(src\/)?components\/[\w-]+['"];?\s*$/.test(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

const TRUNCATE = /^\s*(\{\/\*\s*truncate\s*\*\/\}|<!--\s*truncate\s*-->)\s*$/m;

export function splitExcerpt(source) {
  const m = source.match(TRUNCATE);
  if (!m) return {excerpt: null, body: source};
  return {excerpt: source.slice(0, m.index), body: source.replace(TRUNCATE, '')};
}

// ---------------------------------------------------------------------------
// remark / rehype plugins
// ---------------------------------------------------------------------------

// ```mermaid blocks -> <pre class="mermaid"> (rendered client-side).
function remarkMermaid() {
  return (tree, file) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid') return;
      file.data.hasMermaid = true;
      parent.children[index] = {
        type: 'mermaidBlock',
        data: {
          hName: 'pre',
          hProperties: {className: ['mermaid']},
          hChildren: [{type: 'text', value: node.value}],
        },
      };
      return SKIP;
    });
  };
}

// The value of a JSX attribute, if it's a plain string.
function jsxAttr(node, name) {
  return node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
}

// Rewrite links/asset URLs (prefix baseUrl, resolve ./other-doc.md links) and
// collect page metadata (TOC, first paragraph, plain text for search).
function rehypeSite(options) {
  const {resolveUrl} = options;
  return (tree, file) => {
    const fix = (url) => (typeof url === 'string' ? resolveUrl(url, file.path) : url);

    visit(tree, (node) => {
      if (node.type === 'element') {
        const p = node.properties || {};
        if (p.href) p.href = fix(p.href);
        if (p.src) p.src = fix(p.src);
        if (p.poster) p.poster = fix(p.poster);
        if (node.tagName === 'a' && /^https?:/.test(p.href || '')) {
          p.target = '_blank';
          p.rel = 'noopener noreferrer';
        }
        if (node.tagName === 'img') {
          p.loading = 'lazy';
          p.decoding = 'async';
        }
        if (node.tagName === 'table') {
          // Wrap tables so wide ones scroll instead of blowing out the layout.
          node.tagName = 'div';
          const table = {type: 'element', tagName: 'table', properties: p, children: node.children};
          node.properties = {className: ['table-wrap']};
          node.children = [table];
          return SKIP;
        }
      } else if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        for (const name of ['href', 'src', 'poster']) {
          const attr = jsxAttr(node, name);
          if (attr && typeof attr.value === 'string') attr.value = fix(attr.value);
        }
        const cls = jsxAttr(node, 'class');
        if (cls) cls.name = 'className';
        if (node.name === 'img' && !jsxAttr(node, 'loading')) {
          node.attributes.push({type: 'mdxJsxAttribute', name: 'loading', value: 'lazy'});
        }
      }
    });

    // Headings: anchor links + TOC; sections of plain text for search.
    const toc = [];
    const sections = [{id: '', heading: '', text: []}];
    let h1 = null;
    let firstParagraph = null;
    const textOf = (node) => toString(node).replace(/\s+/g, ' ').trim();

    for (const node of tree.children) {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const depth = Number(node.tagName[1]);
        const id = node.properties?.id;
        if (depth === 1 && !h1) h1 = textOf(node);
        if (depth >= 2 && depth <= 3 && id) {
          const children = structuredClone(node.children);
          visit({type: 'root', children}, 'element', (n) => {
            if (n.tagName === 'a') n.tagName = 'span';
          });
          toc.push({depth, id, html: toHtml(children)});
        }
        if (depth >= 2 && id) sections.push({id, heading: textOf(node), text: []});
        if (id && depth > 1) {
          node.properties.className = [...(node.properties.className || []), 'anchor'];
          node.children.push({
            type: 'element',
            tagName: 'a',
            properties: {className: ['hash-link'], href: `#${id}`, ariaLabel: 'Link to this heading'},
            children: [{type: 'text', value: '#'}],
          });
        }
        continue;
      }
      if (!firstParagraph && node.type === 'element' && node.tagName === 'p') {
        const t = textOf(node);
        if (t) firstParagraph = t;
      }
      if (node.type === 'element' && node.tagName === 'pre' && node.properties?.className?.includes('mermaid')) continue;
      const t = textOf(node);
      if (t) sections[sections.length - 1].text.push(t);
    }

    file.data.toc = toc;
    file.data.h1 = h1;
    file.data.firstParagraph = firstParagraph;
    file.data.sections = sections
      .map((s) => ({...s, text: s.text.join(' ')}))
      .filter((s) => s.heading || s.text);
  };
}

// ---------------------------------------------------------------------------

export function createRenderer({components, resolveUrl, codeThemes}) {
  const options = {
    outputFormat: 'function-body',
    format: 'mdx', // treat .md like .mdx (as Docusaurus does)
    development: false,
    remarkPlugins: [remarkGfm, remarkMath, remarkMermaid],
    rehypePlugins: [
      [rehypeKatex, {strict: false}],
      [
        rehypeShiki,
        {
          themes: {light: codeThemes.light, dark: codeThemes.dark},
          defaultColor: false,
          fallbackLanguage: 'text',
          addLanguageClass: true,
        },
      ],
      rehypeSlug,
      [rehypeSite, {resolveUrl}],
    ],
  };

  return async function renderMarkdown(source, path) {
    const file = new VFile({value: preprocess(source), path});
    let code;
    try {
      code = await compile(file, options);
    } catch (err) {
      const where = err.place?.start ? `:${err.place.start.line}:${err.place.start.column}` : err.line ? `:${err.line}` : '';
      throw new Error(`${path}${where}\n  ${err.reason || err.message}`);
    }
    const {default: Content} = await run(String(code), {...jsxRuntime, baseUrl: import.meta.url});
    const html = renderToStaticMarkup(createElement(Content, {components}));
    return {html, ...file.data};
  };
}
