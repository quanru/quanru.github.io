const css = hexo.extend.helper.get('css').bind(hexo);
const js = hexo.extend.helper.get('js').bind(hexo);

hexo.extend.injector.register('head_end', () => {
  return css('/css/index.css');
});

// hexo.extend.injector.register(
//   'head_begin',
//   `<meta name="google-adsense-account" content="ca-pub-4534950213360679">`
// );

hexo.extend.injector.register(
  'head_begin',
  `<meta name="google-site-verification" content="XKB565_wrzbUdiA1Uwp8UUj3ncEr2Oxb8GimIGXcPxY">`
);

hexo.extend.injector.register(
  'head_end',
  `<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "kvbvszxxym");
  </script>`
);

hexo.extend.injector.register(
  'body_end',
  `<script>
    (function () {
      const script = document.createElement('script');
      const lang = document.documentElement.lang === 'zh' ? 'zh-CN' : 'en';

      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', 'quanru/quanru.github.io');
      script.setAttribute('data-repo-id', 'MDEwOlJlcG9zaXRvcnk3NDI4NDUwOQ==');
      script.setAttribute('data-category', 'Announcements');
      script.setAttribute('data-category-id', 'DIC_kwDOBG193c4CQ8si');
      script.setAttribute('data-mapping', 'title');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-reactions-enabled', '1');
      script.setAttribute('data-emit-metadata', '0');
      script.setAttribute('data-input-position', 'top');
      script.setAttribute('data-theme', 'preferred_color_scheme');
      script.setAttribute('data-lang', lang);
      script.setAttribute('data-loading', 'lazy');
      script.setAttribute('crossorigin', 'anonymous');
      script.async = true;

      document.currentScript.parentNode.insertBefore(script, document.currentScript);
    })();
  </script>`,
  'post'
);
