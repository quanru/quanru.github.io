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
  `<script src="https://giscus.app/client.js"
        data-repo="quanru/quanru.github.io"
        data-repo-id="MDEwOlJlcG9zaXRvcnk3NDI4NDUwOQ=="
        data-category="Announcements"
        data-category-id="DIC_kwDOBG193c4CQ8si"
        data-mapping="title"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        data-loading="lazy"
        crossorigin="anonymous"
        async>
  </script>`,
  'post'
);