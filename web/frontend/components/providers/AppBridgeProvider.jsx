// Some versions of @shopify/app-bridge-react expose Provider as default rather than named export in ESM builds
// Import default and alias for compatibility
import AppBridgeProviderReact from '@shopify/app-bridge-react';

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
  // Fallback: derive host from shop param if present (base64 of `${shop}/admin`)
  const shop = url.searchParams.get('shop');
  if (shop) {
    try {
      // Some browsers need btoa to handle unicode safely
      const enc = typeof btoa === 'function' ? btoa(`${shop}/admin`) : Buffer.from(`${shop}/admin`).toString('base64');
      return enc;
    } catch (_) {}
  }
  const tag = document.querySelector('meta[name="shopify-host"]');
  return tag?.content || '';
}

export function AppBridgeProvider({ children }) {
  const apiKey = getApiKey();
  const host = getHost();

  // If we cannot find required config, render children without provider to avoid crashes
  if (!apiKey || !host) return children;

  const config = { apiKey, host, forceRedirect: true };
  return (
    <AppBridgeProviderReact config={config}>
      {children}
    </AppBridgeProviderReact>
  );
}
