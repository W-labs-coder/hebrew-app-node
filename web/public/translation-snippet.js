(() => {
  try {
    const enabled = true; // server controls serving this file
    if (!enabled) return;

    const params = new URLSearchParams(window.location.search);
    const qlang = (params.get('lang') || '').toLowerCase();
    const navLang = (navigator.language || '').toLowerCase();
    const wantsHe = qlang === 'he' || qlang === 'he-il' || navLang.startsWith('he');
    if (!wantsHe) return;

    const shop = (window.__SHOP_DOMAIN__ || '')
      || (document.currentScript && new URL(document.currentScript.src).searchParams.get('shop'))
      || '';
    const theme = (window.__THEME_NAME__ || '')
      || (document.currentScript && new URL(document.currentScript.src).searchParams.get('theme'))
      || '';

    const locale = 'he';
    const endpoint = `/api/locales/${locale}.json` + (shop ? `?shop=${encodeURIComponent(shop)}${theme ? `&theme=${encodeURIComponent(theme)}` : ''}` : '');

    function setRtl() {
      const html = document.documentElement;
      if (!html.getAttribute('dir')) html.setAttribute('dir', 'rtl');
      html.lang = 'he';
      document.body && (document.body.style.direction = 'rtl');
    }

    function traverse(root, cb) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
          const text = n.nodeValue.trim();
          if (!text) return NodeFilter.FILTER_REJECT;
          if (n.parentElement && ['SCRIPT','STYLE','NOSCRIPT'].includes(n.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(cb);
    }

    function applyDictionary(dict) {
      const map = dict || {};
      setRtl();
      traverse(document.body || document, (tn) => {
        const original = tn.nodeValue.trim();
        if (!original) return;
        // Exact match first
        let replacement = map[original];
        if (!replacement) return;
        if (replacement && typeof replacement === 'string' && replacement !== original) {
          tn.nodeValue = tn.nodeValue.replace(original, replacement);
        }
      });
    }

    function observe(dict) {
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes && m.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                traverse(node, (tn) => {
                  const original = tn.nodeValue.trim();
                  const replacement = dict[original];
                  if (replacement && replacement !== original) {
                    tn.nodeValue = tn.nodeValue.replace(original, replacement);
                  }
                });
              }
            });
          } else if (m.type === 'characterData' && m.target && m.target.nodeType === 3) {
            const tn = m.target;
            const original = tn.nodeValue.trim();
            const replacement = dict[original];
            if (replacement && replacement !== original) {
              tn.nodeValue = tn.nodeValue.replace(original, replacement);
            }
          }
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    }

    fetch(endpoint, { credentials: 'omit' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('failed')))
      .then((payload) => {
        if (!payload || !payload.data) return;
        applyDictionary(payload.data);
        observe(payload.data);
      })
      .catch(() => {});
  } catch (_) {}
})();

