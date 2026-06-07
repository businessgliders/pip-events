import { useEffect } from 'react';

/**
 * Sets the document title using the public-page SEO pattern:
 *   "{title} | Book Private Events — Pilates in Pink™"
 *
 * Use only on public (un-authed) pages. Backend/staff pages set their own title.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title} | Book Private Events — Pilates in Pink™`;
    return () => { document.title = prev; };
  }, [title]);
}