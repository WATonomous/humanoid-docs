// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'WATonomous Humanoid',
  tagline: 'Documentation for the WATonomous Humanoid robot project at the University of Waterloo',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://watonomous.github.io',
  baseUrl: '/humanoid-docs/',

  organizationName: 'WATonomous',
  projectName: 'humanoid-docs',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/WATonomous/humanoid-docs/tree/main/wato-humanoid-wiki/',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/WATonomous/humanoid-docs/tree/main/wato-humanoid-wiki/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
      crossorigin: 'anonymous',
    },
  ],

  headTags: [
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'WATonomous Humanoid',
        url: 'https://watonomous.github.io/humanoid-docs/',
        description:
          'Documentation for the WATonomous Humanoid robot project at the University of Waterloo.',
        publisher: {
          '@type': 'Organization',
          name: 'WATonomous',
          url: 'https://www.watonomous.ca/',
        },
      }),
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/humanoid/humanoid-hero.png',
      metadata: [
        {
          name: 'keywords',
          content:
            'WATonomous, humanoid robot, University of Waterloo, robotics, mechanical design, electrical, firmware, CAN bus, software, machine learning, reinforcement learning',
        },
        {property: 'og:type', content: 'website'},
      ],
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'WATonomous Humanoid',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://www.watonomous.ca/',
            label: 'WATonomous',
            position: 'right',
          },
          {
            href: 'https://github.com/WATonomous/humanoid',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Mechanical', to: '/mechanical'},
              {label: 'Electrical', to: '/electrical'},
              {label: 'Interfacing', to: '/interfacing'},
              {label: 'Software & ML', to: '/software'},
            ],
          },
          {
            title: 'Project',
            items: [
              {
                label: 'Humanoid Repository',
                href: 'https://github.com/WATonomous/humanoid',
              },
              {
                label: 'WATonomous Website',
                href: 'https://www.watonomous.ca/',
              },
              {
                label: 'WATonomous GitHub',
                href: 'https://github.com/WATonomous',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {label: 'Blog', to: '/blog'},
              {
                label: 'Contact',
                href: 'mailto:hycheng@uwaterloo.ca',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} WATonomous, University of Waterloo.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['cpp', 'bash'],
      },
    }),
};

export default config;
