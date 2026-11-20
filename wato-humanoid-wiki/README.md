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

Text, **bold**, [links to other pages](./whole-body.md), images and videos:

![The hand from the palm side](/img/humanoid/hand-palm.png)

![](/img/humanoid/tendon-hand/pinch.mp4 "poster=/img/humanoid/tendon-hand/pinch.png")

:::gallery
![Leg render](/img/humanoid/leg-render-light.jpg)
![Leg prototype](/img/humanoid/leg-prototype-1.jpg)
:::
```

- `docs/foo/index.md` is the page for the `foo` section (`/foo`). Other files in the folder are its sub-pages (`/foo/bar`).
- `docs/foo/_category_.json` sets the section's sidebar label and position.
- Images and videos go in `static/img/...` and are referenced as `/img/...` (no `/humanoid-docs/` prefix needed).

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
| Video | `![what it shows](/img/humanoid/videos/clip.mp4)` — just image syntax with a video file |
| Video options | `![](/img/clip.mp4 "poster=/img/clip.png")`, `"autoplay"` (muted loop, like a GIF), `"video"` for links without a `.mp4` ending |
| Image size | `![alt](/img/photo.jpg "width=500")` or `"width=60%"` |
| Image/video grid | `:::gallery` … `:::` with one image per line; `:::gallery 2` for two columns, `:::gallery 1fr 2fr` for custom widths |
| Raw HTML | still allowed when you really need it, e.g. `<a class="button button--primary">` |
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
static/img/ascii/           full-page ASCII art background (site.config.js sceneBackground; made with scripts/ascii-art.py)
theme/js/ascii-rocket.js    colour ASCII rocket background, used by pages with `ascii: rocket` in their front matter
scripts/           the build: content discovery, Markdown pipeline, feeds, dev server
```

`scripts/lib/build.js` reads the content (`content.js`), renders each file through the Markdown pipeline (`markdown.js`: MDX + remark-gfm + KaTeX + Shiki), fills the templates in `theme/layout.js`, and writes `build/` along with the search index, RSS/Atom feeds and sitemap. Broken internal links are printed as warnings.

To restyle the site, edit `theme/`. Content files never need to change.
