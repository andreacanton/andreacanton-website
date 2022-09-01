module.exports = (themeConfig, ctx) => {
  return {
    title: 'Andrea Canton',
    description: 'Vegetarian web developer based in Verona area, Italy',
    themeConfig: {
      author: 'Andrea Canton @andreacanton',
      domain: 'https://andreacanton.dev',
    },
    head: [
      [
        'link',
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
      ],
      [
        'link',
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
      ],
      [
        'link',
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
      ],
      ['link', { rel: 'manifest', href: '/site.webmanifest' }],
      [
        'link',
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' },
      ],
      ['meta', { name: 'msapplication-TileColor', content: '#da532c' }],
      ['meta', { name: 'theme-color', content: '#ffffff' }],
      [
        'meta',
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    ],
    plugins: [
      [
        'vuepress-plugin-container',
        {
          type: 'update',
          defaultTitle: 'UPDATE',
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'tip',
          defaultTitle: 'TIP',
        },
      ],
      [
        'sitemap',
        {
          hostname: 'https://andreacanton.dev',
          exclude: ['/404.html'],
        },
      ],
      [
        'vuepress-plugin-seo',
        {
          image: ($page, $site) => {
            if ($page.frontmatter.image) {
              return $site.themeConfig.domain &&
                !$page.frontmatter.image.startsWith('http')
                ? $site.themeConfig.domain + $page.frontmatter.image
                : $page.frontmatter.image;
            }
            return '';
          },
        },
      ],
      ['@vuepress/last-updated'],
      ['vuepress-plugin-reading-time'],
    ],
  };
};
