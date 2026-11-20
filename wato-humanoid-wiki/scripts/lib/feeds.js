// RSS 2.0 and Atom feeds for the blog (full post content, absolute URLs).

const x = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'})[c]);
const cdata = (s = '') => `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export function feeds({config, posts, url}) {
  const site = config.url;
  const abs = (html) => html.replace(/(\s(?:src|href|poster)=")\/(?!\/)/g, `$1${site}/`);
  const blogUrl = site + url('/blog');
  const updated = posts[0]?.date ?? new Date();
  const title = config.blog.feedTitle;

  const rss = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${x(title)}</title>
    <link>${blogUrl}</link>
    <description>${x(title)}</description>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
    <language>en</language>
${posts
  .map(
    (p) => `    <item>
      <title>${cdata(p.title)}</title>
      <link>${site + url(p.route)}</link>
      <guid>${site + url(p.route)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${cdata(p.description)}</description>
      <content:encoded>${cdata(abs(p.rendered.html))}</content:encoded>
${p.authors.map((a) => `      <dc:creator>${x(a.name)}</dc:creator>`).join('\n')}
${p.tags.map((t) => `      <category>${x(t.label)}</category>`).join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${blogUrl}</id>
  <title>${x(title)}</title>
  <updated>${updated.toISOString()}</updated>
  <link rel="alternate" href="${blogUrl}"/>
  <subtitle>${x(title)}</subtitle>
${posts
  .map(
    (p) => `  <entry>
    <title type="html">${cdata(p.title)}</title>
    <id>${site + url(p.route)}</id>
    <link href="${site + url(p.route)}"/>
    <updated>${p.date.toISOString()}</updated>
    <summary type="html">${cdata(p.description)}</summary>
    <content type="html">${cdata(abs(p.rendered.html))}</content>
${p.authors.map((a) => `    <author><name>${x(a.name)}</name></author>`).join('\n')}
${p.tags.map((t) => `    <category label="${x(t.label)}" term="${x(t.label)}"/>`).join('\n')}
  </entry>`,
  )
  .join('\n')}
</feed>
`;
  return {rss, atom};
}
