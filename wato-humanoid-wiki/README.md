# WATonomous Humanoid docs site

The docs and blog are Markdown files. A small static-site generator in this folder turns them into the site at https://watonomous.github.io/humanoid-docs/. It's our own code, so the look can be changed freely.

```bash
npm install
npm start          # dev server at http://localhost:3000/humanoid-docs/, rebuilds + reloads on save
npm run build      # production build into build/
npm run serve      # preview build/
```

## Writing a page

**Docs**: add a `.md` file under `docs/`. The folder decides the URL and the sidebar section.

```md
---
title: Tendon Hand                 # browser tab + sidebar label
description: One line for search engines and link previews.
sidebar_position: 2                # optional, orders the sidebar
sidebar_label: Hand                # optional, overrides the sidebar label
---

# Tendon Hand

Text, **bold**, [links to other pages](./whole-body.md), images:

![alt text](/img/humanoid/hand-palm.png)
```

- `docs/foo/index.md` is the page for the `foo` section (`/foo`). Other files in the folder are its sub-pages (`/foo/bar`).
- `docs/foo/_category_.json` sets the section's sidebar label and position.
- Images and videos go in `static/img/...` and are referenced as `/img/...`.

**Blog posts**: add `blog/YYYY-MM-DD-some-name.md`:

```md
---
slug: some-name
title: "Post title"
authors: [wilson]       # keys from blog/authors.yml
tags: [software, rl]    # keys from blog/tags.yml
---

The first paragraph shows on the blog index…

{/* truncate */}

…and the rest only on the post's own page.
```

### What Markdown supports

| Feature | Syntax |
| --- | --- |
| Tables, task lists, footnotes, strikethrough | GitHub-flavoured Markdown |
| Math (KaTeX) | `$inline$` and `$$ display $$` |
| Diagrams | a ` ```mermaid ` code block |
| Code highlighting | ` ```python `, ` ```cpp `, ` ```bash `… |
| Callouts | `:::note`, `:::tip Optional title`, `:::info`, `:::warning`, `:::danger`, closed with `:::` |
| Raw HTML / video | `<video controls src="/humanoid-docs/img/…mp4" />`, inline styles as `style={{maxWidth: '600px'}}` |
| Components | any component in `components/`, e.g. `<ArmJointNaming />` (no import needed) |

Files are parsed as [MDX](https://mdxjs.com/), so `{`, `}` and `<` in plain text need escaping (`\{`, `&lt;`), and comments are written `{/* like this */}`.

## How the site is built

```
site.config.js     title, base URL, navbar and footer links
docs/  blog/       content (Markdown)
static/            images, videos and other files, copied as-is
components/        components usable from Markdown (+ their CSS)
theme/layout.js    HTML templates for every page type
theme/css/         stylesheets (00-tokens.css has the colours and fonts)
theme/js/site.js   browser JS: dark mode, search, TOC highlight, copy buttons, image zoom, Mermaid
scripts/           the build: content discovery, Markdown pipeline, feeds, dev server
```

`scripts/lib/build.js` reads the content (`content.js`), renders each file through the Markdown pipeline (`markdown.js`: MDX + remark-gfm + KaTeX + Shiki), fills the templates in `theme/layout.js`, and writes `build/` along with the search index, RSS/Atom feeds and sitemap. Broken internal links are printed as warnings.

To restyle the site, edit `theme/`. Content files never need to change.
