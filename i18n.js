/**
 * i18n.js — CryptoNova lightweight internationalisation loader
 * Supports: en, fr, es, pt, de, tr, zh, ko, vi, th
 * Usage: <script src="/i18n.js" defer></script>
 * Keys: data-i18n="section.key"  data-i18n-placeholder="section.key"
 */
(function () {
  'use strict';

  const SUPPORTED = ['en', 'fr', 'es', 'pt', 'de', 'tr', 'zh', 'ko', 'vi', 'th'];
  const FLAGS = { en: '🇬🇧 EN', fr: '🇫🇷 FR', es: '🇪🇸 ES', pt: '🇧🇷 PT', de: '🇩🇪 DE', tr: '🇹🇷 TR', zh: '🇨🇳 ZH', ko: '🇰🇷 KO', vi: '🇻🇳 VI', th: '🇹🇭 TH' };
  let _t = {};

  /* ── Language resolution ─────────────────────────────────── */
  function getLang() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;
    try {
      const stored = localStorage.getItem('cnova_lang');
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) {}
    const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(browser) ? browser : 'en';
  }

  /* ── Key lookup ──────────────────────────────────────────── */
  function get(key, fallback) {
    const parts = key.split('.');
    let val = _t;
    for (const p of parts) {
      if (val == null || typeof val !== 'object') return fallback !== undefined ? fallback : key;
      val = val[p];
    }
    return (val != null && val !== '') ? val : (fallback !== undefined ? fallback : key);
  }

  /* ── Apply translations to DOM ───────────────────────────── */
  // AUDIT 2026-08-07: applyAll() used to run unconditionally, and get() was
  // called with NO fallback — so if the locale fetch failed, every translated
  // element was overwritten with its own dotted key ("termsPage.s3_li1_b").
  // Terms became 62 lines of keys, index 134. Two guards now: bail out entirely
  // on an empty table, and fall back to the element's EXISTING text (the HTML
  // already carries a sensible English default) rather than the key.
  function _hasTable() {
    return _t && typeof _t === 'object' && Object.keys(_t).length > 0;
  }
  function applyAll() {
    if (!_hasTable()) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = get(el.getAttribute('data-i18n'), null);
      if (v !== null && v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var v = get(el.getAttribute('data-i18n-placeholder'), null);
      if (v !== null && v !== undefined) el.placeholder = v;
    });
    // Meta description
    var descEl = document.querySelector('meta[name="description"][data-i18n-content]');
    if (descEl) { var dv = get(descEl.getAttribute('data-i18n-content'), null); if (dv !== null) descEl.content = dv; }
    // Page title
    var titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) { var tv = get(titleEl.getAttribute('data-i18n'), null); if (tv !== null) document.title = tv; }
    // HTML lang attribute
    document.documentElement.lang = getLang();
  }

  /* ── Fetch and apply a locale file ──────────────────────── */
  async function load(lang) {
    // AUDIT 2026-08-07: the old fallback was gated on `lang !== 'en'`, so the ONE
    // locale with no second chance was the default one — an English user whose
    // en.json 404'd got nothing at all. English is now always attempted, and a
    // non-English locale is MERGED OVER the English base so a partially
    // translated file shows English for its missing keys instead of raw keys.
    var base = null, want = null;
    try {
  // ── locale cache version ───────────────────────────────────────────────
  // BUMP THE ?v= STRING ON EVERY locales/*.json EDIT. It is the ONLY cache
  // buster for the translation files. Vercel revalidates the HTML on each
  // load, but these fetches are query-cached — so a stale JSON silently
  // overwrites correct HTML at runtime and the fix appears not to ship.
  // 2026-08-08: sat at v=811 through a full day of copy corrections.

      var rEn = await fetch('/locales/en.json?v=20260808a');
      if (rEn.ok) base = await rEn.json();
    } catch (_) {}
    if (lang !== 'en') {
      try {
        var r = await fetch('/locales/' + lang + '.json?v=20260808a');
        if (r.ok) want = await r.json();
      } catch (_2) {}
    }
    function deepMerge(a, b) {
      if (!b || typeof b !== 'object') return a;
      var out = Object.assign({}, a || {});
      Object.keys(b).forEach(function (k) {
        out[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]))
          ? deepMerge(out[k], b[k]) : b[k];
      });
      return out;
    }
    _t = want ? deepMerge(base, want) : (base || {});
    applyAll();   // no-ops when the table is empty — the HTML defaults stand
  }

  /* ── Language switcher widget (custom dropdown with flag images) ── */
  var FLAG_CC = { en:'gb', fr:'fr', es:'es', pt:'br', de:'de', tr:'tr', zh:'cn', ko:'kr', vi:'vn', th:'th' };
  var NAMES   = { en:'EN',  fr:'FR',  es:'ES',  pt:'PT',  de:'DE',  tr:'TR',  zh:'ZH',  ko:'KO',  vi:'VI',  th:'TH' };

  function _flagImg(code) {
    var img = document.createElement('img');
    img.src    = 'https://flagcdn.com/16x12/' + (FLAG_CC[code] || code) + '.png';
    img.width  = 16;
    img.height = 12;
    img.alt    = code;
    img.style.cssText = 'display:block;border-radius:2px;flex-shrink:0';
    return img;
  }

  function _injectCSS() {
    if (document.getElementById('i18n-drop-css')) return;
    var s = document.createElement('style');
    s.id = 'i18n-drop-css';
    s.textContent = [
      '.ld-wrap{position:relative;display:inline-block}',
      '.ld-btn{display:flex;align-items:center;gap:5px;background:var(--bg3,#1e293b);border:1px solid var(--border,#334155);border-radius:8px;padding:5px 9px;font-size:13px;color:var(--text,#f8fafc);cursor:pointer;transition:border-color .2s;white-space:nowrap;line-height:1}',
      '.ld-btn:hover{border-color:var(--green,#22c55e)}',
      '.ld-menu{display:none;position:absolute;top:calc(100% + 4px);right:0;background:var(--bg2,#0f172a);border:1px solid var(--border,#334155);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:9999;min-width:110px;overflow:hidden}',
      '.ld-menu.open{display:block}',
      '.ld-opt{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:13px;color:var(--text2,#94a3b8);cursor:pointer;transition:background .15s;white-space:nowrap;border:none;background:none;width:100%;text-align:left}',
      '.ld-opt:hover,.ld-opt.active{background:var(--bg3,#1e293b);color:var(--text,#f8fafc)}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildSwitcher() {
    var wrap = document.getElementById('lang-switcher');
    if (!wrap) return;
    _injectCSS();
    var lang = getLang();

    var drop = document.createElement('div');
    drop.className = 'ld-wrap';

    var btn = document.createElement('button');
    btn.className = 'ld-btn';
    btn.type = 'button';
    btn.title = 'Language / Langue / Idioma';
    btn.appendChild(_flagImg(lang));
    var lbl = document.createElement('span');
    lbl.textContent = NAMES[lang];
    btn.appendChild(lbl);
    var arr = document.createElement('span');
    arr.textContent = ' ▾';
    arr.style.fontSize = '10px';
    btn.appendChild(arr);

    var menu = document.createElement('div');
    menu.className = 'ld-menu';
    menu.id = 'ld-menu-' + Math.random().toString(36).slice(2);

    SUPPORTED.forEach(function (code) {
      var opt = document.createElement('button');
      opt.className = 'ld-opt' + (code === lang ? ' active' : '');
      opt.type = 'button';
      opt.appendChild(_flagImg(code));
      var t = document.createElement('span');
      t.textContent = NAMES[code];
      opt.appendChild(t);
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        try { localStorage.setItem('cnova_lang', code); } catch (_) {}
        var u = new URL(window.location.href);
        u.searchParams.set('lang', code);
        window.location.href = u.toString();
      });
      menu.appendChild(opt);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
      arr.textContent = menu.classList.contains('open') ? ' ▴' : ' ▾';
    });

    document.addEventListener('click', function () {
      menu.classList.remove('open');
      arr.textContent = ' ▾';
    });

    drop.appendChild(btn);
    drop.appendChild(menu);
    wrap.innerHTML = '';
    wrap.appendChild(drop);
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.t = get;
  window.i18nApply = applyAll; // call after dynamic DOM changes

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    buildSwitcher();
    load(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
