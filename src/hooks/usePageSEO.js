import { useEffect } from 'react';

/**
 * Sets per-page SEO tags for public pages:
 *  - <meta name="description">
 *  - <link rel="canonical">
 *  - Open Graph: og:title, og:description, og:url
 *  - Twitter: twitter:title, twitter:description
 *
 * Restores previous values on unmount so private/staff pages aren't affected.
 *
 * Usage:
 *   usePageSEO({
 *     title: 'Events | Book Private Events — Pilates in Pink™',
 *     description: 'Host private events at our pink Pilates studio.',
 *     path: '/',
 *   });
 */
const SITE_ORIGIN = 'https://events.pilatesinpinkstudio.com';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs.create).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', attrs.content);
  return { el, prev, created };
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('href');
  el.setAttribute('href', href);
  return { el, prev, created };
}

export default function usePageSEO({ description, path, ogTitle, ogDescription, noindex = false } = {}) {
  useEffect(() => {
    const restorers = [];
    // Lowercase the path so canonicals are consistent (Google treats URLs as case-sensitive).
    const normalizedPath = path ? path.toLowerCase() : null;
    const canonicalUrl = normalizedPath ? `${SITE_ORIGIN}${normalizedPath}` : window.location.href.split('?')[0];

    if (noindex) {
      const r = upsertMeta('meta[name="robots"]', {
        create: { name: 'robots' },
        content: 'noindex, nofollow',
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }
    const effectiveOgTitle = ogTitle || document.title;
    const effectiveOgDesc = ogDescription || description;

    if (description) {
      const r = upsertMeta('meta[name="description"]', {
        create: { name: 'description' },
        content: description,
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }

    const canonical = upsertLink('canonical', canonicalUrl);
    restorers.push(() =>
      canonical.created ? canonical.el.remove() : canonical.el.setAttribute('href', canonical.prev)
    );

    if (effectiveOgTitle) {
      const r = upsertMeta('meta[property="og:title"]', {
        create: { property: 'og:title' },
        content: effectiveOgTitle,
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }

    if (effectiveOgDesc) {
      const r = upsertMeta('meta[property="og:description"]', {
        create: { property: 'og:description' },
        content: effectiveOgDesc,
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }

    const ogUrl = upsertMeta('meta[property="og:url"]', {
      create: { property: 'og:url' },
      content: canonicalUrl,
    });
    restorers.push(() => (ogUrl.created ? ogUrl.el.remove() : ogUrl.el.setAttribute('content', ogUrl.prev)));

    if (effectiveOgTitle) {
      const r = upsertMeta('meta[name="twitter:title"]', {
        create: { name: 'twitter:title' },
        content: effectiveOgTitle,
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }

    if (effectiveOgDesc) {
      const r = upsertMeta('meta[name="twitter:description"]', {
        create: { name: 'twitter:description' },
        content: effectiveOgDesc,
      });
      restorers.push(() => (r.created ? r.el.remove() : r.el.setAttribute('content', r.prev)));
    }

    return () => restorers.forEach((fn) => fn());
  }, [description, path, ogTitle, ogDescription]);
}