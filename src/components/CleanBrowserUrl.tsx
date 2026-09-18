'use client';

import { useEffect } from 'react';

/**
 * CleanBrowserUrl
 * Silently replaces the browser URL in the address bar and Chrome tab
 * with the clean pathname (e.g. '/login'), hiding ugly query parameters
 * like redirect, message, etc. after the server has already parsed them.
 */
export function CleanBrowserUrl() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return null;
}
