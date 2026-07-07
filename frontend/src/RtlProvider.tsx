import { type ReactNode, useEffect } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';

// Create RTL cache for Emotion
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

interface RtlProviderProps {
  children: ReactNode;
}

/**
 * RTL Provider component
 * 
 * Wraps the application to enable RTL support for Material-UI components
 * using Emotion cache with RTL plugin
 */
export function RtlProvider({ children }: RtlProviderProps) {
  useEffect(() => {
    // Set document direction to RTL
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return <CacheProvider value={cacheRtl}>{children}</CacheProvider>;
}
