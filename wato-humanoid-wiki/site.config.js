// Site-wide settings. Content lives in docs/ and blog/ as Markdown (MDX);
// the build engine is in scripts/, the look & feel in theme/.

const description =
  "WATonomous Humanoid is the University of Waterloo humanoid robotics team, building UWaterloo's first humanoid robot.";

export default {
  title: 'WATonomous Humanoid Team',
  tagline: "University of Waterloo humanoid robotics team building UWaterloo's first humanoid robot",
  description,
  url: 'https://watonomous.github.io',
  baseUrl: '/humanoid-docs/',
  favicon: 'img/favicon.ico',
  socialImage: 'img/humanoid/humanoid-hero.png',
  editUrl: 'https://github.com/WATonomous/humanoid-docs/tree/main/wato-humanoid-wiki/',

  keywords:
    'Waterloo humanoid team, WATonomous Humanoid, University of Waterloo humanoid robotics team, UWaterloo humanoid robot, WATonomous, humanoid robot, robotics, mechanical design, electrical, firmware, CAN bus, software, machine learning, reinforcement learning',

  googleSiteVerification: 'ug8dh1X6_RGRTeacLz7fq6jFBaTvudsj6YVb1-V_Pgc',

  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WATonomous Humanoid Team',
    alternateName: ['Waterloo Humanoid Team', 'UWaterloo Humanoid Robotics Team'],
    url: 'https://watonomous.github.io/humanoid-docs/',
    description,
    publisher: {
      '@type': 'Organization',
      name: 'WATonomous',
      alternateName: 'WATonomous Humanoid Team',
      url: 'https://www.watonomous.ca/',
    },
  },

  navbar: {
    title: 'WATonomous Humanoid',
    left: [
      {label: 'Docs', to: '/', activeFor: 'docs'},
      {label: 'Blog', to: '/blog', activeFor: 'blog'},
    ],
    right: [
      {label: 'WATonomous', href: 'https://www.watonomous.ca/'},
      {label: 'GitHub', href: 'https://github.com/WATonomous/pioneer_humanoid'},
    ],
  },

  footer: {
    columns: [
      {
        title: 'Docs',
        items: [
          {label: 'Mechanical', to: '/mechanical'},
          {label: 'Electrical', to: '/electrical'},
          {label: 'Firmware', to: '/firmware'},
          {label: 'Software & ML', to: '/software'},
        ],
      },
      {
        title: 'Project',
        items: [
          {label: 'Humanoid Repository', href: 'https://github.com/WATonomous/pioneer_humanoid'},
          {label: 'WATonomous Website', href: 'https://www.watonomous.ca/'},
          {label: 'WATonomous GitHub', href: 'https://github.com/WATonomous'},
        ],
      },
      {
        title: 'More',
        items: [
          {label: 'Blog', to: '/blog'},
          {label: 'Contact', href: 'mailto:hycheng@uwaterloo.ca'},
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} WATonomous, University of Waterloo.`,
  },

  blog: {
    title: 'Blog',
    description: 'Blog',
    feedTitle: 'WATonomous Humanoid Team Blog',
    wordsPerMinute: 200,
  },

  // ASCII Pioneer (theme/js/ascii-pioneer.js): a faint, slowly turning Pioneer behind every page.
  pioneer: {background: true},

  // ASCII art that fades in when you scroll past the footer. Pages with `ascii: rocket` in their
  // front matter get the rocket one. Made with scripts/ascii-art.py. Set to null to turn off.
  footerArt: {
    default: 'img/ascii/pioneer-earthrise.webp',
    rocket: 'img/ascii/pioneer-launch.webp',
    ringfield: 'img/ascii/pioneer-ringfield.webp', // the homepage hero (`hero: ringfield` in docs/intro.md): Pioneer on a ring plane, a painting rather than ASCII
  },

  // behind the footer's links, when it should differ from the art below the footer (same keys)
  footerBackdrop: {rocket: 'img/ascii/pioneer-ringfield.webp'},

  // optional title over an art in its dark sky, per art (same keys as footerArt), shown on the hero too
  footerArtTitle: {ringfield: ['Pioneer', 'Humanoid']},

  code: {
    // Shiki theme names: https://shiki.style/themes
    lightTheme: 'github-light',
    darkTheme: 'dracula',
  },
};
