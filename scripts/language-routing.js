'use strict';

const fs = require('fs/promises');
const path = require('path');
const pagination = require('hexo-pagination');
const { url_for: baseUrlFor, full_url_for: baseFullUrlFor, escapeHTML, stripHTML } = require('hexo-util');

const DEFAULT_LANGUAGE = 'en';
const CHINESE_LANGUAGE = 'zh-CN';
const CHINESE_PREFIX = 'zh';
const CJK_IN_FILENAME_RE = /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/;
const ENGLISH_SITE_TITLE = "LinYiBing's Blog";
const CHINESE_SITE_TITLE = '林宜丙的博客';
const ENGLISH_AUTHOR_NAME = 'LinYiBing';
const CHINESE_AUTHOR_NAME = '林宜丙';

function normalizeLang(lang) {
  return /^zh/i.test(lang || '') ? CHINESE_LANGUAGE : DEFAULT_LANGUAGE;
}

function trimSlashes(value = '') {
  return value.replace(/^\/+|\/+$/g, '');
}

function normalizePathname(pathname = '') {
  const { pathname: rawPathname, suffix } = splitUrlSuffix(pathname);
  let normalizedPathname = `${rawPathname || ''}`.replace(/\\/g, '/');

  if (!normalizedPathname || normalizedPathname === '.') {
    normalizedPathname = '/';
  }

  if (!normalizedPathname.startsWith('/')) {
    normalizedPathname = `/${normalizedPathname}`;
  }

  normalizedPathname = normalizedPathname.replace(/\/index\.html$/i, '/');
  normalizedPathname = normalizedPathname.replace(/\/{2,}/g, '/');

  if (normalizedPathname !== '/' && !path.extname(normalizedPathname) && !normalizedPathname.endsWith('/')) {
    normalizedPathname = `${normalizedPathname}/`;
  }

  return `${normalizedPathname}${suffix}`;
}

function toRelativeRoute(pathname = '') {
  const { pathname: rawPathname } = splitUrlSuffix(normalizePathname(pathname));
  return rawPathname === '/' ? '' : trimSlashes(rawPathname);
}

function getLocalizedCollectionPath(pathname, lang) {
  const normalizedPath = normalizePathname(pathname);

  if (normalizeLang(lang) === CHINESE_LANGUAGE) {
    return localizeOutputUrl(normalizedPath, lang);
  }

  if (normalizedPath === '/zh/' || normalizedPath === '/zh') {
    return '/';
  }

  if (normalizedPath.startsWith('/zh/')) {
    return normalizedPath.replace(/^\/zh/, '') || '/';
  }

  return normalizedPath;
}

function buildRoute(lang, route = '') {
  const parts = [];
  if (normalizeLang(lang) === CHINESE_LANGUAGE) {
    parts.push(CHINESE_PREFIX);
  }

  const normalizedRoute = trimSlashes(route);
  if (normalizedRoute) {
    parts.push(normalizedRoute);
  }

  return parts.length ? `${parts.join('/')}/` : '';
}

function inferLanguageFromSource(source = '') {
  const normalizedSource = source.replace(/\\/g, '/');

  if (normalizedSource.startsWith(`${CHINESE_PREFIX}/`)) {
    return CHINESE_LANGUAGE;
  }

  const basename = path.basename(normalizedSource, path.extname(normalizedSource));
  return CJK_IN_FILENAME_RE.test(basename) ? CHINESE_LANGUAGE : DEFAULT_LANGUAGE;
}

function getPageLanguage(page = {}, routePath = '') {
  if (page.source) {
    return inferLanguageFromSource(page.source);
  }

  const normalizedRoutePath = trimSlashes(normalizePathname(routePath));
  if (normalizedRoutePath === CHINESE_PREFIX || normalizedRoutePath.startsWith(`${CHINESE_PREFIX}/`)) {
    return CHINESE_LANGUAGE;
  }

  if (page.lang || page.language) {
    return normalizeLang(page.lang || page.language);
  }

  return DEFAULT_LANGUAGE;
}

function splitUrlSuffix(url) {
  const match = `${url}`.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match ? match[1] : `${url}`,
    suffix: match ? match[2] : ''
  };
}

function isExternalUrl(url) {
  return /^(?:[a-z]+:)?\/\//i.test(url) || /^(?:mailto:|tel:|javascript:|#)/i.test(url);
}

function localizeOutputUrl(url, lang) {
  if (normalizeLang(lang) !== CHINESE_LANGUAGE || typeof url !== 'string' || isExternalUrl(url)) {
    return url;
  }

  const { pathname, suffix } = splitUrlSuffix(normalizePathname(url));

  if (pathname === '' || pathname === '/') {
    return `/zh/${suffix}`;
  }

  if (pathname === '/zh' || pathname.startsWith('/zh/')) {
    return `${pathname}${suffix}`;
  }

  if (
    /^\/(?:archives|categories|tags|about)(?:\/|$)/.test(pathname) ||
    /^\/page\/\d+(?:\/|$)/.test(pathname) ||
    pathname === '/content.json'
  ) {
    return `/zh${pathname}${suffix}`;
  }

  return `${pathname}${suffix}`;
}

function isCollectionPage(pathname) {
  const normalizedPath = normalizePathname(pathname);
  return (
    normalizedPath === '/' ||
    normalizedPath === '/zh/' ||
    /^\/(?:zh\/)?page\/\d+(?:\/|$)/.test(normalizedPath) ||
    /^\/(?:zh\/)?(?:archives|categories|tags|about)(?:\/|$)/.test(normalizedPath)
  );
}

function toggleCollectionPath(pathname, targetLang) {
  const { suffix } = splitUrlSuffix(pathname);
  const normalizedPath = normalizePathname(pathname);

  if (normalizeLang(targetLang) === CHINESE_LANGUAGE) {
    return `${getLocalizedCollectionPath(normalizedPath, CHINESE_LANGUAGE)}${suffix}`;
  }

  return `${getLocalizedCollectionPath(normalizedPath, DEFAULT_LANGUAGE)}${suffix}`;
}

function extractAlternatePostPath(page, targetLang) {
  const raw = page.raw || '';
  if (!raw) {
    return '';
  }

  const labels = normalizeLang(targetLang) === CHINESE_LANGUAGE
    ? ['简体中文', '中文']
    : ['English Version', 'English', 'EN'];

  for (const label of labels) {
    const pattern = new RegExp(`href="([^"]+)"[^>]*>${label}<\\/a>`, 'i');
    const match = raw.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}

function getPageRoutePath(page = {}, routePath = '') {
  const candidates = [routePath, page.path];

  if (typeof page.permalink === 'string' && page.permalink) {
    try {
      candidates.push(new URL(page.permalink).pathname);
    } catch (error) {
      candidates.push(page.permalink);
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate) {
      continue;
    }

    if (isExternalUrl(candidate)) {
      continue;
    }

    return normalizePathname(candidate);
  }

  return '/';
}

function getLanguageSwitchUrl(page, targetLang, routePath = '') {
  const currentPath = getPageRoutePath(page, routePath);

  if (page && (page.layout === 'post' || page.__post || (page.source || '').startsWith('_posts/'))) {
    const alternatePostPath = extractAlternatePostPath(page, targetLang);
    if (alternatePostPath) {
      return normalizePathname(alternatePostPath);
    }
  }

  if (isCollectionPage(currentPath)) {
    return toggleCollectionPath(currentPath, targetLang);
  }

  return normalizeLang(targetLang) === CHINESE_LANGUAGE ? '/zh/' : '/';
}

function localizeTaxonomyEntry(entry, lang) {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }

  return {
    ...entry,
    path: toRelativeRoute(getLocalizedCollectionPath(entry.path || '', lang))
  };
}

function localizeTaxonomyEntries(entries, lang) {
  if (!Array.isArray(entries)) {
    return entries;
  }

  return entries.map(entry => ({
    ...localizeTaxonomyEntry(entry, lang),
    parent: entry && entry.parent ? localizeTaxonomyEntry(entry.parent, lang) : entry.parent,
    parents: Array.isArray(entry && entry.parents) ? entry.parents.map(parent => localizeTaxonomyEntry(parent, lang)) : entry.parents
  }));
}

function localizePageData(ctx, page = {}, lang, routePath = '') {
  const normalizedLang = normalizeLang(lang);
  const localizedPath = toRelativeRoute(getLocalizedCollectionPath(getPageRoutePath(page, routePath), normalizedLang));
  const localizedPage = {
    ...page,
    path: localizedPath,
    lang: normalizedLang,
    language: normalizedLang,
    categories: localizeTaxonomyEntries(page.categories, normalizedLang),
    tags: localizeTaxonomyEntries(page.tags, normalizedLang)
  };

  if (page.prev) {
    localizedPage.prev = {
      ...page.prev,
      path: toRelativeRoute(normalizePathname(page.prev.path || ''))
    };
  }

  if (page.next) {
    localizedPage.next = {
      ...page.next,
      path: toRelativeRoute(normalizePathname(page.next.path || ''))
    };
  }

  localizedPage.permalink = baseFullUrlFor.call(ctx, `/${localizedPath}`);
  return localizedPage;
}

function getRoutePathFromGeneratedFile(relativeFilePath = '') {
  return normalizePathname(relativeFilePath.replace(/\\/g, '/'));
}

function rewriteCollectionLanguageSwitch(html, currentPath, lang) {
  if (!isCollectionPage(currentPath)) {
    return html;
  }

  const targetLang = normalizeLang(lang) === CHINESE_LANGUAGE ? DEFAULT_LANGUAGE : CHINESE_LANGUAGE;
  const switchLabel = normalizeLang(lang) === CHINESE_LANGUAGE ? 'EN' : '中文';
  const switchPath = toggleCollectionPath(currentPath, targetLang);

  return html.replace(
    /<a class="navbar-item(?: is-active)?" href="[^"]+"([^>]*)>(EN|中文)<\/a>/,
    `<a class="navbar-item" href="${switchPath}"$1>${switchLabel}</a>`
  );
}

function rewriteLocalizedHomeLinks(html, lang) {
  const homePath = normalizeLang(lang) === CHINESE_LANGUAGE ? '/zh/' : '/';

  return html
    .replace(/<a class="navbar-item navbar-logo" href="[^"]+"/, `<a class="navbar-item navbar-logo" href="${homePath}"`)
    .replace(/<a class="footer-logo is-block mb-2" href="[^"]+"/, `<a class="footer-logo is-block mb-2" href="${homePath}"`);
}

function rewriteEnglishBranding(html, lang) {
  if (normalizeLang(lang) !== DEFAULT_LANGUAGE) {
    return html;
  }

  return html
    .replaceAll(CHINESE_SITE_TITLE, ENGLISH_SITE_TITLE)
    .replaceAll(`>${CHINESE_AUTHOR_NAME}<`, `>${ENGLISH_AUTHOR_NAME}<`)
    .replaceAll(`"${CHINESE_AUTHOR_NAME}"`, `"${ENGLISH_AUTHOR_NAME}"`)
    .replaceAll(`content="${CHINESE_AUTHOR_NAME}"`, `content="${ENGLISH_AUTHOR_NAME}"`)
    .replace(/&copy; (\d{4}) 林宜丙/g, '&copy; $1 LinYiBing');
}

async function collectHtmlFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith('.html')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function buildPostQuery(ctx, posts, lang, orderBy) {
  const { Query } = ctx.model('Post');
  const data = [];

  posts.forEach(post => {
    if (inferLanguageFromSource(post.source) === normalizeLang(lang)) {
      data.push(post);
    }
  });

  const query = new Query(data);
  return orderBy ? query.sort(orderBy) : query;
}

function buildLocalizedPostQuery(ctx, posts, lang, orderBy) {
  const { Query } = ctx.model('Post');
  const data = [];

  posts.forEach(post => {
    if (inferLanguageFromSource(post.source) === normalizeLang(lang)) {
      data.push(localizePageData(ctx, post, lang));
    }
  });

  const query = new Query(data);
  return orderBy ? query.sort(orderBy) : query;
}

function buildTermQuery(ctx, modelName, items, lang) {
  const { Query } = ctx.model(modelName);
  const data = [];

  items.forEach(item => {
    const posts = buildPostQuery(ctx, item.posts, lang);
    if (!posts.length) {
      return;
    }

    data.push({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      parent: item.parent,
      path: item.path,
      length: posts.length,
      posts
    });
  });

  return new Query(data);
}

function buildLocalizedTermQuery(ctx, modelName, items, lang) {
  const { Query } = ctx.model(modelName);
  const data = [];

  items.forEach(item => {
    const posts = buildLocalizedPostQuery(ctx, item.posts, lang);
    if (!posts.length) {
      return;
    }

    data.push({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      parent: item.parent ? localizeTaxonomyEntry(item.parent, lang) : item.parent,
      parents: Array.isArray(item.parents) ? item.parents.map(parent => localizeTaxonomyEntry(parent, lang)) : item.parents,
      path: toRelativeRoute(getLocalizedCollectionPath(item.path || '', lang)),
      length: posts.length,
      posts
    });
  });

  return new Query(data);
}

function sortStickyPosts(posts) {
  posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));
  return posts;
}

function createPaginatedPages(basePath, posts, perPage, paginationDir, layout, data = {}) {
  return pagination(basePath, posts, {
    perPage,
    layout,
    format: `${paginationDir}/%d/`,
    data
  });
}

function createArchivePages(ctx, posts, lang) {
  const { config } = ctx;
  const perPage = config.archive_generator.per_page;
  const archiveDir = buildRoute(lang, config.archive_dir);
  const paginationDir = config.pagination_dir || 'page';
  const result = [];

  function generate(pathname, archivePosts, extraData = {}) {
    result.push(...createPaginatedPages(pathname, archivePosts, perPage, paginationDir, ['archive', 'index'], {
      archive: true,
      lang,
      language: lang,
      ...extraData
    }));
  }

  generate(archiveDir, posts);

  if (!config.archive_generator.yearly) {
    return result;
  }

  const grouped = {};

  posts.forEach(post => {
    const year = post.date.year();
    const month = post.date.month() + 1;

    if (!grouped[year]) {
      grouped[year] = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ];
    }

    grouped[year][0].push(post);
    grouped[year][month].push(post);
  });

  const { Query } = ctx.model('Post');

  Object.keys(grouped).forEach(yearKey => {
    const year = Number(yearKey);
    const yearPosts = grouped[year][0];
    if (!yearPosts.length) {
      return;
    }

    const yearRoute = `${archiveDir}${year}/`;
    generate(yearRoute, new Query(yearPosts), { year });

    if (!config.archive_generator.monthly) {
      return;
    }

    for (let month = 1; month <= 12; month += 1) {
      const monthPosts = grouped[year][month];
      if (!monthPosts.length) {
        continue;
      }

      generate(`${yearRoute}${String(month).padStart(2, '0')}/`, new Query(monthPosts), {
        year,
        month
      });
    }
  });

  return result;
}

function createTagPages(ctx, locals, lang) {
  const { config } = ctx;
  const paginationDir = config.pagination_dir || 'page';
  const perPage = config.tag_generator.per_page;
  const orderBy = config.tag_generator.order_by || '-date';
  const result = [];

  locals.tags.forEach(tag => {
    const posts = buildLocalizedPostQuery(ctx, tag.posts, lang, orderBy);
    if (!posts.length) {
      return;
    }

    const route = buildRoute(lang, tag.path);
    result.push(...createPaginatedPages(route, posts, perPage, paginationDir, ['tag', 'archive', 'index'], {
      tag: tag.name,
      lang,
      language: lang
    }));
  });

  result.push({
    path: buildRoute(lang, config.tag_dir),
    layout: ['tags'],
    data: {
      lang,
      language: lang
    }
  });

  return result;
}

function createCategoryPages(ctx, locals, lang) {
  const { config } = ctx;
  const paginationDir = config.pagination_dir || 'page';
  const perPage = config.category_generator.per_page;
  const orderBy = config.category_generator.order_by || '-date';
  const result = [];

  locals.categories.forEach(category => {
    const posts = buildLocalizedPostQuery(ctx, category.posts, lang, orderBy);
    if (!posts.length) {
      return;
    }

    result.push(...createPaginatedPages(
      buildRoute(lang, category.path),
      posts,
      perPage,
      paginationDir,
      ['category', 'archive', 'index'],
      {
        category: category.name,
        parents: category.parents || [],
        lang,
        language: lang
      }
    ));
  });

  result.push({
    path: buildRoute(lang, config.category_dir),
    layout: ['categories'],
    data: {
      lang,
      language: lang
    }
  });

  return result;
}

function escapeSearchText(text) {
  return escapeHTML(text).trim();
}

function minifySearchText(text) {
  return stripHTML(text)
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&#x([\da-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([\d]+);/g, (match, dec) => String.fromCharCode(dec));
}

function createSearchIndex(ctx, locals, lang) {
  const language = normalizeLang(lang);
  const localizedPosts = buildPostQuery(ctx, locals.posts, language, ctx.config.index_generator.order_by || '-date');
  const localizedTags = buildTermQuery(ctx, 'Tag', locals.tags, language);
  const localizedCategories = buildTermQuery(ctx, 'Category', locals.categories, language);
  const localizedPages = [];

  locals.pages.forEach(page => {
    if (!page.source.endsWith('.md')) {
      return;
    }

    if (inferLanguageFromSource(page.source) === language) {
      localizedPages.push(page);
    }
  });

  function sectionUrl(route) {
    const resolved = baseUrlFor.call(ctx, route);
    return localizeOutputUrl(resolved, language);
  }

  function mapDocument(doc) {
    return {
      title: escapeSearchText(doc.title),
      text: minifySearchText(doc.content),
      link: normalizePathname(baseUrlFor.call(ctx, doc.path))
    };
  }

  function mapTerm(term) {
    return {
      name: escapeSearchText(term.name),
      slug: minifySearchText(term.slug),
      link: sectionUrl(term.path)
    };
  }

  return {
    path: normalizeLang(language) === CHINESE_LANGUAGE ? 'zh/content.json' : 'content.json',
    data: JSON.stringify({
      posts: localizedPosts.map(mapDocument),
      tags: localizedTags.map(mapTerm),
      categories: localizedCategories.map(mapTerm),
      pages: localizedPages.map(mapDocument)
    })
  };
}

let runtimeSearchGeneratorRegistered = false;

hexo.extend.filter.register('before_generate', function beforeGenerate() {
  if (runtimeSearchGeneratorRegistered) {
    return;
  }

  hexo.extend.generator.register('zz-localized-insight', function runtimeLocalizedInsightGenerator(locals) {
    return [
      createSearchIndex(this, locals, DEFAULT_LANGUAGE),
      createSearchIndex(this, locals, CHINESE_LANGUAGE)
    ];
  });

  runtimeSearchGeneratorRegistered = true;
});

hexo.extend.filter.register('template_locals', function templateLocals(locals) {
  const pageLang = getPageLanguage(locals.page, locals.path);
  const targetLang = pageLang === CHINESE_LANGUAGE ? DEFAULT_LANGUAGE : CHINESE_LANGUAGE;
  const i18n = this.theme.i18n;
  const themeConfig = this.theme.config || {};
  const baseConfig = {
    ...themeConfig,
    ...locals.config,
    head: {
      ...themeConfig.head,
      ...locals.config.head
    },
    navbar: {
      ...themeConfig.navbar,
      ...locals.config.navbar
    },
    footer: {
      ...themeConfig.footer,
      ...locals.config.footer
    },
    sidebar: {
      ...themeConfig.sidebar,
      ...locals.config.sidebar
    },
    widgets: Array.isArray(themeConfig.widgets) ? themeConfig.widgets : locals.config.widgets
  };
  const languages = [...new Set([pageLang].concat(i18n.languages, i18n.list()).filter(Boolean))];
  const localizedPage = localizePageData(this, locals.page, pageLang, locals.path);

  localizedPage.language_switch_url = getLanguageSwitchUrl(localizedPage, targetLang, locals.path);
  locals.page = localizedPage;

  locals.__ = i18n.__(languages);
  locals._p = i18n._p(languages);

  if (locals.helper) {
    const languageSwitchUrl = localizedPage.language_switch_url;

    locals.helper.url_for = (pathname, options) => {
      const resolved = baseUrlFor.call(locals, pathname, options);

      if (
        typeof pathname === 'string' &&
        !isExternalUrl(pathname) &&
        languageSwitchUrl &&
        normalizePathname(pathname) === normalizePathname(languageSwitchUrl)
      ) {
        return normalizePathname(languageSwitchUrl);
      }

      return localizeOutputUrl(resolved, pageLang);
    };

    locals.helper.full_url_for = pathname => {
      return baseFullUrlFor.call(locals, locals.helper.url_for(pathname));
    };
  }

  const localizedConfig = {
    ...baseConfig,
    title: pageLang === CHINESE_LANGUAGE ? CHINESE_SITE_TITLE : ENGLISH_SITE_TITLE,
    author: pageLang === CHINESE_LANGUAGE ? CHINESE_AUTHOR_NAME : ENGLISH_AUTHOR_NAME,
    head: {
      ...baseConfig.head,
      manifest: {
        ...baseConfig.head?.manifest,
        name: pageLang === CHINESE_LANGUAGE ? CHINESE_SITE_TITLE : ENGLISH_SITE_TITLE,
        short_name: pageLang === CHINESE_LANGUAGE ? CHINESE_AUTHOR_NAME : ENGLISH_AUTHOR_NAME
      }
    },
    navbar: {
      ...baseConfig.navbar,
      menu: pageLang === CHINESE_LANGUAGE
        ? {
            '首页': '/zh/',
            '归档': '/zh/archives/',
            '分类': '/zh/categories/',
            '标签': '/zh/tags/',
            '关于': '/zh/about/',
            EN: locals.page.language_switch_url
          }
        : {
            Home: '/',
            Archives: '/archives/',
            Categories: '/categories/',
            Tags: '/tags/',
            About: '/about/',
            '中文': locals.page.language_switch_url
          }
    },
    widgets: Array.isArray(baseConfig.widgets)
      ? baseConfig.widgets.map(widget => {
          if (widget.type !== 'profile') {
            return widget;
          }

          return pageLang === CHINESE_LANGUAGE
            ? {
                ...widget,
                author: CHINESE_AUTHOR_NAME,
                author_title: '前端工程师',
                location: '中国杭州'
              }
            : {
                ...widget,
                author: ENGLISH_AUTHOR_NAME,
                author_title: 'Frontend Engineer',
                location: 'Hangzhou, China'
              };
        })
      : baseConfig.widgets
  };

  locals.config = localizedConfig;
  locals.theme = {
    ...locals.theme,
    ...themeConfig,
    navbar: localizedConfig.navbar,
    widgets: localizedConfig.widgets,
    footer: localizedConfig.footer,
    sidebar: localizedConfig.sidebar,
    head: localizedConfig.head
  };
  locals.site = {
    ...locals.site,
    posts: buildLocalizedPostQuery(this, locals.site.posts, pageLang),
    tags: buildLocalizedTermQuery(this, 'Tag', locals.site.tags, pageLang),
    categories: buildLocalizedTermQuery(this, 'Category', locals.site.categories, pageLang)
  };

  return locals;
});

hexo.extend.filter.register('after_render:html', function afterRenderHtml(html, data = {}) {
  const pageLang = getPageLanguage(data.page, data.path);
  const contentUrl = normalizeLang(pageLang) === CHINESE_LANGUAGE ? '/zh/content.json' : '/content.json';
  const brandedHtml = rewriteEnglishBranding(html, pageLang);
  const homeLocalizedHtml = rewriteLocalizedHomeLinks(brandedHtml, pageLang);

  return homeLocalizedHtml.replace(/loadInsight\(\{"contentUrl":"[^"]+"/, `loadInsight({"contentUrl":"${contentUrl}"`);
});

hexo.extend.filter.register('after_generate', async function afterGenerate() {
  const htmlFiles = await collectHtmlFiles(this.public_dir);

  await Promise.all(htmlFiles.map(async file => {
    const relativeFilePath = path.relative(this.public_dir, file);
    const currentPath = getRoutePathFromGeneratedFile(relativeFilePath);
    const pageLang = getPageLanguage({}, currentPath);

    if (!isCollectionPage(currentPath)) {
      return;
    }

    const originalHtml = await fs.readFile(file, 'utf8');
    const nextHtml = rewriteCollectionLanguageSwitch(originalHtml, currentPath, pageLang);

    if (nextHtml !== originalHtml) {
      await fs.writeFile(file, nextHtml);
    }
  }));
});

hexo.extend.generator.register('index', function indexGenerator(locals) {
  const { config } = this;
  const paginationDir = config.pagination_dir || 'page';
  const perPage = config.index_generator.per_page;
  const orderBy = config.index_generator.order_by;

  const englishPosts = sortStickyPosts(buildLocalizedPostQuery(this, locals.posts, DEFAULT_LANGUAGE, orderBy));
  const chinesePosts = sortStickyPosts(buildLocalizedPostQuery(this, locals.posts, CHINESE_LANGUAGE, orderBy));

  return [
    ...createPaginatedPages('', englishPosts, perPage, paginationDir, ['index', 'archive'], {
      __index: true,
      lang: DEFAULT_LANGUAGE,
      language: DEFAULT_LANGUAGE
    }),
    ...createPaginatedPages('zh/', chinesePosts, perPage, paginationDir, ['index', 'archive'], {
      __index: true,
      lang: CHINESE_LANGUAGE,
      language: CHINESE_LANGUAGE
    })
  ];
});

hexo.extend.generator.register('archive', function archiveGenerator(locals) {
  const orderBy = this.config.archive_generator.order_by || '-date';
  const englishPosts = buildLocalizedPostQuery(this, locals.posts, DEFAULT_LANGUAGE, orderBy);
  const chinesePosts = buildLocalizedPostQuery(this, locals.posts, CHINESE_LANGUAGE, orderBy);

  return [
    ...createArchivePages(this, englishPosts, DEFAULT_LANGUAGE),
    ...createArchivePages(this, chinesePosts, CHINESE_LANGUAGE)
  ];
});

hexo.extend.generator.register('tag', function tagGenerator(locals) {
  return [
    ...createTagPages(this, locals, DEFAULT_LANGUAGE),
    ...createTagPages(this, locals, CHINESE_LANGUAGE)
  ];
});

hexo.extend.generator.register('category', function categoryGenerator(locals) {
  return [
    ...createCategoryPages(this, locals, DEFAULT_LANGUAGE),
    ...createCategoryPages(this, locals, CHINESE_LANGUAGE)
  ];
});
