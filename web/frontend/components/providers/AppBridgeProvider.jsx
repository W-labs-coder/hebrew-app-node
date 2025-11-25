import { useEffect, useState } from 'react';

function getApiKey() {
  // Prefer Vite-injected env, fallback to meta tag
  // eslint-disable-next-line no-undef
  const viteKey = (import.meta && import.meta.env && import.meta.env.VITE_SHOPIFY_API_KEY) || undefined;
  if (viteKey) return viteKey;
  const tag = document.querySelector('meta[name="shopify-api-key"]');
  return tag?.content || '';
}

function getHost() {
  const url = new URL(window.location.href);
  const hostParam = url.searchParams.get('host');
  if (hostParam) return hostParam;

  const shop = url.searchParams.get('shop');
  if (shop) {
    try {
      // Some browsers need btoa to handle unicode safely
      return typeof btoa === 'function'
        ? btoa(`${shop}/admin`)
        : Buffer.from(`${shop}/admin`).toString('base64');
    } catch (_) {}
  }

  const tag = document.querySelector('meta[name="shopify-host"]');
  if (tag?.content) return tag.content;

  // NEW FALLBACK: attempt to extract host from iframe src if inside Shopify admin
  try {
    const iframeHost = window.top.location.href.match(/host=([^&]+)/);
    if (iframeHost && iframeHost[1]) return iframeHost[1];
  } catch (_) {
    // Ignore cross-origin errors
  }

  // Final fallback: return empty string to avoid crash
  return '';
}

export function AppBridgeProvider({ children }) {
  const apiKey = getApiKey();
  const host = getHost();
  const [ProviderComp, setProviderComp] = useState(null);

  // Dynamically import to avoid build-time export shape issues
  useEffect(() => {
    let cancelled = false;
    import('@shopify/app-bridge-react')
      .then((mod) => {
        if (cancelled) return;
        const P = mod?.Provider || mod?.default || null;
        if (P) setProviderComp(() => P);
      })
      .catch(() => {
        // Silently skip; we will render children without provider
      });
    return () => { cancelled = true; };
  }, []);

  if (!apiKey || !host || !ProviderComp) return children;

  const config = { apiKey, host, forceRedirect: true };

  return (
    <ProviderComp config={config}>
      {children}
    </ProviderComp>
  );
}



// import { useEffect, useState } from 'react';

// function getApiKey() {
//   // Prefer Vite-injected env, fallback to meta tag
//   // eslint-disable-next-line no-undef
//   const viteKey = (import.meta && import.meta.env && import.meta.env.VITE_SHOPIFY_API_KEY) || undefined;
//   if (viteKey) return viteKey;
//   const tag = document.querySelector('meta[name="shopify-api-key"]');
//   return tag?.content || '';
// }

// function getHost() {
//   const url = new URL(window.location.href);
//   const hostParam = url.searchParams.get('host');
//   if (hostParam) return hostParam;
//   // Fallback: derive host from shop param if present (base64 of `${shop}/admin`)
//   const shop = url.searchParams.get('shop');
//   if (shop) {
//     try {
//       // Some browsers need btoa to handle unicode safely
//       const enc = typeof btoa === 'function' ? btoa(`${shop}/admin`) : Buffer.from(`${shop}/admin`).toString('base64');
//       return enc;
//     } catch (_) {}
//   }
//   const tag = document.querySelector('meta[name="shopify-host"]');
//   return tag?.content || '';
// }

// export function AppBridgeProvider({ children }) {
//   const apiKey = getApiKey();
//   const host = getHost();
//   const [ProviderComp, setProviderComp] = useState(null);

//   // Dynamically import to avoid build-time export shape issues
//   useEffect(() => {
//     let cancelled = false;
//     import('@shopify/app-bridge-react')
//       .then((mod) => {
//         if (cancelled) return;
//         const P = mod?.Provider || mod?.default || null;
//         if (P) setProviderComp(() => P);
//       })
//       .catch(() => {
//         // Silently skip; we will render children without provider
//       });
//     return () => { cancelled = true; };
//   }, []);

//   // If we cannot find required config, render children without provider to avoid crashes
//   if (!apiKey || !host || !ProviderComp) return children;

//   const config = { apiKey, host, forceRedirect: true };
//   return (
//     <ProviderComp config={config}>
//       {children}
//     </ProviderComp>
//   );
// }
